import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import { IApiResponse, IPagination } from "@/types/branch.type";
import { IAdminHead, IAdminHeadListResponse, IAdminHeadUpsertRequest } from "@/types";

const defaultPagination = (page: number, limit: number, total: number): IPagination => ({
  page,
  total,
  pages: Math.max(1, Math.ceil(total / Math.max(limit, 1))),
});

const unwrapData = <T>(payload: unknown): T => {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

export async function getAdminHeads(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = "active",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<IAdminHeadListResponse> {
  const response = await axiosInstance.get<IApiResponse<IAdminHead[]> | { data?: IAdminHead[]; pagination?: IPagination }>(
    API_ROUTE.ADMIN_HEAD.ALL.PATH,
    {
      params: {
        page,
        limit,
        status,
        sortBy,
        sortOrder,
        search: search || undefined,
      },
    },
  );

  const responseData = response.data as unknown as { data?: unknown; pagination?: IPagination };
  const unwrapped = unwrapData<unknown>(responseData);
  const data = Array.isArray(unwrapped)
    ? unwrapped as IAdminHead[]
    : Array.isArray((unwrapped as { data?: unknown[] })?.data)
      ? ((unwrapped as { data?: unknown[] }).data as IAdminHead[])
      : [];

  return {
    data,
    pagination: responseData.pagination || (unwrapped as { pagination?: IPagination })?.pagination || defaultPagination(page, limit, data.length),
  };
}

export async function getAdminManagers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = "active",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<IAdminHeadListResponse> {
  const response = await axiosInstance.get<IApiResponse<IAdminHead[]> | { data?: IAdminHead[]; pagination?: IPagination }>(
    API_ROUTE.ADMIN_HEAD.MANAGERS.PATH,
    {
      params: {
        page,
        limit,
        status,
        sortBy,
        sortOrder,
        search: search || undefined,
      },
    },
  );

  const responseData = response.data as unknown as { data?: unknown; pagination?: IPagination };
  const unwrapped = unwrapData<unknown>(responseData);
  const data = Array.isArray(unwrapped)
    ? unwrapped as IAdminHead[]
    : Array.isArray((unwrapped as { data?: unknown[] })?.data)
      ? ((unwrapped as { data?: unknown[] }).data as IAdminHead[])
      : [];

  return {
    data,
    pagination: responseData.pagination || (unwrapped as { pagination?: IPagination })?.pagination || defaultPagination(page, limit, data.length),
  };
}

export async function getMyCreatedManagers(): Promise<IAdminHead[]> {
  const response = await axiosInstance.get<IApiResponse<IAdminHead[]> | { data?: IAdminHead[] }>(
    API_ROUTE.ADMIN_HEAD.MY_CREATED_MANAGERS.PATH,
  );
  const unwrapped = unwrapData<unknown>(response.data as unknown as { data?: unknown });
  if (Array.isArray(unwrapped)) {
    return unwrapped as IAdminHead[];
  }
  if (Array.isArray((unwrapped as { data?: unknown[] })?.data)) {
    return (unwrapped as { data?: IAdminHead[] }).data || [];
  }
  return [];
}

export async function getAdminHeadById(id: string): Promise<IAdminHead> {
  const response = await axiosInstance.get<IApiResponse<IAdminHead> | { data?: IAdminHead }>(
    API_ROUTE.ADMIN_HEAD.VIEW.PATH(id),
  );

  return unwrapData<IAdminHead>(response.data);
}

export async function createAdminHead(headRole: string, data: IAdminHeadUpsertRequest): Promise<IAdminHead> {
  const response = await axiosInstance.post<IApiResponse<IAdminHead> | { data?: IAdminHead }>(
    API_ROUTE.ADMIN_HEAD.CREATE.PATH(headRole),
    data,
  );

  return unwrapData<IAdminHead>(response.data);
}

export async function createManagerByHead(managerRole: string, data: IAdminHeadUpsertRequest): Promise<IAdminHead> {
  const response = await axiosInstance.post<IApiResponse<IAdminHead> | { data?: IAdminHead }>(
    API_ROUTE.ADMIN_HEAD.CREATE_MANAGER.PATH(managerRole),
    data,
  );
  return unwrapData<IAdminHead>(response.data);
}

export async function updateAdminHead(id: string, data: IAdminHeadUpsertRequest): Promise<IAdminHead> {
  const response = await axiosInstance.patch<IApiResponse<IAdminHead> | { data?: IAdminHead }>(
    API_ROUTE.ADMIN_HEAD.UPDATE.PATH(id),
    data,
  );

  return unwrapData<IAdminHead>(response.data);
}

export async function deleteAdminHead(id: string): Promise<void> {
  await axiosInstance.delete(API_ROUTE.ADMIN_HEAD.DELETE.PATH(id));
}

export async function deleteAdminManager(id: string): Promise<void> {
  await axiosInstance.delete(API_ROUTE.ADMIN_HEAD.DELETE_MANAGER.PATH(id));
}