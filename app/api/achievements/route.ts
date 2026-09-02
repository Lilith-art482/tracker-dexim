import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getAchievementsByOwner, createAchievement } from "@/lib/habit-models";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const achievements = await getAchievementsByOwner(uid);
  return NextResponse.json(achievements);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const uid = authResult.uid!;

  const body = await request.json();
  const achievement = await createAchievement({
    ...body,
    ownerId: uid,
  });
  return NextResponse.json(achievement, { status: 201 });
}
