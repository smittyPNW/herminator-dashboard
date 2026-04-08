import { NextResponse } from "next/server";
import { listSessionsAcrossInstances, readSession, resolveHermesHome } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filename = decodeURIComponent(id);
  const requestedHome = new URL(request.url).searchParams.get("home");
  const homeDir = requestedHome ? resolveHermesHome(requestedHome) : null;

  const sessions = listSessionsAcrossInstances();
  const session = sessions.find((s) => s.name === filename && (!homeDir || s.homeDir === homeDir));
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = readSession(filename, session.homeDir);
  return NextResponse.json({
    name: session.name,
    date: session.date.toISOString(),
    size: session.size,
    isCron: session.isCron,
    instance: session.instance,
    homeDir: session.homeDir,
    messages,
    messageCount: messages.length,
  });
}
