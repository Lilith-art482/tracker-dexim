import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/firebase";

export async function GET() {
  const dbAvailable = await isDatabaseAvailable();

  return NextResponse.json({
    status: "ok",
    database: dbAvailable ? "connected" : "disconnected",
    mode: dbAvailable ? "fullstack" : "static",
    timestamp: new Date().toISOString(),
  });
}
