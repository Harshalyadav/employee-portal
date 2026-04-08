import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

export interface CreateTransferRequestDto {
  userId: string;
  toBranchId: string;
  requestReason?: string;
}

export interface TransferRequestItem {
  _id: string;
  userId: { _id: string; fullName?: string; employeeId?: string; email?: string };
  fromBranchId: { _id: string; branchName?: string; branchCode?: string };
  toBranchId: { _id: string; branchName?: string; branchCode?: string };
  requestedBy: { _id: string; fullName?: string; employeeId?: string };
  requestReason?: string;
  status: string;
  createdAt: string;
}

export interface PendingTransferRequestsResponse {
  success: boolean;
  data: TransferRequestItem[];
  pagination: { total: number; page: number; pages: number };
}

export async function createTransferRequest(
  dto: CreateTransferRequestDto
): Promise<{ success: boolean; message: string; data: unknown }> {
  const response = await axiosInstance.post(
    API_ROUTE.BRANCH_TRANSFER_REQUEST.CREATE.PATH,
    dto
  );
  return response.data;
}

export async function getPendingTransferRequests(params?: {
  page?: number;
  limit?: number;
}): Promise<PendingTransferRequestsResponse> {
  const response = await axiosInstance.get<PendingTransferRequestsResponse>(
    API_ROUTE.BRANCH_TRANSFER_REQUEST.PENDING.PATH,
    { params }
  );
  return response.data;
}

export async function acceptTransferRequest(
  requestId: string
): Promise<{ success: boolean; message: string; data: unknown }> {
  const response = await axiosInstance.patch(
    API_ROUTE.BRANCH_TRANSFER_REQUEST.ACCEPT.PATH(requestId)
  );
  return response.data;
}

export async function rejectTransferRequest(
  requestId: string,
  rejectReason: string
): Promise<{ success: boolean; message: string; data: unknown }> {
  const response = await axiosInstance.patch(
    API_ROUTE.BRANCH_TRANSFER_REQUEST.REJECT.PATH(requestId),
    { rejectReason }
  );
  return response.data;
}
