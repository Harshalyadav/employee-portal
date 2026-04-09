import { NextRequest } from 'next/server';
import { proxyToUpstream } from '@/app/api/_utils/guarded-proxy';

export async function POST(request: NextRequest) {
  return proxyToUpstream(request, '/api/auth/verify-otp');
}