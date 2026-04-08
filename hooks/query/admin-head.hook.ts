"use client";

import { API_ROUTE } from "@/routes";
import { createAdminHead, createManagerByHead, deleteAdminHead, deleteAdminManager, getAdminHeadById, getAdminHeads, getAdminManagers, getMyCreatedManagers, updateAdminHead } from "@/service";
import { IAdminHeadListResponse, IAdminHeadUpsertRequest, IAdminHead } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "@/stores";
import { getAdminHeadAccessRole } from "@/lib/admin-head-access";

export function useAdminHeads(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = "active",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
  enabled: boolean = true,
) {
  return useQuery<IAdminHeadListResponse>({
    queryKey: [API_ROUTE.ADMIN_HEAD.ALL.ID, "heads", page, limit, search, status, sortBy, sortOrder],
    queryFn: () => getAdminHeads(page, limit, search, status, sortBy, sortOrder),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useAdminManagers(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status: string = "active",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
  enabled: boolean = true,
) {
  const { user } = useAppStore();
  const accessRole = getAdminHeadAccessRole(user);
  const isHeadRole = accessRole === "HR_HEAD" || accessRole === "VISA_HEAD" || accessRole === "ACCOUNT_HEAD";

  return useQuery<IAdminHeadListResponse>({
    queryKey: [API_ROUTE.ADMIN_HEAD.ALL.ID, "managers", isHeadRole ? "my-created" : "all", page, limit, search, status, sortBy, sortOrder],
    queryFn: async () => {
      if (!isHeadRole) {
        return getAdminManagers(page, limit, search, status, sortBy, sortOrder);
      }

      const managers = await getMyCreatedManagers();
      const filtered = search
        ? managers.filter((u) => {
            const query = search.toLowerCase();
            return (
              String(u.name || u.fullName || "").toLowerCase().includes(query) ||
              String(u.email || "").toLowerCase().includes(query) ||
              String(u.phone || u.phoneNumber || "").toLowerCase().includes(query)
            );
          })
        : managers;

      const start = Math.max(0, (page - 1) * Math.max(1, limit));
      const end = start + Math.max(1, limit);
      const pageData = filtered.slice(start, end);

      return {
        data: pageData,
        pagination: {
          page,
          limit,
          total: filtered.length,
          pages: Math.max(1, Math.ceil(filtered.length / Math.max(1, limit))),
        },
      };
    },
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useAdminHead(id?: string) {
  return useQuery<IAdminHead>({
    queryKey: [API_ROUTE.ADMIN_HEAD.VIEW.ID, id],
    queryFn: () => {
      if (!id) {
        throw new Error("Admin head ID is required");
      }

      return getAdminHeadById(id);
    },
    enabled: !!id,
  });
}

export function useCreateAdminHead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ headRole, data }: { headRole: string; data: IAdminHeadUpsertRequest }) => {
      const role = String(headRole || "").trim().toUpperCase();
      if (role.endsWith("_MANAGER")) {
        return createManagerByHead(role, data);
      }
      return createAdminHead(role, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.ADMIN_HEAD.ALL.ID] });
    },
  });
}

export function useUpdateAdminHead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IAdminHeadUpsertRequest }) => updateAdminHead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.ADMIN_HEAD.ALL.ID] });
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.ADMIN_HEAD.VIEW.ID, variables.id] });
    },
  });
}

export function useDeleteAdminHead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, roleName }: { id: string; roleName?: string }) => {
      const normalized = String(roleName || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
      if (normalized.endsWith("_MANAGER")) {
        return deleteAdminManager(id);
      }
      return deleteAdminHead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.ADMIN_HEAD.ALL.ID] });
    },
  });
}