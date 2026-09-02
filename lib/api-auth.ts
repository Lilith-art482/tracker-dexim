import { NextRequest, NextResponse } from "next/server";
import { getUidFromAuthHeader } from "@/lib/firebase-admin";

export interface AuthResult {
  ok: boolean;
  uid: string | null;
  response?: NextResponse;
}

/**
 * Verifies the Firebase ID token from the Authorization header and, when
 * `requestedUid` is provided, requires that it matches the token's uid.
 * The `uid` value passed by the client is only a hint — the true identity
 * comes from the server-verified token.
 */
export async function requireAuth(
  request: NextRequest,
  requestedUid?: string | null,
): Promise<AuthResult> {
  const uid = await getUidFromAuthHeader(request.headers.get("authorization"));
  if (!uid) {
    return {
      ok: false,
      uid: null,
      response: NextResponse.json(
        { error: "Не авторизованы" },
        { status: 401 },
      ),
    };
  }
  if (requestedUid != null && uid !== requestedUid) {
    return {
      ok: false,
      uid,
      response: NextResponse.json({ error: "Нет доступа" }, { status: 403 }),
    };
  }
  return { ok: true, uid };
}
