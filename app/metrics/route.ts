import { Registry, collectDefaultMetrics } from 'prom-client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const register = new Registry();
collectDefaultMetrics({
  register,
  prefix: 'hrms_frontend_',
});

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    status: 200,
    headers: { 'Content-Type': register.contentType },
  });
}
