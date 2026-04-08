"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAllUsersFlat, useBranches, usePermission, useUpdateDocumentUpload } from "@/hooks";
import { ErrorAlert } from "@/components/ErrorAlert";
import { getUserDocuments } from "@/service/user-document.service";
import { ModuleNameEnum, PermissionAction, VisaTypeEnum } from "@/types";
import { UserDocumentTypeEnum } from "@/types/user-document.type";
import { DocumentTypeLabels } from "@/types/user-document.type";
import { formatDate } from "@/lib/utils";
import { Search, Loader2, Edit, Eye, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { SingleFileUpload } from "@/components/upload";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "blocked" | "critical" | "warning" | "valid" | "no-expiry";
type RenewalStatus = "applied_for_renewal" | "pending" | "renewed";

const RENEWAL_STATUS_OPTIONS: { value: RenewalStatus; label: string; color: string }[] = [
  { value: "applied_for_renewal", label: "Applied for Renewal", color: "bg-blue-50 text-blue-700" },
  { value: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-700" },
  { value: "renewed", label: "Renewed", color: "bg-green-50 text-green-700" },
];

function getRenewalStatusLabel(status?: RenewalStatus | null): string {
  if (!status) return "-";
  const found = RENEWAL_STATUS_OPTIONS.find(opt => opt.value === status);
  return found?.label || status;
}

function getRenewalStatusColor(status?: RenewalStatus | null): string {
  if (!status) return "bg-gray-50 text-gray-700";
  const found = RENEWAL_STATUS_OPTIONS.find(opt => opt.value === status);
  return found?.color || "bg-gray-50 text-gray-700";
}

function getDocStatus(expiryDate?: string | null): DocStatus {
  if (!expiryDate) return "no-expiry";
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "blocked";
  if (diffDays <= 30) return "critical";
  if (diffDays <= 90) return "warning";
  return "valid";
}

function getBranchName(user: any, branches: any[]) {
  const branch = user?.branchId || user?.branch;
  if (branch && typeof branch === "object") {
    return branch.branchName || branch.name || "-";
  }
  if (typeof branch === "string") {
    const matched = branches.find((item: any) => item?._id === branch || item?.id === branch);
    return matched?.branchName || matched?.name || "-";
  }
  return "-";
}

function getBranchId(user: any) {
  const branch = user?.branchId || user?.branch;
  if (branch && typeof branch === "object") {
    return String(branch._id || branch.id || "");
  }

  if (typeof branch === "string") {
    return branch;
  }

  return "";
}

function getDocumentTypeLabel(value?: string) {
  if (!value) return "-";
  return DocumentTypeLabels[value as UserDocumentTypeEnum] || value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getVisaTypeLabel(doc: any) {
  const visaType = String(doc?.visaDetails?.visaType || doc?.visaType || "").trim();
  if (!visaType) return "-";
  return visaType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Passport vs visa for the row being edited — upload must match this document. */
function docTypeFromRow(doc: any): UserDocumentTypeEnum {
  const raw = String(doc?.docType || doc?.documentType || "").toLowerCase();
  if (raw === UserDocumentTypeEnum.PASSPORT || raw === "passport") {
    return UserDocumentTypeEnum.PASSPORT;
  }
  if (raw === UserDocumentTypeEnum.VISA || raw === "visa") {
    return UserDocumentTypeEnum.VISA;
  }
  return UserDocumentTypeEnum.VISA;
}

const SELECT_CLS =
  "h-[34px] border border-gray-200 rounded-lg px-3 py-1 text-sm bg-white text-gray-600 focus:ring-2 focus:ring-blue-400 outline-none cursor-pointer";

type StatusFilterValue =
  | "all"
  | "all_except_valid"
  | Exclude<DocStatus, "valid" | "no-expiry">;

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "all_except_valid", label: "All Status Except Valid" },
  { value: "blocked", label: "Expired (Blocked)" },
  { value: "critical", label: "Critical (< 30 days)" },
  { value: "warning", label: "Warning (< 90 days)" },
];

function applyStatusFilter(docs: any[], filter: StatusFilterValue): any[] {
  if (filter === "all") return docs;
  if (filter === "all_except_valid") {
    return docs.filter((doc: any) => getDocStatus(doc.expiryDate) !== "valid");
  }
  return docs.filter((doc: any) => getDocStatus(doc.expiryDate) === filter);
}

export default function VisaManagerTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all_except_valid");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedViewUser, setSelectedViewUser] = useState<any>(null);
  const [renewalStatus, setRenewalStatus] = useState<RenewalStatus | "">("");
  const [renewalRemarks, setRenewalRemarks] = useState("");
  const rowsPerPage = 10;

  // In-modal document upload (when Renewed is selected)
  const [uploadDocType, setUploadDocType] = useState<UserDocumentTypeEnum>(UserDocumentTypeEnum.VISA);
  const [uploadDocNumber, setUploadDocNumber] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploadVisaType, setUploadVisaType] = useState<string>("employment");
  const [uploadFrontImg, setUploadFrontImg] = useState("");
  const [uploadBackImg, setUploadBackImg] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const branchTriggerRef = useRef<HTMLButtonElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const { hasPermission } = usePermission();
  const canUpdateVisaManager = hasPermission(
    ModuleNameEnum.VISA_MANAGER,
    PermissionAction.UPDATE,
  );

  const updateDocumentUploadMutation = useUpdateDocumentUpload();

  // Mutation for updating renewal status
  const updateRenewalMutation = useMutation({
    mutationFn: async ({ docId, status, remarks }: { docId: string; status: RenewalStatus; remarks: string }) => {
      const response = await axiosInstance.put(`/api/user-documents/${docId}`, {
        renewalStatus: status,
        renewalRemarks: remarks,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visa-manager-docs"] });
      toast.success("Renewal status updated successfully");
      setShowRenewalModal(false);
      setRenewalStatus("");
      setRenewalRemarks("");
      setSelectedDocument(null);
      setUploadDocType(UserDocumentTypeEnum.VISA);
      setUploadDocNumber("");
      setUploadExpiryDate("");
      setUploadVisaType("employment");
      setUploadFrontImg("");
      setUploadBackImg("");
    },
    onError: () => {
      toast.error("Failed to update renewal status");
    },
  });

  // Branches for dropdown
  const { data: branchData } = useBranches(1, 100);
  const branches = useMemo(
    () => (branchData as any)?.data ?? (branchData as any)?.branches ?? [],
    [branchData],
  );

  const filteredBranches = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    if (!query) {
      return branches;
    }

    return branches.filter((branch: any) => {
      const branchName = String(branch?.branchName || "").toLowerCase();
      const branchCode = String(branch?.branchCode || "").toLowerCase();
      return branchName.includes(query) || branchCode.includes(query);
    });
  }, [branchSearch, branches]);

  // Fetch users once and filter by branch locally for searchable multi-select behaviour.
  const {
    data: allUsers,
    isLoading: usersLoading,
    isError: usersError,
  } = useAllUsersFlat();

  useEffect(() => {
    if (!branchFilterOpen || !branchTriggerRef.current) return;
    const rect = branchTriggerRef.current.getBoundingClientRect();
    setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
  }, [branchFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (branchTriggerRef.current?.contains(target) || branchDropdownRef.current?.contains(target)) {
        return;
      }

      setBranchFilterOpen(false);
    };

    if (branchFilterOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [branchFilterOpen]);

  // Fetch each user's documents in parallel
  const {
    data: enrichedDocuments,
    isLoading: docsLoading,
    isError: docsError,
  } = useQuery({
    queryKey: [
      "visa-manager-docs",
      selectedBranchIds.join(","),
      allUsers?.map((u: any) => u._id || u.id),
    ],
    enabled: !!allUsers && allUsers.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const results = await Promise.all(
        (allUsers ?? []).map(async (user: any) => {
          const userId = user._id || user.id;
          if (!userId) return [];
          try {
            const docs = await getUserDocuments(String(userId));
            return (docs ?? []).map((doc) => ({ ...doc, __user: user }));
          } catch {
            return [];
          }
        }),
      );
      return results.flat();
    },
  });

  const isLoading = usersLoading || docsLoading;

  const selectedViewUserId = String(
    selectedViewUser?._id || selectedViewUser?.id || "",
  );

  const {
    data: selectedUserDocuments = [],
    isLoading: selectedUserDocumentsLoading,
  } = useQuery({
    queryKey: ["visa-manager-user-documents", selectedViewUserId],
    enabled: showViewModal && Boolean(selectedViewUserId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!selectedViewUserId) return [];
      return (await getUserDocuments(selectedViewUserId)) ?? [];
    },
  });

  const allDocs = enrichedDocuments ?? [];

  const viewedDocuments = useMemo(() => {
    return [...selectedUserDocuments].sort((left: any, right: any) => {
      const leftTime = new Date(left.createdAt || left.updatedAt || 0).getTime();
      const rightTime = new Date(right.createdAt || right.updatedAt || 0).getTime();
      return rightTime - leftTime;
    });
  }, [selectedUserDocuments]);

  // Group by user: show one row per user with the highest-number document (Document N = most recently created)
  // and attach document count so we can show "Document N" in the table. Expiry status is for that document.
  const docsOnePerUser = useMemo(() => {
    const byUser = new Map<string, any[]>();
    for (const doc of allDocs) {
      const uid =
        doc.__user?._id ||
        doc.__user?.id ||
        (typeof doc.userId === "object" && doc.userId) ||
        (typeof doc.userId === "object" && doc.userId) ||
        (typeof doc.userId === "string" ? doc.userId : "");
      const key = String(uid);
      if (!key) continue;
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(doc);
    }
    const result: any[] = [];
    for (const docs of byUser.values()) {
      const sorted = [...docs].sort((a, b) => {
        const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bTime - aTime;
      });
      const highestNumberDoc = sorted[0];
      const documentCount = sorted.length;
      const renewalFromAny = sorted.find((d) => d.renewalStatus) || highestNumberDoc;
      result.push({
        ...highestNumberDoc,
        __documentCount: documentCount,
        renewalStatus: highestNumberDoc.renewalStatus ?? renewalFromAny.renewalStatus,
        renewalRemarks: highestNumberDoc.renewalRemarks ?? renewalFromAny.renewalRemarks,
      });
    }
    return result;
  }, [allDocs]);

  const branchFilteredDocs = useMemo(() => {
    if (selectedBranchIds.length === 0) {
      return docsOnePerUser;
    }

    return docsOnePerUser.filter((doc: any) => {
      const branchId = getBranchId(doc.__user || doc.userId);
      return branchId ? selectedBranchIds.includes(branchId) : false;
    });
  }, [docsOnePerUser, selectedBranchIds]);

  // Client-side filtering (search + status) on one-doc-per-user list
  const searchedDocs = useMemo(() => {
    if (!search.trim()) return branchFilteredDocs;
    const q = search.toLowerCase();
    return branchFilteredDocs.filter((doc: any) => {
      const name = doc.__user?.fullName?.toLowerCase() || doc.userId?.fullName?.toLowerCase() || "";
      const email = doc.__user?.email?.toLowerCase() || doc.userId?.email?.toLowerCase() || "";
      const u = doc.__user || doc.userId;
      const resolvedEmpId =
        u?.employeeId ||
        u?.uniqueWorkerId ||
        u?.displayEmployeeId ||
        (u?._id ? `EMP-${String(u._id).slice(-6)}` : "");
      const empId = resolvedEmpId.toLowerCase();
      const rawType = doc.docType || doc.documentType || "";
      const typeLabel = rawType.replace(/_/g, " ").toLowerCase();

      return name.includes(q) || email.includes(q) || empId.includes(q) || typeLabel.includes(q);
    });
  }, [branchFilteredDocs, search]);

  const filteredDocs = useMemo(
    () => applyStatusFilter(searchedDocs, statusFilter),
    [searchedDocs, statusFilter],
  );

  // Stats follow branch + status filters (same scope as the table before search)
  const statsScopeDocs = useMemo(
    () => applyStatusFilter(branchFilteredDocs, statusFilter),
    [branchFilteredDocs, statusFilter],
  );
  const totalCount = statsScopeDocs.length;
  const validCount = statsScopeDocs.filter((d: any) => {
    const s = getDocStatus(d.expiryDate);
    return s === "valid" || s === "no-expiry";
  }).length;
  const blockedCount = statsScopeDocs.filter((d: any) => getDocStatus(d.expiryDate) === "blocked").length;

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / rowsPerPage));
  const paginated = filteredDocs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const startEntry = filteredDocs.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(currentPage * rowsPerPage, filteredDocs.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) pages.push(i);
    return pages;
  }, [totalPages]);

  if (usersError || docsError) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Error Loading Visa Documents"
        message="Failed to load visa documents. Please try again."
      />
    );
  }

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedViewUser(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Visa Manager</h1>
          <p className="text-[13px] text-gray-400 mt-1">Manage employee visas and documents</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="flex gap-10 px-6 py-5 border-b border-gray-100">
        <div>
          <p className="text-[40px] leading-tight font-bold text-[#4285f4] tracking-tight">
            {isLoading ? "—" : String(totalCount).padStart(2, "0")}
          </p>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Employees</p>
        </div>
        <div>
          <p className="text-[40px] leading-tight font-bold text-[#34a853] tracking-tight">
            {isLoading ? "—" : String(validCount).padStart(2, "0")}
          </p>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Valid</p>
        </div>
        <div>
          <p className="text-[40px] leading-tight font-bold text-[#ea4335] tracking-tight">
            {isLoading ? "—" : String(blockedCount).padStart(2, "0")}
          </p>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">Blocked / Expired</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-nowrap items-center gap-3 px-5 py-4 border-b border-gray-100 min-w-0 overflow-x-auto pb-1">
        <div className="relative shrink-0">
          <button
            ref={branchTriggerRef}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (branchTriggerRef.current) {
                const rect = branchTriggerRef.current.getBoundingClientRect();
                setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
              }
              setBranchFilterOpen((open) => !open);
            }}
            className={cn(
              "w-60 shrink-0 h-[42px] rounded-xl border border-gray-200 bg-white shadow-sm text-[13px] font-medium px-4 flex items-center justify-between gap-2",
              "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 hover:border-gray-300",
              branchFilterOpen && "border-blue-400 ring-2 ring-blue-100",
            )}
            title="Filter by branch"
          >
            <span className="truncate text-left">
              {selectedBranchIds.length === 0
                ? "All Branches"
                : selectedBranchIds.length === 1
                  ? branches.find((branch: any) => branch._id === selectedBranchIds[0])?.branchName ?? "1 branch"
                  : `${selectedBranchIds.length} branches`}
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", branchFilterOpen && "rotate-180")} />
          </button>
          {branchFilterOpen && typeof document !== "undefined" && createPortal(
            <div
              ref={branchDropdownRef}
              className="fixed z-9999 w-[280px] max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-2"
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-3 pb-2">
                <input
                  type="text"
                  value={branchSearch}
                  onChange={(event) => setBranchSearch(event.target.value)}
                  placeholder="Search branches..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBranchIds([]);
                    setStatusFilter("all_except_valid");
                    setCurrentPage(1);
                    setBranchSearch("");
                    setBranchFilterOpen(false);
                  }}
                  className="w-full rounded-lg py-2 px-2 -mx-1 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear selection (All Branches)
                </button>
              </div>
              <div className="my-1 border-t border-gray-100" />
              {filteredBranches.map((branch: any) => (
                <label
                  key={branch._id}
                  className={cn(
                    "mx-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-blue-50/50",
                    selectedBranchIds.includes(branch._id) && "bg-blue-50/80",
                  )}
                >
                  <Checkbox
                    checked={selectedBranchIds.includes(branch._id)}
                    onCheckedChange={(checked) => {
                      setSelectedBranchIds((previous) =>
                        checked ? [...previous, branch._id] : previous.filter((id) => id !== branch._id),
                      );
                      setCurrentPage(1);
                    }}
                    className="border-gray-300 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                  />
                  <span className="font-medium text-gray-800">{branch.branchName}</span>
                  {branch.branchCode && <span className="text-[12px] text-gray-500">· {branch.branchCode}</span>}
                </label>
              ))}
              {filteredBranches.length === 0 && (
                <p className="px-3 py-4 text-[13px] text-gray-500">No branches available</p>
              )}
            </div>,
            document.body,
          )}
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilterValue);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger
            className="w-[220px] shrink-0 h-[42px] rounded-xl border-gray-200 bg-white shadow-sm text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 data-placeholder:text-gray-500"
            title="Filter by status"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-gray-200 shadow-lg max-h-80" sideOffset={4}>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative w-52 shrink-0 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2.5 text-[13px] font-medium border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white shadow-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                EMPLOYEE
              </th>
              {/* <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                EMP ID
              </th> */}
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                BRANCH NAME
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                DOCUMENT TYPE
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                VISA TYPE
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-blue-500 uppercase tracking-wide">
                STATUS
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                EXPIRY DATE
              </th>
              <th className="px-3 py-3 pr-5 text-center text-xs font-semibold text-blue-500 uppercase tracking-wide">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  No documents found
                </td>
              </tr>
            ) : (
              paginated.map((doc: any, i: number) => {
                const docUser = doc.userId;
                const fullUser = doc.__user;
                const name = docUser?.fullName || fullUser?.fullName || "-";
                const email = docUser?.email || fullUser?.email || "";
                const empId =
                    fullUser?.employeeId ||
                    fullUser?.uniqueWorkerId ||
                    fullUser?.displayEmployeeId ||
                    docUser?.employeeId ||
                    docUser?.uniqueWorkerId ||
                    docUser?.displayEmployeeId ||
                    (fullUser?._id ? `EMP-${String(fullUser._id).slice(-6)}` : undefined) ||
                    (docUser?._id ? `EMP-${String(docUser._id).slice(-6)}` : undefined) ||
                    "-";
                const branchName = getBranchName(fullUser, branches);

                const rawType: string = doc.docType || doc.documentType || "";
                const typeLabel = getDocumentTypeLabel(rawType);
                const visaTypeLabel = getVisaTypeLabel(doc);

                const status = getDocStatus(doc.expiryDate);
                let statusUi = <></>;

                if (status === "no-expiry") {
                  statusUi = (
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">No Expiry</span>
                    </div>
                  );
                } else {
                  const diffDays = Math.ceil(
                    (new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  if (status === "blocked") {
                    statusUi = (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600">Employee Blocked</span>
                        <span className="text-xs text-red-500 font-medium whitespace-nowrap">Expired</span>
                      </div>
                    );
                  } else if (status === "critical") {
                    statusUi = (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">Critical</span>
                        <span className="text-xs text-orange-500 font-medium whitespace-nowrap">{diffDays} days left</span>
                      </div>
                    );
                  } else if (status === "warning") {
                    statusUi = (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">Warning</span>
                        <span className="text-xs text-yellow-600 font-medium whitespace-nowrap">{diffDays} days left</span>
                      </div>
                    );
                  } else {
                    statusUi = (
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Valid</span>
                        <span className="text-xs text-green-600 font-medium whitespace-nowrap">{diffDays} days left</span>
                      </div>
                    );
                  }
                }

                const userId =
                  fullUser?._id ||
                  fullUser?.id ||
                  (typeof docUser === "object" && docUser?._id) ||
                  (typeof docUser === "object" && docUser?.id) ||
                  (typeof doc.userId === "string" ? doc.userId : "") ||
                  "";

                return (
                  <tr key={doc._id || i} className="hover:bg-gray-50 transition-colors">
                    {/* EMPLOYEE */}
                    <td className="px-5 py-3">
                      <div className="leading-tight">
                        <div className="font-semibold text-gray-800 whitespace-nowrap">{name}</div>
                        {/* {email && (
                          <div className="text-xs text-gray-500 mt-0.5">ddd{email}</div>
                        )} */}
                      </div>
                    </td>

                    {/* EMP ID */}
                    {/* <td className="px-3 py-3">
                      <span className="font-semibold text-gray-700 text-xs">
                        {empId}
                      </span>
                    </td> */}

                    {/* BRANCH NAME */}
                    <td className="px-3 py-3">
                      <span className="font-medium text-gray-700 text-sm">{branchName}</span>
                    </td>

                    {/* DOCUMENT TYPE */}
                    <td className="px-3 py-3">
                      <div className="font-semibold text-sm text-gray-800">{typeLabel}</div>
                    </td>

                    {/* VISA TYPE */}
                    <td className="px-3 py-3">
                      <div className="font-medium text-sm text-gray-700">{visaTypeLabel}</div>
                    </td>

                    {/* STATUS */}
                    <td className="px-3 py-3">
                      {statusUi}
                    </td>

                    {/* EXPIRY DATE */}
                    <td className="px-3 py-3 text-center text-gray-600 text-xs whitespace-nowrap">
                      {doc.expiryDate
                        ? formatDate(doc.expiryDate)
                        : "—"}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 pr-5 text-center">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {canUpdateVisaManager ? (
                          <>
                            {/* Renewal Status Badge */}
                            {doc.renewalStatus && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getRenewalStatusColor(doc.renewalStatus)}`}>
                                {getRenewalStatusLabel(doc.renewalStatus)}
                              </span>
                            )}

                            {/* Edit Icon Button */}
                            <button
                              onClick={() => {
                                setSelectedDocument(doc);
                                setRenewalStatus((doc.renewalStatus || "") as RenewalStatus);
                                setRenewalRemarks(doc.renewalRemarks || "");
                                setUploadDocType(docTypeFromRow(doc));
                                const vt =
                                  doc?.visaDetails?.visaType ||
                                  doc?.visaType ||
                                  VisaTypeEnum.EMPLOYMENT;
                                setUploadVisaType(
                                  typeof vt === "string" ? vt : String(VisaTypeEnum.EMPLOYMENT),
                                );
                                setShowRenewalModal(true);
                              }}
                              className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="Edit renewal status"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* View visa documents in Visa Manager */}
                            <button
                              onClick={() => {
                                if (!userId) {
                                  toast.error("User not found");
                                  return;
                                }
                                setSelectedViewUser(
                                  fullUser ||
                                    (typeof docUser === "object" ? docUser : null) || {
                                      _id: userId,
                                      id: userId,
                                      fullName: name,
                                      email,
                                      employeeId: empId,
                                      uniqueWorkerId: empId,
                                    },
                                );
                                setShowViewModal(true);
                              }}
                              className="p-1.5 rounded-md bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="View visa documents"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No access</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing {startEntry} to {endEntry} of {filteredDocs.length} entries
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
          >
            ‹
          </button>

          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`w-8 h-8 flex items-center justify-center rounded border text-sm font-medium transition-colors ${currentPage === pg
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {pg}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 text-xs"
          >
            »
          </button>
        </div>
      </div>

      {/* ── Renewal Status Modal ── */}
      {showRenewalModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">Update Renewal Status</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDocument.__user?.fullName || selectedDocument.userId?.fullName || "Employee"}
              </p>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewal Status
                </label>
                <select
                  value={renewalStatus}
                  onChange={(e) => setRenewalStatus(e.target.value as RenewalStatus)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Select Status</option>
                  {RENEWAL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={renewalRemarks}
                  onChange={(e) => setRenewalRemarks(e.target.value)}
                  placeholder="Add any notes about the renewal..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                  rows={3}
                />
              </div>

              {/* Document Upload - only when Renewed is selected */}
              {renewalStatus === "renewed" && (
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">Document Upload</h3>
                  <p className="text-xs text-gray-500">Upload the renewed document for this employee.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800">
                      {DocumentTypeLabels[uploadDocType] || uploadDocType}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Renewal upload must match this employee&apos;s document on file.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Number *</label>
                    <input
                      type="text"
                      value={uploadDocNumber}
                      onChange={(e) => setUploadDocNumber(e.target.value)}
                      placeholder="e.g. AB1234567"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      value={uploadExpiryDate}
                      onChange={(e) => setUploadExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                    />
                  </div>

                  {uploadDocType === UserDocumentTypeEnum.VISA && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                      <select
                        value={uploadVisaType}
                        onChange={(e) => setUploadVisaType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                      >
                        <option value={VisaTypeEnum.EMPLOYMENT}>Employment</option>
                        <option value={VisaTypeEnum.VISIT}>Visit</option>
                        <option value={VisaTypeEnum.DEPENDENT}>Dependent</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <div key={`front-${uploadFrontImg}`}>
                      <SingleFileUpload
                        folder="documents"
                        accept=".jpg,.jpeg,.png"
                        label="Front Image (Optional)"
                        onUploadSuccess={(url) => setUploadFrontImg(url)}
                        defaultValue={uploadFrontImg}
                        showPreview={true}
                      />
                    </div>
                    <div key={`back-${uploadBackImg}`}>
                      <SingleFileUpload
                        folder="documents"
                        accept=".jpg,.jpeg,.png"
                        label="Back Image (Optional)"
                        onUploadSuccess={(url) => setUploadBackImg(url)}
                        defaultValue={uploadBackImg}
                        showPreview={true}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const rawUserId =
                        selectedDocument?.__user?._id ||
                        selectedDocument?.__user?.id ||
                        (typeof selectedDocument?.userId === "object" && selectedDocument?.userId?._id) ||
                        (typeof selectedDocument?.userId === "object" && selectedDocument?.userId?.id) ||
                        (typeof selectedDocument?.userId === "string" ? selectedDocument.userId : "") ||
                        "";
                      const userId = rawUserId ? String(rawUserId) : "";
                      if (!userId) {
                        toast.error("User not found");
                        return;
                      }
                      if (!uploadDocNumber.trim()) {
                        toast.error("Document number is required");
                        return;
                      }
                      if (!uploadExpiryDate) {
                        toast.error("Expiry date is required");
                        return;
                      }
                      const doc: any = {
                        docType: uploadDocType,
                        documentNumber: uploadDocNumber.trim(),
                        expiryDate: uploadExpiryDate,
                        frontImg: uploadFrontImg || undefined,
                        backImg: uploadBackImg || undefined,
                      };
                      if (uploadDocType === UserDocumentTypeEnum.VISA) {
                        doc.visaDetails = { visaType: uploadVisaType as VisaTypeEnum };
                      }
                      updateDocumentUploadMutation.mutate(
                        { userId, documents: [doc] },
                        {
                          onSuccess: () => {
                            toast.success("Document uploaded successfully. It will appear on the user document page.");
                            queryClient.invalidateQueries({ queryKey: ["visa-manager-docs"] });
                            queryClient.invalidateQueries({ queryKey: ["getDocumentInfo", userId] });
                            queryClient.invalidateQueries({ queryKey: ["getCompleteInfo", userId] });
                            setUploadDocNumber("");
                            setUploadExpiryDate("");
                            setUploadFrontImg("");
                            setUploadBackImg("");
                          },
                          onError: () => {
                            toast.error("Failed to upload document");
                          },
                        }
                      );
                    }}
                    disabled={updateDocumentUploadMutation.isPending || !uploadDocNumber.trim() || !uploadExpiryDate}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updateDocumentUploadMutation.isPending && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Upload Document
                  </button>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end shrink-0">
              <button
                onClick={() => {
                  setShowRenewalModal(false);
                  setSelectedDocument(null);
                  setRenewalStatus("");
                  setRenewalRemarks("");
                  setUploadDocType(UserDocumentTypeEnum.VISA);
                  setUploadDocNumber("");
                  setUploadExpiryDate("");
                  setUploadVisaType("employment");
                  setUploadFrontImg("");
                  setUploadBackImg("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!renewalStatus) {
                    toast.error("Please select a status");
                    return;
                  }
                  const rawUserId =
                    selectedDocument?.__user?._id ||
                    selectedDocument?.__user?.id ||
                    (typeof selectedDocument?.userId === "object" && selectedDocument?.userId?._id) ||
                    (typeof selectedDocument?.userId === "object" && selectedDocument?.userId?.id) ||
                    (typeof selectedDocument?.userId === "string" ? selectedDocument.userId : "") ||
                    "";
                  const userId = rawUserId ? String(rawUserId) : "";

                  const hasDocumentData = renewalStatus === "renewed" && uploadDocNumber.trim();

                  if (renewalStatus === "renewed" && uploadDocNumber.trim() && !uploadExpiryDate) {
                    toast.error("Expiry date is required");
                    return;
                  }

                  if (hasDocumentData && userId) {
                    const doc: any = {
                      docType: uploadDocType,
                      documentNumber: uploadDocNumber.trim(),
                      expiryDate: uploadExpiryDate,
                      frontImg: uploadFrontImg || undefined,
                      backImg: uploadBackImg || undefined,
                    };
                    if (uploadDocType === UserDocumentTypeEnum.VISA) {
                      doc.visaDetails = { visaType: uploadVisaType as VisaTypeEnum };
                    }
                    updateDocumentUploadMutation.mutate(
                      { userId, documents: [doc] },
                      {
                        onSuccess: () => {
                          updateRenewalMutation.mutate({
                            docId: selectedDocument._id,
                            status: renewalStatus,
                            remarks: renewalRemarks,
                          });
                          queryClient.invalidateQueries({ queryKey: ["getDocumentInfo", userId] });
                          queryClient.invalidateQueries({ queryKey: ["getCompleteInfo", userId] });
                        },
                        onError: () => {
                          toast.error("Failed to upload document");
                        },
                      }
                    );
                  } else {
                    updateRenewalMutation.mutate({
                      docId: selectedDocument._id,
                      status: renewalStatus,
                      remarks: renewalRemarks,
                    });
                  }
                }}
                disabled={updateRenewalMutation.isPending || updateDocumentUploadMutation.isPending || !renewalStatus}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(updateRenewalMutation.isPending || updateDocumentUploadMutation.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-[#eef5ff] shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-[30px] font-bold tracking-tight text-gray-900">Visa Documents</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedViewUser?.fullName || "Employee"}
                  {selectedViewUser?.employeeId || selectedViewUser?.uniqueWorkerId
                    ? ` • ${selectedViewUser?.employeeId || selectedViewUser?.uniqueWorkerId}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              <div className="rounded-[26px] border border-blue-100 bg-white shadow-[0_12px_40px_-28px_rgba(24,39,75,0.2)]">
                <div className="border-b border-gray-100 px-6 py-6">
                  <h3 className="text-[28px] font-bold tracking-tight text-gray-900">Documents</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Visa Manager view stays inside this module and does not redirect to Employee documents.
                  </p>
                </div>

                <div className="space-y-6 px-6 py-6">
                  {selectedUserDocumentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : viewedDocuments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
                      No documents found for this employee.
                    </div>
                  ) : (
                    viewedDocuments.map((doc: any, index: number) => {
                      const docType = String(doc.docType || doc.documentType || "").toLowerCase();
                      const status = getDocStatus(doc.expiryDate);
                      const diffDays = doc.expiryDate
                        ? Math.ceil(
                            (new Date(doc.expiryDate).getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24),
                          )
                        : null;

                      const statusBadge =
                        status === "blocked"
                          ? { label: "Expired", className: "bg-red-100 text-red-600", meta: "Expired" }
                          : status === "critical"
                            ? { label: "Critical", className: "bg-orange-100 text-orange-600", meta: `${diffDays} days left` }
                            : status === "warning"
                              ? { label: "Warning", className: "bg-yellow-100 text-yellow-700", meta: `${diffDays} days left` }
                              : status === "no-expiry"
                                ? { label: "No Expiry", className: "bg-gray-100 text-gray-700", meta: "No expiry date" }
                                : { label: "Valid", className: "bg-green-100 text-green-700", meta: `${diffDays} days left` };

                      return (
                        <div key={doc._id || index} className="rounded-2xl border border-gray-200 bg-white px-4 py-5 shadow-sm sm:px-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h4 className="text-[24px] font-semibold text-gray-900">Document {index + 1}</h4>
                              <div className="mt-4 flex flex-col items-start gap-1">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}>
                                  {statusBadge.label}
                                </span>
                                <span className={`text-sm font-medium ${status === "blocked" ? "text-red-500" : status === "critical" ? "text-orange-500" : status === "warning" ? "text-yellow-600" : status === "no-expiry" ? "text-gray-500" : "text-green-600"}`}>
                                  {statusBadge.meta}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <p className="text-sm text-gray-500">Document Type</p>
                              <p className="mt-1 text-[18px] font-semibold text-gray-900">
                                {getDocumentTypeLabel(docType)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Document Number</p>
                              <p className="mt-1 break-all text-[18px] font-semibold text-gray-900">
                                {doc.documentNumber || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Expiry Date</p>
                              <p className="mt-1 text-[18px] font-semibold text-gray-900">
                                {doc.expiryDate ? formatDate(doc.expiryDate) : "No Expiry"}
                              </p>
                            </div>
                            {docType === UserDocumentTypeEnum.VISA && doc.visaDetails?.visaType && (
                              <div>
                                <p className="text-sm text-gray-500">Visa Type</p>
                                <p className="mt-1 text-[18px] font-semibold capitalize text-gray-900">
                                  {String(doc.visaDetails.visaType).toLowerCase()}
                                </p>
                              </div>
                            )}
                          </div>

                          {(doc.frontImg || doc.backImg) && (
                            <div className="mt-6 flex flex-wrap gap-4">
                              {doc.frontImg && (
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-medium text-gray-500">Front</p>
                                  <img
                                    src={doc.frontImg}
                                    alt="Front document"
                                    className="h-28 w-36 rounded-xl border border-gray-200 object-cover"
                                  />
                                </div>
                              )}
                              {doc.backImg && (
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-medium text-gray-500">Back</p>
                                  <img
                                    src={doc.backImg}
                                    alt="Back document"
                                    className="h-28 w-36 rounded-xl border border-gray-200 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
