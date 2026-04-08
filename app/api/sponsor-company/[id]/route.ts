import { enforceForbiddenAccessRoles, proxyToUpstream } from "@/app/api/_utils/guarded-proxy";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const SPONSOR_COMPANY_BLOCK_MESSAGE =
  "HR Head and Account Head are not allowed to access sponsor company.";

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const guard = await enforceForbiddenAccessRoles(request, ["HR_HEAD", "ACCOUNT_HEAD"], SPONSOR_COMPANY_BLOCK_MESSAGE);

  if ("error" in guard) {
    return guard.error;
  }

  return proxyToUpstream(request, `/api/sponsor-company/${id}`, guard.authorization);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const guard = await enforceForbiddenAccessRoles(request, ["HR_HEAD", "ACCOUNT_HEAD"], SPONSOR_COMPANY_BLOCK_MESSAGE);

  if ("error" in guard) {
    return guard.error;
  }

  return proxyToUpstream(request, `/api/sponsor-company/${id}`, guard.authorization);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const guard = await enforceForbiddenAccessRoles(request, ["HR_HEAD", "ACCOUNT_HEAD"], SPONSOR_COMPANY_BLOCK_MESSAGE);

  if ("error" in guard) {
    return guard.error;
  }

  return proxyToUpstream(request, `/api/sponsor-company/${id}`, guard.authorization);
}