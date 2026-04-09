import axiosInstance from "@/lib/axios";
import { API_ROUTE } from "@/routes";

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
