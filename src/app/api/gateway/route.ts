import { NextResponse } from "next/server";
import { readGatewayState, gatewayControl } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = readGatewayState();
  if (!state) {
    return NextResponse.json({ state: "unknown", platforms: {} });
  }
  return NextResponse.json({
    state: state.gateway_state,
    pid: state.pid,
    platforms: state.platforms,
    updated_at: state.updated_at,
    start_time: state.start_time,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as "restart" | "stop";
    if (!["restart", "stop"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const result = gatewayControl(action);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
