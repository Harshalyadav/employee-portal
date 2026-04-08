import { enforceForbiddenAccessRoles, proxyToUpstream } from "@/app/api/_utils/guarded-proxy";
import { NextRequest } from "next/server";

const SPONSOR_COMPANY_BLOCK_MESSAGE =
  "HR Head and Account Head are not allowed to access sponsor company.";

export async function GET(request: NextRequest) {
  const guard = await enforceForbiddenAccessRoles(request, ["HR_HEAD", "ACCOUNT_HEAD"], SPONSOR_COMPANY_BLOCK_MESSAGE);

  if ("error" in guard) {
    return guard.error;
  }

  // Sponsor-company visibility is intentionally blocked at the API edge as well, so hidden
  // menus and guarded routes cannot be bypassed with direct requests to this Next API.
  return proxyToUpstream(request, "/api/sponsor-company", guard.authorization);
}

export async function POST(request: NextRequest) {
  const guard = await enforceForbiddenAccessRoles(request, ["HR_HEAD", "ACCOUNT_HEAD"], SPONSOR_COMPANY_BLOCK_MESSAGE);

  if ("error" in guard) {
    return guard.error;
  }

  return proxyToUpstream(request, "/api/sponsor-company", guard.authorization);
}