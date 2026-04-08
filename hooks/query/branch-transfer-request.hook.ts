"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransferRequest,
  getPendingTransferRequests,
  acceptTransferRequest,
  rejectTransferRequest,
  CreateTransferRequestDto,
} from "@/service/branch-transfer-request.service";
import { API_ROUTE } from "@/routes";
import { toast } from "sonner";

export const useCreateTransferRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTransferRequestDto) => createTransferRequest(dto),
    onSuccess: (data, variables) => {
      toast.success(
        data?.message ?? "Transfer request sent. Pending approval from the destination branch."
      );
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH_TRANSFER_REQUEST.PENDING.ID],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.USER.ALL.ID],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          "Failed to submit transfer request"
      );
    },
  });
};

export const usePendingTransferRequests = (
  params?: { page?: number; limit?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [API_ROUTE.BRANCH_TRANSFER_REQUEST.PENDING.ID, params],
    queryFn: () => getPendingTransferRequests(params),
    enabled: options?.enabled !== false,
  });
};

export const useAcceptTransferRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => acceptTransferRequest(requestId),
    onSuccess: (data) => {
      toast.success(data?.message ?? "Transfer accepted. Employee has been moved.");
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH_TRANSFER_REQUEST.PENDING.ID],
      });
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.USER.ALL.ID],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          "Failed to accept transfer"
      );
    },
  });
};

export const useRejectTransferRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, rejectReason }: { requestId: string; rejectReason: string }) =>
      rejectTransferRequest(requestId, rejectReason),
    onSuccess: () => {
      toast.success("Transfer request rejected.");
      queryClient.invalidateQueries({
        queryKey: [API_ROUTE.BRANCH_TRANSFER_REQUEST.PENDING.ID],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ??
          error?.response?.data?.error ??
          "Failed to reject transfer"
      );
    },
  });
};
