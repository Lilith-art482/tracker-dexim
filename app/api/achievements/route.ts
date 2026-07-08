import { NextResponse } from "next/server";
import { getAllAchievements, createAchievement } from "@/lib/habit-models";

export async function GET() {
  const achievements = await getAllAchievements();
  return NextResponse.json(achievements);
}

export async function POST(request: Request) {
  const body = await request.json();
  const achievement = await createAchievement(body);
  return NextResponse.json(achievement, { status: 201 });
}
