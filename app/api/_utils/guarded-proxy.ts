import { getAdminHeadAccessRole } from "@/lib/admin-head-access";
import { NextRequest, NextResponse } from "next/server";

type GuardedUser = Record<string, any>;
type AccessRole = "ACCOUNT_HEAD" | "HR_HEAD" | "VISA_HEAD" | "ACCOUNT_MANAGER" | "HR_MANAGER" | "VISA_MANAGER" | null;

const getApiBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  return baseUrl.replace(/\/$/, "");
};

const getAuthorizationHeader = (request: NextRequest) => {
  const header = request.headers.get("authorization");

  if (header) {
    return header;
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  return accessToken ? `Bearer ${accessToken}` : null;
};

const extractUserFromProfilePayload = (payload: any) => {
  return payload?.data?.user ?? payload?.user ?? payload?.data ?? payload ?? null;
};

const extractDataPayload = (payload: any) => payload?.data ?? payload;

const responseFromUpstream = (response: Response) => {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  });
};

export const jsonError = (message: string, status: number) => {
  return NextResponse.json({ message }, { status });
};

export const resolveRequestUser = async (request: NextRequest) => {
  const authorization = getAuthorizationHeader(request);

  if (!authorization) {
    return { error: jsonError("Unauthorized", 401) };
  }

  const apiBaseUrl = getApiBaseUrl();
  const profileResponse = await fetch(`${apiBaseUrl}/api/auth/profile`, {
    headers: {
      Authorization: authorization,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!profileResponse.ok) {
    return {
      error: jsonError(
        profileResponse.status === 401 ? "Unauthorized" : "Failed to resolve current user",
        profileResponse.status,
      ),
    };
  }

  const profilePayload = await profileResponse.json();
  const user = extractUserFromProfilePayload(profilePayload) as GuardedUser | null;

  if (!user) {
    return { error: jsonError("Unauthorized", 401) };
  }

  if (typeof user.roleId === "string" && !user.role) {
    const roleResponse = await fetch(`${apiBaseUrl}/api/roles/${user.roleId}`, {
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (roleResponse.ok) {
      const rolePayload = await roleResponse.json();
      user.role = extractDataPayload(rolePayload);
    }
  }

  return { authorization, user };
};

export const enforceForbiddenAccessRoles = async (
  request: NextRequest,
  forbiddenRoles: AccessRole[],
  message: string,
) => {
  const resolved = await resolveRequestUser(request);

  if ("error" in resolved) {
    return resolved;
  }

  const accessRole = getAdminHeadAccessRole(resolved.user as any);

  if (forbiddenRoles.includes(accessRole)) {
    return { error: jsonError(message, 403) };
  }

  return { authorization: resolved.authorization, user: resolved.user, accessRole };
};

export const proxyToUpstream = async (
  request: NextRequest,
  upstreamPath: string,
  authorization?: string | null,
) => {
  const apiBaseUrl = getApiBaseUrl();
  const upstreamUrl = new URL(`${apiBaseUrl}${upstreamPath}`);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const authHeader = authorization || getAuthorizationHeader(request);
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (accept) {
    headers.set("Accept", accept);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.text();
    if (body) {
      init.body = body;
    }
  }

  const response = await fetch(upstreamUrl.toString(), init);
  return responseFromUpstream(response);
};