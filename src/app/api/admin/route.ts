import { NextRequest, NextResponse } from "next/server";
import {
  createCronJob,
  createProfile,
  cronAction,
  installSkill,
  listProfiles,
  searchSkills,
  useProfile,
} from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action === "profiles") {
    return NextResponse.json({ profiles: listProfiles() });
  }

  if (action === "skillsSearch") {
    const query = String(request.nextUrl.searchParams.get("query") || "").trim();
    const limit = Number(request.nextUrl.searchParams.get("limit") || "8");
    if (!query) {
      return NextResponse.json({ results: [] });
    }
    return NextResponse.json({ results: searchSkills(query, limit) });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "createCron") {
      const schedule = String(body.schedule || "").trim();
      const prompt = String(body.prompt || "").trim();
      const name = String(body.name || "").trim();
      const deliver = String(body.deliver || "").trim();
      const repeat = String(body.repeat || "").trim();
      const skills = Array.isArray(body.skills)
        ? (body.skills as unknown[]).map((skill: unknown) => String(skill).trim()).filter(Boolean)
        : String(body.skills || "")
            .split(",")
            .map((skill: string) => skill.trim())
            .filter(Boolean);

      if (!schedule || !prompt) {
        return NextResponse.json({ error: "Schedule and prompt are required" }, { status: 400 });
      }

      const result = createCronJob({
        schedule,
        prompt,
        name: name || undefined,
        deliver: deliver || undefined,
        repeat: repeat || undefined,
        skills,
      });

      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    if (action === "cronAction") {
      const jobId = String(body.jobId || "").trim();
      const verb = body.verb as "pause" | "resume" | "run" | "remove";
      if (!jobId || !["pause", "resume", "run", "remove"].includes(verb)) {
        return NextResponse.json({ error: "Job ID and valid verb are required" }, { status: 400 });
      }
      const result = cronAction(verb, jobId);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    if (action === "createProfile") {
      const profileName = String(body.profileName || "").trim();
      const clone = Boolean(body.clone);

      if (!profileName) {
        return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
      }

      const result = createProfile({ profileName, clone });
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    if (action === "useProfile") {
      const profileName = String(body.profileName || "").trim();
      if (!profileName) {
        return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
      }
      const result = useProfile(profileName);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    if (action === "installSkill") {
      const identifier = String(body.identifier || "").trim();
      const category = String(body.category || "").trim();
      if (!identifier) {
        return NextResponse.json({ error: "Skill identifier is required" }, { status: 400 });
      }
      const result = installSkill(identifier, category || undefined);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
