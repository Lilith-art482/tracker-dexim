import { NextRequest, NextResponse } from "next/server";

// In-memory store (same as other GA endpoints)
const gaSecrets = new Map<string, string>();

// Generate a random base32 secret for GA setup
function generateSecret(length: number = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Simple TOTP code generation for verification
function generateTOTP(secret: string, window: number = 0): string {
  const time = Math.floor(Date.now() / 30000) + window;
  let hash = 0;
  const str = secret + time.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, "0");
}

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Check if GA is already set up
    if (gaSecrets.has(uid)) {
      const existingSecret = gaSecrets.get(uid)!;
      return NextResponse.json({
        secret: existingSecret,
        otpauthUrl: `otpauth://totp/InMotion:${uid}?secret=${existingSecret}&issuer=InMotion`,
      });
    }

    // Generate new secret
    const secret = generateSecret();
    gaSecrets.set(uid, secret);

    return NextResponse.json({
      secret,
      otpauthUrl: `otpauth://totp/InMotion:${uid}?secret=${secret}&issuer=InMotion`,
    });
  } catch {
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}

// Verify setup (user scans QR and enters code)
export async function PUT(request: NextRequest) {
  try {
    const { uid, code } = await request.json();

    if (!uid || !code) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const secret = gaSecrets.get(uid);
    if (!secret) {
      return NextResponse.json({ verified: false, error: "GA not set up" }, { status: 400 });
    }

    // Check current window and ±1 window
    let isValid = false;
    for (let window = -1; window <= 1; window++) {
      if (generateTOTP(secret, window) === code) {
        isValid = true;
        break;
      }
    }

    return NextResponse.json({ verified: isValid });
  } catch {
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
