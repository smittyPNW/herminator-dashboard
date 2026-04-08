import { NextResponse } from "next/server";
import { gatewayControl, getHermesFleetSummary, readGatewayState } from "@/lib/hermes";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = readGatewayState();
  const fleet = getHermesFleetSummary();
  if (!state) {
    return NextResponse.json({
      state: fleet.state || "unknown",
      platforms: {},
      runningInstances: fleet.runningInstances,
      totalInstances: fleet.totalInstances,
      totalJobs: fleet.totalJobs,
      connectedPlatforms: fleet.connectedPlatforms,
      updated_at: fleet.updatedAt,
    });
  }
  return NextResponse.json({
    state: state.gateway_state,
    pid: state.pid,
    platforms: state.platforms,
    updated_at: state.updated_at,
    start_time: state.start_time,
    runningInstances: fleet.runningInstances,
    totalInstances: fleet.totalInstances,
    totalJobs: fleet.totalJobs,
    connectedPlatforms: fleet.connectedPlatforms,
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
