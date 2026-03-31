import { NextResponse } from "next/server";
import { readSession, listSessions } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filename = decodeURIComponent(id);

  // Verify the session exists
  const sessions = listSessions();
  const session = sessions.find((s) => s.name === filename);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = readSession(filename);
  return NextResponse.json({
    name: session.name,
    date: session.date.toISOString(),
    size: session.size,
    isCron: session.isCron,
    messages,
    messageCount: messages.length,
  });
}
