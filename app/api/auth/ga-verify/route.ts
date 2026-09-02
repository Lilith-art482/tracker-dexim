import { NextRequest, NextResponse } from "next/server";

// In production, this would verify against Firestore and use a TOTP library
// For now, we use a simple mock verification

// Simple TOTP implementation (6-digit code, 30-second window)
function generateTOTP(secret: string, window: number = 0): string {
  const time = Math.floor(Date.now() / 30000) + window;
  // Simple hash for demo - in production use proper TOTP (speakeasy, otpauth, etc.)
  let hash = 0;
  const str = secret + time.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, "0");
}

function verifyTOTP(secret: string, code: string): boolean {
  // Check current window and ±1 window (30 seconds each)
  for (let window = -1; window <= 1; window++) {
    if (generateTOTP(secret, window) === code) {
      return true;
    }
  }
  return false;
}

// In-memory store (same as ga-status)
const gaSecrets = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { uid, code } = await request.json();

    if (!uid || !code) {
      return NextResponse.json({ valid: false, error: "Missing uid or code" }, { status: 400 });
    }

    const secret = gaSecrets.get(uid);
    if (!secret) {
      // GA not enabled for this user - allow access
      return NextResponse.json({ valid: true });
    }

    const isValid = verifyTOTP(secret, code);

    return NextResponse.json({ valid: isValid });
  } catch {
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}
