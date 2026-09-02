import * as OTPAuth from "otpauth";
import { getAdminDb } from "./firebase-admin";
import type { Firestore } from "firebase-admin/firestore";

export type TotpSettings = {
  enabled: boolean;
  requireOnLogin: boolean;
  requireOnEmailChange: boolean;
  requireOnPasswordChange: boolean;
  requireForBiometric: boolean;
};

export const DEFAULT_TOTP_SETTINGS: TotpSettings = {
  enabled: false,
  requireOnLogin: true,
  requireOnEmailChange: true,
  requireOnPasswordChange: true,
  requireForBiometric: true,
};

function getDb(): Firestore | null {
  try {
    return getAdminDb();
  } catch {
    return null;
  }
}

export function createTotp(secret?: string | InstanceType<typeof OTPAuth.Secret>): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    label: "In Motion",
    issuer: "In Motion",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret || new OTPAuth.Secret({ size: 20 }),
  });
}

export function generateTotpSetup(email: string): {
  secret: string;
  uri: string;
} {
  const totp = createTotp();
  totp.label = email;
  return { secret: totp.secret.base32, uri: totp.toString() };
}

export function verifyTotpCode(secret: string, token: string): boolean {
  const totp = createTotp(OTPAuth.Secret.fromBase32(secret));
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export async function getTotpDoc(uid: string) {
  const db = getDb();
  if (!db) return null;
  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  return data?.totp as
    | { secret: string; enabled: boolean; settings: TotpSettings; tempSecret?: string }
    | undefined;
}

export async function saveTempSecret(uid: string, secret: string, uri: string) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  await db.collection("users").doc(uid).set(
    { totp: { tempSecret: secret, tempUri: uri, enabled: false, settings: DEFAULT_TOTP_SETTINGS } },
    { merge: true },
  );
}

export async function confirmTotpSetup(uid: string, token: string): Promise<boolean> {
  const doc = await getTotpDoc(uid);
  const tempSecret = (doc as { tempSecret?: string })?.tempSecret;
  if (!tempSecret) return false;
  if (!verifyTotpCode(tempSecret, token)) return false;
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .collection("users")
    .doc(uid)
    .set(
      {
        totp: {
          secret: tempSecret,
          enabled: true,
          settings: DEFAULT_TOTP_SETTINGS,
        },
      },
      { merge: true },
    );
  return true;
}

export async function disableTotp(uid: string) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  await db.collection("users").doc(uid).set({ totp: null }, { merge: true });
}

export async function updateTotpSettings(uid: string, settings: Partial<TotpSettings>) {
  const db = getDb();
  if (!db) throw new Error("DB unavailable");
  const doc = await getTotpDoc(uid);
  if (!doc?.enabled) throw new Error("TOTP not enabled");
  const merged = { ...doc.settings, ...settings };
  await db.collection("users").doc(uid).set({ totp: { ...doc, settings: merged } }, { merge: true });
  return merged;
}
