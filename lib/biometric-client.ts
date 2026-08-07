"use client";

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function isWebAuthnSupported(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!browserSupportsWebAuthn()) return false;
  return platformAuthenticatorIsAvailable();
}

export async function registerBiometric(
  uid: string,
  deviceName?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const optsRes = await fetch("/api/auth/biometric/register-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });

    if (!optsRes.ok) {
      const err = await optsRes.json();
      return { success: false, error: err.error || "Ошибка подготовки" };
    }

    const { challengeId, options } = await optsRes.json();

    const registrationResponse = await startRegistration(options);

    const res = await fetch("/api/auth/biometric/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        challengeId,
        deviceName: deviceName || getDeviceName(),
        registrationResponse,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || "Ошибка сохранения" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function loginWithBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const optsRes = await fetch("/api/auth/biometric/authenticate-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!optsRes.ok) {
      const err = await optsRes.json();
      return { success: false, error: err.error || "Ошибка подготовки" };
    }

    const { challengeId, options } = await optsRes.json();

    const authenticationResponse = await startAuthentication(options);

    const res = await fetch("/api/auth/biometric/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, authenticationResponse }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || "Ошибка входа" };
    }

    const data = await res.json();
    await signInWithCustomToken(auth, data.token);
    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Устройство";
  const ua = navigator.userAgent;
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows PC";
  if (ua.includes("Android")) return "Android";
  return "Устройство";
}

function getErrorMessage(error: unknown): string {
  const err = error as { name?: string; message?: string };
  if (err?.name === "NotAllowedError") return "Отменено пользователем";
  if (err?.name === "NotSupportedError") {
    return "Устройство не поддерживает биометрию";
  }
  if (err?.name === "SecurityError") return "Ошибка безопасности";
  if (err?.message) return err.message;
  return "Ошибка";
}
