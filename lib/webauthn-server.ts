import { NextRequest } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import { getAdminDb } from "@/lib/firebase-admin";

export interface StoredWebAuthnCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  deviceName?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

export interface BiometricChallenge {
  type: "register" | "authenticate";
  uid: string | null;
  challenge: string;
  createdAt: string;
  expiresAt: string;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const RP_NAME = "In Motion";

const ALLOWED_ORIGINS = (
  process.env.WEBAUTHN_ALLOWED_ORIGINS ??
  "http://localhost:8080,http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

function bufferToBase64Url(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString("base64url");
}

function base64UrlToBuffer(base64Url: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64Url, "base64url"));
}

export function getWebAuthnOrigin(request: NextRequest): string {
  return request.headers.get("origin") ?? new URL(request.url).origin;
}

export function getWebAuthnRpId(origin: string): string {
  return new URL(origin).hostname;
}

function toCredentialJson(cred: WebAuthnCredential): StoredWebAuthnCredential {
  return {
    id: cred.id,
    publicKey: bufferToBase64Url(cred.publicKey),
    counter: cred.counter,
    transports: cred.transports,
  };
}

function toWebAuthnCredential(
  cred: StoredWebAuthnCredential,
): WebAuthnCredential {
  return {
    id: cred.id,
    publicKey: base64UrlToBuffer(cred.publicKey) as Uint8Array<ArrayBuffer>,
    counter: cred.counter,
    transports: cred.transports as WebAuthnCredential["transports"] | undefined,
  };
}

async function getCredentials(
  uid: string,
): Promise<StoredWebAuthnCredential[]> {
  const db = getAdminDb();
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return [];
  const creds = doc.data()?.biometricCredentials;
  return Array.isArray(creds) ? (creds as StoredWebAuthnCredential[]) : [];
}

async function setCredentials(
  uid: string,
  credentials: StoredWebAuthnCredential[],
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("users")
    .doc(uid)
    .set({ biometricCredentials: credentials }, { merge: true });
}

export async function getBiometricCredentials(
  uid: string,
): Promise<StoredWebAuthnCredential[]> {
  return getCredentials(uid);
}

async function createChallenge(
  type: BiometricChallenge["type"],
  uid: string | null,
  challenge: string,
): Promise<string> {
  const db = getAdminDb();
  const id = crypto.randomUUID();
  const now = Date.now();
  const payload: BiometricChallenge = {
    type,
    uid,
    challenge,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + CHALLENGE_TTL_MS).toISOString(),
  };
  await db.collection("biometricChallenges").doc(id).set(payload);
  return id;
}

async function consumeChallenge(
  challengeId: string,
  expectedType: BiometricChallenge["type"],
): Promise<BiometricChallenge | null> {
  const db = getAdminDb();
  const doc = await db.collection("biometricChallenges").doc(challengeId).get();
  if (!doc.exists) return null;
  const data = doc.data() as BiometricChallenge;
  await doc.ref.delete();
  if (data.type !== expectedType) return null;
  if (Date.now() > new Date(data.expiresAt).getTime()) return null;
  return data;
}

export async function generateBiometricRegistrationOptions(
  uid: string,
  rpId: string,
): Promise<{
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}> {
  const db = getAdminDb();
  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : {};
  const email = (userData?.email as string) || uid;
  const nickname = (userData?.nickname as string) || email;

  const credentials = await getCredentials(uid);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpId,
    userID: new TextEncoder().encode(uid),
    userName: email,
    userDisplayName: nickname,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    },
    excludeCredentials: credentials.map((c) => ({ id: c.id })),
    timeout: 60000,
  });

  const challengeId = await createChallenge("register", uid, options.challenge);

  return { challengeId, options };
}

export async function verifyBiometricRegistration(
  challengeId: string,
  uid: string,
  registrationResponse: RegistrationResponseJSON,
  expectedOrigin: string,
  deviceName: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const challenge = await consumeChallenge(challengeId, "register");
  if (!challenge || challenge.uid !== uid) {
    return { success: false, error: "Сессия регистрации истекла" };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challenge.challenge,
      expectedOrigin,
      expectedRPID: getWebAuthnRpId(expectedOrigin),
      requireUserVerification: true,
    });
  } catch {
    return { success: false, error: "Не удалось проверить биометрию" };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { success: false, error: "Не удалось проверить биометрию" };
  }

  const stored = {
    ...toCredentialJson(verification.registrationInfo.credential),
    deviceName: deviceName || "Устройство",
    createdAt: new Date().toISOString(),
  };
  const credentials = await getCredentials(uid);
  if (!credentials.some((c) => c.id === stored.id)) {
    credentials.push(stored);
    await setCredentials(uid, credentials);
  }

  return { success: true };
}

export async function generateBiometricAuthenticationOptions(
  rpId: string,
): Promise<{
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}> {
  const options = await generateAuthenticationOptions({
    rpID: rpId,
    allowCredentials: [],
    userVerification: "required",
    timeout: 60000,
  });

  const challengeId = await createChallenge(
    "authenticate",
    null,
    options.challenge,
  );
  return { challengeId, options };
}

export async function verifyBiometricAuthentication(
  challengeId: string,
  authenticationResponse: AuthenticationResponseJSON,
  expectedOrigin: string,
): Promise<{ success: true; uid: string } | { success: false; error: string }> {
  const challenge = await consumeChallenge(challengeId, "authenticate");
  if (!challenge) {
    return { success: false, error: "Сессия входа истекла" };
  }

  const userHandle = authenticationResponse.response.userHandle;
  if (!userHandle) {
    return { success: false, error: "Не удалось определить пользователя" };
  }

  const uid = new TextDecoder().decode(base64UrlToBuffer(userHandle));
  const credentials = await getCredentials(uid);
  const stored = credentials.find((c) => c.id === authenticationResponse.id);

  if (!stored) {
    return { success: false, error: "Биометрия не привязана к аккаунту" };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge.challenge,
      expectedOrigin,
      expectedRPID: getWebAuthnRpId(expectedOrigin),
      credential: toWebAuthnCredential(stored),
      requireUserVerification: true,
    });
  } catch {
    return { success: false, error: "Не удалось проверить биометрию" };
  }

  if (!verification.verified) {
    return { success: false, error: "Не удалось проверить биометрию" };
  }

  const updated = credentials.map((c) =>
    c.id === stored.id
      ? {
          ...c,
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: new Date().toISOString(),
        }
      : c,
  );
  await setCredentials(uid, updated);

  return { success: true, uid };
}

export async function removeBiometricCredential(
  uid: string,
  credentialId: string,
): Promise<boolean> {
  const credentials = await getCredentials(uid);
  const next = credentials.filter((c) => c.id !== credentialId);
  if (next.length === credentials.length) return false;
  await setCredentials(uid, next);
  return true;
}
