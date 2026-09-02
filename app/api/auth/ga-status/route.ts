import { NextRequest, NextResponse } from "next/server";

// In production, this would check Firestore for the user's GA secret
// For now, we use a simple in-memory store (demo purposes)
const gaSecrets = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ enabled: false }, { status: 400 });
    }

    // Check if user has GA enabled (has a secret stored)
    const hasGA = gaSecrets.has(uid);

    return NextResponse.json({ enabled: hasGA });
  } catch {
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}

// Helper to set GA secret (called from setup endpoint)
export function setGASecret(uid: string, secret: string) {
  gaSecrets.set(uid, secret);
}

export function getGASecret(uid: string): string | undefined {
  return gaSecrets.get(uid);
}
