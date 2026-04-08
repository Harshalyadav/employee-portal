import { NextResponse } from "next/server";

/** Force dynamic (no cache) so health always reflects current state */
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Health check endpoint for ECS, ALB, and container orchestrators.
 * GET /api/health returns 200 when the app is running.
 */
export async function GET() {
  const body = {
    status: "ok",
    service: "tally-cash-flow",
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
