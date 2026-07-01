import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/db";
import { getAllUsers } from "@/lib/models";
import { mockUsers } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  if (dbAvailable) {
    try {
      const users = await getAllUsers();
      return NextResponse.json(users);
    } catch {
      return NextResponse.json([]);
    }
  }

  return NextResponse.json(mockUsers);
}
