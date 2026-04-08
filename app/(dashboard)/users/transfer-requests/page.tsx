"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  usePendingTransferRequests,
  useAcceptTransferRequest,
  useRejectTransferRequest,
} from "@/hooks/query/branch-transfer-request.hook";
import { getAdminHeadAccessRole, getResolvedRoleName } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function TransferRequestsPage() {
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState<{
    requestId: string;
    employeeName: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { user: currentUser } = useAppStore();
  const roleName = getResolvedRoleName(currentUser);
  const accessRole = getAdminHeadAccessRole(currentUser);
  const canManage = /hr\s*head|hr\s*manager/i.test(String(roleName));
  const currentUserId = String(
    (currentUser as any)?._id ?? (currentUser as any)?.id ?? ""
  ).trim();
  const approvableBranchIds = useMemo(() => {
    const permissionBranches = Array.isArray((currentUser as any)?.permissions?.branches)
      ? (currentUser as any).permissions.branches
      : [];

    const ids = permissionBranches
      .map((branch: any) => String(branch?.id || branch?._id || "").trim())
      .filter(Boolean);

    if (ids.length > 0) {
      return ids;
    }

    const fallbackBranchId = String(
      (currentUser as any)?.branch?.id ||
        (currentUser as any)?.branchId ||
        ""
    ).trim();

    return fallbackBranchId ? [fallbackBranchId] : [];
  }, [currentUser]);

  const { data, isLoading } = usePendingTransferRequests({ page, limit: 10 });
  const { mutate: acceptRequest, isPending: isAccepting } =
    useAcceptTransferRequest();
  const { mutate: rejectRequest, isPending: isRejecting } =
    useRejectTransferRequest();

  const requests = data?.data ?? [];
  const pagination = data?.pagination ?? {
    total: 0,
    page: 1,
    pages: 0,
  };

  const canApproveRequest = (request: any) => {
    if (accessRole === null) {
      return false;
    }

    const toBranchId = String(request?.toBranchId?._id ?? request?.toBranchId ?? "").trim();
    return Boolean(toBranchId) && approvableBranchIds.includes(toBranchId);
  };

  const isRequester = (request: any) => {
    const requestedById = String(
      request?.requestedBy?._id ?? request?.requestedBy ?? ""
    ).trim();
    return Boolean(currentUserId) && requestedById === currentUserId;
  };

  const handleRejectSubmit = () => {
    if (!rejectModal || !rejectReason.trim()) {
      toast.error("Please enter a reject reason.");
      return;
    }
    rejectRequest(
      { requestId: rejectModal.requestId, rejectReason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectModal(null);
          setRejectReason("");
        },
      }
    );
  };

  if (!canManage) {
    return (
      <div className="min-h-screen bg-[#f0f6ff] p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Access Denied</h3>
          <p className="text-sm text-red-700 mt-1">
            Only HR Head or HR Manager can view transfer requests.
          </p>
          <Link
            href="/users"
            className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">
              Transfer Requests
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              Track transfer requests you created and action requests assigned to your branch(es)
            </p>
          </div>
          <Link
            href="/users"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </Link>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-[15px] font-medium">No pending transfer requests</p>
              <p className="text-[13px] mt-1">
                When an HR Head or HR Manager requests to transfer an employee to your
                branch, they will appear here.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pl-6 pr-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Employee
                  </th>
                  <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    From Branch
                  </th>
                  <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    To Branch
                  </th>
                  <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Requested By
                  </th>
                  <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-3 py-4 pr-6 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r: any) => (
                  <tr key={r._id} className="hover:bg-blue-50/30">
                    <td className="pl-6 pr-3 py-4">
                      <p className="font-semibold text-gray-800">
                        {r.userId?.fullName ?? "—"}
                      </p>
                      <p className="text-[12px] text-gray-500">
                        {r.userId?.employeeId ?? r.userId?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-gray-700">
                      {r.fromBranchId?.branchName ?? "—"}
                      {r.fromBranchId?.branchCode && (
                        <span className="text-gray-500 ml-1">
                          · {r.fromBranchId.branchCode}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-gray-700">
                      {r.toBranchId?.branchName ?? "—"}
                      {r.toBranchId?.branchCode && (
                        <span className="text-gray-500 ml-1">
                          · {r.toBranchId.branchCode}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-4 text-gray-700">
                      {r.requestedBy?.fullName ?? "—"}
                    </td>
                    <td className="px-3 py-4 text-gray-600 text-[13px]">
                      {r.createdAt
                        ? format(new Date(r.createdAt), "dd MMM, yyyy HH:mm")
                        : "—"}
                    </td>
                    <td className="px-3 py-4 pr-6">
                      {canApproveRequest(r) ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => acceptRequest(r._id)}
                            disabled={isAccepting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-semibold text-[12px] hover:bg-green-200 disabled:opacity-50"
                          >
                            {isAccepting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                requestId: r._id,
                                employeeName: r.userId?.fullName ?? "Employee",
                              })
                            }
                            disabled={isRejecting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold text-[12px] hover:bg-red-200 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700">
                            {isRequester(r)
                              ? "Awaiting destination branch"
                              : "Pending approval"}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Reject Transfer Request
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {rejectModal.employeeName} — Please provide a reason for rejection.
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reject reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. No vacancy in this branch at the moment."
                className="w-full min-h-[100px] px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none text-[14px]"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || isRejecting}
                className="px-5 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isRejecting && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
