import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

export interface BankDetailListParams {
  search?: string;
  page?: number;
  limit?: number;
  effectiveFrom?: string;
  includeDeleted?: boolean;
}

// Get payment mode history for a user
export async function getUserPaymentModeHistory(userId: string) {
  const response = await axiosInstance.get(API_ROUTE.USER_PAYMENT.PAYMENT_MODE_HISTORY.PATH(userId));
  return response.data;
}

// Get bank account history for a user
export async function getUserBankAccountHistory(userId: string) {
  const response = await axiosInstance.get(API_ROUTE.USER_PAYMENT.BANK_ACCOUNT_HISTORY.PATH(userId));
  return response.data;
}

// Change payment mode (and/or update bank account) for a user
export async function changeUserPaymentMode(data: any) {
  const response = await axiosInstance.post(API_ROUTE.USER_PAYMENT.CHANGE_PAYMENT_MODE.PATH, data);
  return response.data;
}

export async function listUserBankDetails(userId: string, params: BankDetailListParams = {}) {
  const response = await axiosInstance.get(API_ROUTE.USER_PAYMENT.BANK_DETAIL_LIST.PATH(userId), {
    params: {
      search: params.search,
      page: params.page,
      limit: params.limit,
      effectiveFrom: params.effectiveFrom,
      includeDeleted: params.includeDeleted,
    },
  });
  return response.data;
}

export async function getUserBankDetailById(userId: string, bankDetailId: string) {
  const response = await axiosInstance.get(API_ROUTE.USER_PAYMENT.BANK_DETAIL_DETAIL.PATH(userId, bankDetailId));
  return response.data;
}

export async function upsertUserBankDetail(data: any) {
  const response = await axiosInstance.post(API_ROUTE.USER_PAYMENT.UPSERT_BANK_DETAIL.PATH, data);
  return response.data;
}

export async function deleteUserBankDetail(userId: string, bankDetailId: string) {
  const response = await axiosInstance.delete(API_ROUTE.USER_PAYMENT.DELETE_BANK_DETAIL.PATH(userId, bankDetailId));
  return response.data;
}
