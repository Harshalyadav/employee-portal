import { NextResponse } from "next/server";

/**
 * Health check endpoint for ELB/ALB target group.
 * Returns 200 OK - no auth, redirects, or heavy logic.
 * Configure target group health check path: /health
 */
export async function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
