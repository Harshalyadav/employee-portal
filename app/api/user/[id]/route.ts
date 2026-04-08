import { enforceForbiddenAccessRoles, proxyToUpstream } from "@/app/api/_utils/guarded-proxy";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToUpstream(request, `/api/user/${id}`);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyToUpstream(request, `/api/user/${id}`);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const guard = await enforceForbiddenAccessRoles(
    request,
    ["HR_HEAD", "ACCOUNT_HEAD"],
    "HR Head and Account Head are not allowed to delete employees.",
  );

  if ("error" in guard) {
    return guard.error;
  }

  // Deletion is blocked here before the request reaches the upstream API so direct calls to
  // this app's /api/user/:id endpoint cannot bypass the employee restriction.
  return proxyToUpstream(request, `/api/user/${id}`, guard.authorization);
}