import apiClient from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
  IBranch,
  IApiResponse,
  IBranchListResponse,
  CreateBranchSchema,
  UpdateBranchSchema,
} from "@/types/branch.type";

const API_URL = API_ROUTE.BRANCH;

/**
 * Branch Service
 * Handles all API calls related to branch management
 */
export const branchService = {
  /**
   * Create a new branch
   */
  async createBranch(data: CreateBranchSchema): Promise<IBranch> {
    const response = await apiClient.post<IApiResponse<IBranch>>(API_URL.CREATE.PATH, data);
    return response.data.data;
  },

  /**
   * Get all branches with pagination
   */
  async getAllBranches(
    page: number = 1,
    limit: number = 10,
    options?: { includeAll?: boolean },
  ): Promise<IBranchListResponse> {
    const response = await apiClient.get<IApiResponse<IBranch[]>>(API_URL.ALL.PATH, {
      params: {
        page,
        limit,
        ...(options?.includeAll ? { includeAll: true } : {}),
      },
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Get branch by ID
   */
  async getBranchById(id: string): Promise<IBranch> {
    const response = await apiClient.get<IApiResponse<IBranch>>(API_URL.VIEW.PATH(id));
    return response.data.data;
  },

  /**
   * Get branches by company ID
   */
  async getBranchesByCompany(
    companyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IBranchListResponse> {
    const response = await apiClient.get<IApiResponse<IBranch[]>>(
      `${API_URL}/company/${companyId}`,
      { params: { page, limit } }
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Get branch by branch code
   */
  async getBranchByCode(branchCode: string): Promise<IBranch> {
    const response = await apiClient.get<IApiResponse<IBranch>>(`${API_URL}/code/${branchCode}`);
    return response.data.data;
  },

  /**
   * Get branches by status
   */
  async getBranchesByStatus(
    status: string,
    page: number = 1,
    limit: number = 10
  ): Promise<IBranchListResponse> {
    const response = await apiClient.get<IApiResponse<IBranch[]>>(
      `${API_URL}/status/${status}`,
      { params: { page, limit } }
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination!,
    };
  },

  /**
   * Update branch
   */
  async updateBranch(id: string, data: UpdateBranchSchema): Promise<IBranch> {
    const response = await apiClient.put<IApiResponse<IBranch>>(API_ROUTE.BRANCH.UPDATE.PATH(id), data);
    return response.data.data;
  },

  /**
   * Close a branch
   */
  async closeBranch(id: string): Promise<IBranch> {
    const response = await apiClient.post<IApiResponse<IBranch>>(API_ROUTE.BRANCH.CLOSE.PATH(id), {});
    return response.data.data;
  },

  /**
   * Activate a branch
   */
  async activateBranch(id: string): Promise<IBranch> {
    const response = await apiClient.post<IApiResponse<IBranch>>(
      API_ROUTE.BRANCH.ACTIVATE.PATH(id),
      {},
    );
    return response.data.data;
  },

  /**
   * Delete branch
   */
  async deleteBranch(id: string): Promise<void> {
    await apiClient.delete(API_ROUTE.BRANCH.DELETE.PATH(id));
  },

  /**
   * Toggle branch status (Active <-> Closed)
   */
  async toggleBranchStatus(id: string, currentStatus: string): Promise<IBranch> {
    return currentStatus === "Active" ? this.closeBranch(id) : this.activateBranch(id);
  },
};
