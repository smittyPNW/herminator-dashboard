import { NextResponse } from "next/server";
import { listSkills } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = listSkills();
  return NextResponse.json(categories);
}
