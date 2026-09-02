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

async function readError(res: Response): Promise<string | null> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
  } catch {
    // ignore — fall back to text/status
  }
  try {
    const text = await res.text();
    if (text && text.trim()) return text.trim();
  } catch {
    // ignore
  }
  return null;
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function registerBiometric(
  uid: string,
  deviceName?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    if (!token) {
      return { success: false, error: "Вы не авторизованы" };
    }

    const optsRes = await fetch("/api/auth/biometric/register-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ uid }),
    });

    if (!optsRes.ok) {
      const err = await readError(optsRes);
      return {
        success: false,
        error: err || `Ошибка подготовки (${optsRes.status})`,
      };
    }

    const data = await readJson<{
      challengeId: string;
      options: Record<string, unknown>;
    }>(optsRes);
    if (!data || !data.challengeId || !data.options) {
      return {
        success: false,
        error: "Некорректный ответ сервера",
      };
    }

    const registrationResponse = await startRegistration(data.options as never);

    const res = await fetch("/api/auth/biometric/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uid,
        challengeId: data.challengeId,
        deviceName: deviceName || getDeviceName(),
        registrationResponse,
      }),
    });

    if (!res.ok) {
      const err = await readError(res);
      return {
        success: false,
        error: err || `Ошибка сохранения (${res.status})`,
      };
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
      const err = await readError(optsRes);
      return {
        success: false,
        error: err || `Ошибка подготовки (${optsRes.status})`,
      };
    }

    const data = await readJson<{
      challengeId: string;
      options: Record<string, unknown>;
    }>(optsRes);
    if (!data || !data.challengeId || !data.options) {
      return {
        success: false,
        error: "Некорректный ответ сервера",
      };
    }

    const authenticationResponse = await startAuthentication(
      data.options as never,
    );

    const res = await fetch("/api/auth/biometric/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: data.challengeId,
        authenticationResponse,
      }),
    });

    if (!res.ok) {
      const err = await readError(res);
      return {
        success: false,
        error: err || `Ошибка входа (${res.status})`,
      };
    }

    const authData = await readJson<{ token: string }>(res);
    if (!authData?.token) {
      return { success: false, error: "Некорректный ответ сервера" };
    }
    await signInWithCustomToken(auth, authData.token);
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
