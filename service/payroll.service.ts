import axios from "@/lib/axios";
import { API_ROUTE } from "@/routes";
import {
  IPayroll,
  IPayrollLot,
  IPayrollListResponse,
  IPayrollLotListResponse,
  CreatePayrollSchema,
  BulkCreatePayrollSchema,
  CreateBulkPayrollSchema,
  CreatePayrollMasterSchema,
  UpdatePayrollStatusSchema,
  CreatePayrollLotSchema,
  AutoGenerateLotsSchema,
  AddPayrollToLotSchema,
  MarkLotPaidSchema,
  AddEmployeeToLotSchema,
  IGeneratePayrollLotsResponse,
  IPayrollDetailResponse,
  IPayrollItemsByBranchResponse,
  IPayrollExportData,
} from "@/types/payroll.type";

// ============ MODERN API METHODS (Recommended) ============

/**
 * Create bulk payroll with items in single call (Recommended)
 * POST /payrolls/item/bulk
 */
export async function createBulkPayrollWithItems(
  data: CreateBulkPayrollSchema
): Promise<IPayrollDetailResponse> {
  const response = await axios.post<{ data: any }>(
    API_ROUTE.PAYROLL.BULK_CREATE.PATH,
    data
  );
  return response.data.data;
}



/**
 * Mark as paid bulk payroll with items in single call (Recommended)
 * POST /payrolls/item/bulk
 */
export async function markAsPaidBulkPayrollWithItems(
  data: CreateBulkPayrollSchema
): Promise<IPayroll[]> {
  const response = await axios.post<{ data: any }>(
    API_ROUTE.PAYROLL.BULK_MARK_AS_PAID.PATH,
    data
  );
  return response.data.data;
}

/**
 * Update existing payroll with items (edit draft payroll)
 * PATCH /payrolls/{id}/bulk
 */
export async function updateBulkPayrollWithItems(
  id: string,
  data: CreateBulkPayrollSchema
): Promise<IPayroll[]> {
  const response = await axios.patch<{ data: any }>(
    `${API_ROUTE.PAYROLL.UPDATE.PATH(id)}/bulk`,
    data
  );
  return response.data.data;
}

/**
 * Add items to existing payroll (append; does not remove LOCKED items)
 * POST /payrolls/{id}/items
 */
export async function addItemsToPayroll(
  id: string,
  data: CreateBulkPayrollSchema
): Promise<any> {
  const response = await axios.post<{ data: any }>(
    API_ROUTE.PAYROLL.ADD_ITEMS.PATH(id),
    data
  );
  return response.data.data;
}

/**
 * Lock only selected payroll items by user IDs
 * PATCH /payrolls/{id}/items/lock
 */
export async function lockSelectedPayrollItems(
  id: string,
  userIds: string[]
): Promise<any> {
  const response = await axios.patch<{ data: any }>(
    API_ROUTE.PAYROLL.LOCK_SELECTED_ITEMS.PATH(id),
    { userIds }
  );
  return response.data.data;
}

/**
 * Create payroll master (first step of two-step flow)
 * POST /payrolls/master
 */
export async function createPayrollMaster(
  data: CreatePayrollMasterSchema
): Promise<IPayroll> {
  const response = await axios.post<IPayroll>(
    API_ROUTE.PAYROLL.CREATE.PATH,
    data
  );
  return response.data;
}

/**
 * Update payroll master (e.g., assign/change LOT Cap Master)
 * PATCH /payrolls/:id
 */
export async function updatePayrollMaster(
  id: string,
  data: { lotCapId?: string; lotCapAmount?: number }
): Promise<IPayroll> {
  const response = await axios.patch<{ data: IPayroll }>(
    API_ROUTE.PAYROLL.UPDATE.PATH(id),
    data
  );
  return response.data.data;
}

/**
 * Get all payrolls with filtering, sorting, and pagination
 * GET /payrolls
 */
export async function getAllPayrolls(
  page: number = 1,
  limit: number = 10,
  userId?: string
): Promise<IPayrollListResponse> {
  const response = await axios.get<IPayrollListResponse>(
    API_ROUTE.PAYROLL.ALL.PATH,
    {
      params: {
        page,
        limit,
        ...(userId && { userId }),
      },
    }
  );
  return response.data;
}

/**
 * Get a single payroll by ID
 * GET /payrolls/{id}
 */
export async function getPayrollById(id: string): Promise<IPayrollDetailResponse> {
  const response = await axios.get<{ data: IPayrollDetailResponse }>(
    API_ROUTE.PAYROLL.VIEW.PATH(id)
  );
  return response.data.data;
}

/**
 * Get payroll export data by payroll ID
 * GET /payrolls/{id}/export?format=pdf|excel
 */
export async function getPayrollExportData(
  id: string,
  format: "pdf" | "excel"
): Promise<IPayrollExportData> {
  const response = await axios.get<{ data: IPayrollExportData }>(
    API_ROUTE.PAYROLL.EXPORT.PATH(id, format)
  );
  return response.data.data;
}

/**
 * Get payrolls by user ID
 * GET /payrolls/user/{userId}
 */
export async function getPayrollsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<IPayroll[]> {
  const response = await axios.get<IPayrollListResponse>(
    API_ROUTE.PAYROLL.BY_USER.PATH(userId),
    {
      params: { page, limit },
    }
  );
  return response.data.data;
}

/**
 * Get payroll items by month, year, and branch
 * GET /payrolls/items/by-month-year-branch/:month/:year/:branchId
 */
export async function getPayrollItemsByBranch(
  month: number,
  year: number,
  branchId: string,
  page: number = 1,
  limit: number = 10
): Promise<IPayrollItemsByBranchResponse> {
  const response = await axios.get<IPayrollItemsByBranchResponse>(
    API_ROUTE.PAYROLL.ITEMS_BY_BRANCH.PATH(month, year, branchId),
    {
      params: { page, limit },
    }
  );
  return response.data;
}

/**
 * Update payroll status
 * PATCH /payrolls/{id}/status
 */
export async function updatePayrollStatus(
  id: string,
  data: UpdatePayrollStatusSchema
): Promise<IPayroll> {
  const response = await axios.patch<IPayroll>(
    API_ROUTE.PAYROLL.UPDATE_STATUS.PATH(id),
    data
  );
  return response.data;
}

/**
 * Delete a payroll
 * DELETE /payrolls/{id}
 */
export async function deletePayroll(id: string): Promise<void> {
  await axios.delete(API_ROUTE.PAYROLL.DELETE.PATH(id));
}

// ============ LOT OPERATIONS ============

/**
 * Create a new LOT manually
 * POST /payrolls/lots
 */
export async function createLot(
  data: CreatePayrollLotSchema
): Promise<IPayrollLot> {
  const response = await axios.post<IPayrollLot>(
    API_ROUTE.PAYROLL.CREATE_LOT.PATH,
    data
  );
  return response.data;
}

/**
 * Auto-generate LOTs for pending payrolls
 * POST /payrolls/lots/auto-generate
 */
export async function autoGenerateLots(
  data: AutoGenerateLotsSchema
): Promise<IGeneratePayrollLotsResponse> {
  const response = await axios.post<IGeneratePayrollLotsResponse>(
    API_ROUTE.PAYROLL.AUTO_GENERATE_LOTS.PATH,
    data
  );
  return response.data;
}

/**
 * Add a payroll to an existing LOT
 * POST /payrolls/lots/add-payroll
 */
export async function addPayrollToLot(
  data: AddPayrollToLotSchema
): Promise<{ lot: IPayrollLot; payroll: IPayroll }> {
  const response = await axios.post<{
    lot: IPayrollLot;
    payroll: IPayroll;
  }>(API_ROUTE.PAYROLL.ADD_TO_LOT.PATH, data);
  return response.data;
}

/**
 * Get all LOTs with pagination
 * GET /payrolls/lots
 */
export async function getAllLots(
  page: number = 1,
  limit: number = 10
): Promise<IPayrollLotListResponse> {
  const response = await axios.get<IPayrollLotListResponse>(
    API_ROUTE.PAYROLL.LOTS_ALL.PATH,
    {
      params: { page, limit },
    }
  );
  return response.data;
}

/**
 * Get a specific LOT with its payrolls
 * GET /payrolls/lots/{id}
 */
export async function getLotById(lotId: string): Promise<IPayrollLot> {
  const response = await axios.get<{ data: IPayrollLot }>(
    API_ROUTE.PAYROLL.LOT_DETAILS_V2.PATH(lotId)
  );
  return response.data.data;
}

export async function markLotPaid(
  lotId: string,
  data: MarkLotPaidSchema
): Promise<IPayrollLot> {
  const response = await axios.patch<{ data: IPayrollLot }>(
    API_ROUTE.PAYROLL.MARK_LOT_PAID.PATH(lotId),
    data
  );
  return response.data.data;
}

export async function markLotEmployeePaid(
  lotId: string,
  employeeId: string
): Promise<IPayrollLot> {
  const response = await axios.patch<{ data: IPayrollLot }>(
    API_ROUTE.PAYROLL.MARK_LOT_EMPLOYEE_PAID.PATH(lotId, employeeId)
  );
  return response.data.data;
}

export async function addEmployeeToLot(
  lotId: string,
  data: AddEmployeeToLotSchema
): Promise<IPayrollLot> {
  const response = await axios.post<{ data: IPayrollLot }>(
    API_ROUTE.PAYROLL.ADD_EMPLOYEE_TO_LOT_ALIAS.PATH(lotId),
    data
  );
  return response.data.data;
}

/**
 * Disburse a LOT (mark all payrolls as PAID)
 * POST /payrolls/lots/{id}/disburse
 */
export async function disburseLot(lotId: string): Promise<IPayrollLot> {
  const response = await axios.post<IPayrollLot>(
    API_ROUTE.PAYROLL.DISBURSE_LOT.PATH(lotId)
  );
  return response.data;
}

// ============ LEGACY API METHODS (Backward Compatibility) ============

/**
 * Create a single payroll entry (Legacy)
 * @deprecated Use createPayrollMaster() instead
 */
export async function createPayroll(
  data: CreatePayrollSchema
): Promise<IPayroll> {
  const response = await axios.post<IPayroll>(
    API_ROUTE.PAYROLL.CREATE.PATH,
    data
  );
  return response.data;
}

/**
 * Create multiple payroll entries (bulk - Legacy)
 * @deprecated Use createBulkPayrollWithItems() instead
 */
export async function bulkCreatePayrolls(
  data: BulkCreatePayrollSchema
): Promise<IPayroll[]> {
  const response = await axios.post<IPayroll[]>(
    API_ROUTE.PAYROLL.BULK_CREATE.PATH,
    data
  );
  return response.data;
}

// Default export for backward compatibility
export default {
  createBulkPayrollWithItems,
  updateBulkPayrollWithItems,
  addItemsToPayroll,
  lockSelectedPayrollItems,
  markAsPaidBulkPayrollWithItems,
  createPayrollMaster,
  updatePayrollMaster,
  getAllPayrolls,
  getPayrollById,
  getPayrollExportData,
  getPayrollsByUserId,
  getPayrollItemsByBranch,
  updatePayrollStatus,
  deletePayroll,
  createLot,
  autoGenerateLots,
  addPayrollToLot,
  getAllLots,
  getLotById,
  markLotPaid,
  markLotEmployeePaid,
  addEmployeeToLot,
  disburseLot,
  createPayroll,
  bulkCreatePayrolls,
};

