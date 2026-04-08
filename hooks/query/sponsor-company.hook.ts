"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ROUTE } from "@/routes";
import {
  createSponsorCompany,
  deleteSponsorCompany,
  getSponsorCompanies,
  getSponsorCompanyById,
  updateSponsorCompany,
} from "@/service";
import { CreateSponsorCompanyDto, UpdateSponsorCompanyDto } from "@/types/sponsor-company.type";

export const useSponsorCompanies = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: [API_ROUTE.SPONSOR_COMPANY.ALL.ID, page, limit, search],
    queryFn: () => getSponsorCompanies(page, limit, search),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useSponsorCompanyById = (id?: string) => {
  return useQuery({
    queryKey: [API_ROUTE.SPONSOR_COMPANY.VIEW.ID, id],
    queryFn: () => {
      if (!id) throw new Error("Sponsor company ID is required");
      return getSponsorCompanyById(id);
    },
    enabled: !!id,
  });
};

export const useCreateSponsorCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSponsorCompanyDto) => createSponsorCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.SPONSOR_COMPANY.ALL.ID] });
    },
  });
};

export const useUpdateSponsorCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSponsorCompanyDto }) =>
      updateSponsorCompany(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.SPONSOR_COMPANY.ALL.ID] });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.SPONSOR_COMPANY.VIEW.ID, variables.id],
      });
    },
  });
};

export const useDeleteSponsorCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSponsorCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ROUTE.SPONSOR_COMPANY.ALL.ID] });
    },
  });
};
