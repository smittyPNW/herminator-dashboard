import { NextResponse } from "next/server";
import { readSkillMd } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; skill: string }> }
) {
  const { category, skill } = await params;
  const content = readSkillMd(category, skill);
  if (!content) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  return NextResponse.json({ content });
}
