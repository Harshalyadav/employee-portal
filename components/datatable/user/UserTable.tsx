"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useDeleteUser, useUsers } from "@/hooks/query/user.hook";
import {
  useCreateTransferRequest,
  usePendingTransferRequests,
} from "@/hooks/query/branch-transfer-request.hook";
import { useAppStore } from "@/stores";
import { useInfiniteBranches } from "@/hooks/query/useBranch";
import { useRoles, useAssignableRoles } from "@/hooks/query/role.hook";
import { usePermission } from "@/hooks";
import { UserFilters, ModuleNameEnum, PermissionAction } from "@/types";
import { DocumentTypeLabels, UserDocumentTypeEnum } from "@/types/user-document.type";
import { COUNTRIES } from "@/config/countries";
import { WINDOWS_EVENTS } from "@/config/constants";
import { canManageTransferRequests, getAdminHeadAccessRole, getResolvedRoleName } from "@/lib/admin-head-access";
import { format } from "date-fns";
import {
  Edit,
  Trash2,
  Search,
  Loader2,
  Plus,
  MapPin,
  X,
  ArrowLeftRight,
  Building2,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface UserTableProps {
  initialFilters?: UserFilters;
}

const UserTable = ({ initialFilters }: UserTableProps) => {
  const router = useRouter();
  const { hasPermission } = usePermission();
  const canCreateUser = hasPermission(
    ModuleNameEnum.USERS,
    PermissionAction.CREATE,
  );
  const canUpdateUser = hasPermission(
    ModuleNameEnum.USERS,
    PermissionAction.UPDATE,
  );
  const canDeleteUser = hasPermission(
    ModuleNameEnum.USERS,
    PermissionAction.DELETE,
  );

  const [search, setSearch] = useState(initialFilters?.search || "");
  const [selectedRoleId, setSelectedRoleId] = useState(initialFilters?.roleId || "");
  const [selectedNationality, setSelectedNationality] = useState(
    initialFilters?.nationality || "",
  );
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [nationalityFilterOpen, setNationalityFilterOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(
    initialFilters?.docType || "",
  );
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>(initialFilters?.branchIds || []);
  const [branchSearch, setBranchSearch] = useState("");
  const [branchFilterOpen, setBranchFilterOpen] = useState(false);
  const branchFilterRef = useRef<HTMLDivElement>(null);
  const branchTriggerRef = useRef<HTMLButtonElement>(null);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const nationalityTriggerRef = useRef<HTMLButtonElement>(null);
  const nationalityDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [nationalityDropdownPosition, setNationalityDropdownPosition] = useState({
    top: 0,
    left: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(100);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
  } = useUsers(
    currentPage,
    rowsPerPage,
    search || undefined,
    selectedRoleId || undefined,
    selectedNationality || undefined,
    selectedDocType || undefined,
    undefined,
    undefined,
    selectedBranchIds.length > 0 ? selectedBranchIds : undefined,
  );

  // Position dropdown when opening (fixed so portal is positioned correctly)
  useEffect(() => {
    if (!branchFilterOpen || !branchTriggerRef.current) return;
    const rect = branchTriggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [branchFilterOpen]);

  useEffect(() => {
    if (!nationalityFilterOpen || !nationalityTriggerRef.current) return;
    const rect = nationalityTriggerRef.current.getBoundingClientRect();
    setNationalityDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, [nationalityFilterOpen]);

  // Close branch dropdown on outside click (portal is in body so check trigger + portaled panel)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        branchTriggerRef.current?.contains(target) ||
        branchDropdownRef.current?.contains(target)
      )
        return;
      setBranchFilterOpen(false);
    };
    if (branchFilterOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [branchFilterOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        nationalityTriggerRef.current?.contains(target) ||
        nationalityDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setNationalityFilterOpen(false);
    };

    if (nationalityFilterOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [nationalityFilterOpen]);

  const { data: branchData } = useInfiniteBranches(100);
  const branches = useMemo(
    () => branchData?.pages.flatMap((p: any) => p.data) || [],
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
  const { data: rolesResponse } = useRoles(1, 100);
  const { data: assignableRolesData } = useAssignableRoles();
  const roles = useMemo(() => {
    const assignable = assignableRolesData ?? [];
    if (assignable.length > 0) return assignable;
    return rolesResponse?.data || [];
  }, [assignableRolesData, rolesResponse?.data]);

  const { mutate: deleteUser } = useDeleteUser();
  const { mutate: createTransferRequest, isPending: isSavingBranch } =
    useCreateTransferRequest();
  const { user: currentUser } = useAppStore();
  const accessRole = getAdminHeadAccessRole(currentUser);
  const currentUserRoleName = getResolvedRoleName(currentUser);
  const isManagerRole = /^visa manager$/i.test(
    String(currentUserRoleName).trim()
  );
  // Keep the employee delete restriction explicit in the table so the button stays hidden
  // even if a permissive permission matrix is returned from older backend data.
  const canDeleteEmployee =
    canDeleteUser && accessRole !== "HR_HEAD" && accessRole !== "ACCOUNT_HEAD";
  const canShowTransferButton = canManageTransferRequests(currentUser);
  const canShowBulkImport = /hr\s*head|hr\s*manager|visa\s*manager|account\s*manager/i.test(
    String(currentUserRoleName)
  );

  const hideCurrentUserFromTable = /^(hr head|hr manager|visa head|visa manager|account head|account manager)$/i.test(
    String(currentUserRoleName).trim()
  );
  const currentUserId = (currentUser as any)?._id ?? (currentUser as any)?.id ?? "";
  const currentUserEmail = String((currentUser as any)?.email || "").trim().toLowerCase();

  const { data: pendingTransferData } = usePendingTransferRequests(
    { page: 1, limit: 1 },
    { enabled: canShowTransferButton }
  );
  const pendingTransferCount =
    typeof pendingTransferData?.pagination?.total === "number"
      ? pendingTransferData.pagination.total
      : 0;

  const [transferData, setTransferData] = useState<{
    userId: string;
    userName: string;
    currentBranchId: string;
    currentBranchName: string;
    targetBranchId: string;
  } | null>(null);

  const {
    data: transferBranchData,
    hasNextPage: hasNextTransferBranchPage,
    isFetchingNextPage: isFetchingNextTransferBranchPage,
    fetchNextPage: fetchNextTransferBranchPage,
  } = useInfiniteBranches(100, {
    includeAll: true,
    enabled: canShowTransferButton,
  });

  useEffect(() => {
    if (!canShowTransferButton) return;
    if (!hasNextTransferBranchPage || isFetchingNextTransferBranchPage) return;
    fetchNextTransferBranchPage();
  }, [
    canShowTransferButton,
    fetchNextTransferBranchPage,
    hasNextTransferBranchPage,
    isFetchingNextTransferBranchPage,
  ]);

  const transferBranches = useMemo(() => {
    const base = transferBranchData?.pages.flatMap((p: any) => p.data) || [];
    if (base.length === 0) return branches;

    const map = new Map<string, any>();
    base.forEach((branch: any) => {
      const branchId =
        typeof branch?._id === "string"
          ? branch._id
          : branch?._id?.toString?.() || "";
      if (!branchId) return;
      if (!map.has(branchId)) {
        map.set(branchId, branch);
      }
    });

    return Array.from(map.values());
  }, [transferBranchData, branches]);

  const handleBranchChange = () => {
    if (!transferData || !transferData.targetBranchId) return;

    createTransferRequest(
      {
        userId: transferData.userId,
        toBranchId: transferData.targetBranchId,
        requestReason: "Transfer requested from user table",
      },
      {
        onSuccess: () => {
          setTransferData(null);
        },
      }
    );
  };

  // Listen for delete event
  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent) => {
      const userId = event.detail?.id;
      if (userId) {
        if (!canDeleteEmployee) {
          toast.error("You do not have permission to delete employees.");
          return;
        }

        if (confirm("Are you sure you want to delete this user?")) {
          deleteUser(userId, {
            onSuccess: () => {
              toast.success("User deleted successfully.");
            },
            onError: (err: any) => {
              toast.error(err?.response?.data?.message || "Failed to delete user.");
            }
          });
        }
      }
    };
    window.addEventListener(
      WINDOWS_EVENTS.USER.DELETE.ID,
      handleDeleteEvent as EventListener,
    );
    return () =>
      window.removeEventListener(
        WINDOWS_EVENTS.USER.DELETE.ID,
        handleDeleteEvent as EventListener,
      );
  }, []);

  const allUsers = useMemo(() => {
    const list = usersResponse?.data || [];
    const isCreatedByCurrentManager = (userRecord: any) => {
      const creator = userRecord?.createdBy;

      if (!creator) {
        return false;
      }

      if (typeof creator === "string") {
        const normalizedCreator = creator.trim().toLowerCase();
        return normalizedCreator === String(currentUserId).trim().toLowerCase() || normalizedCreator === currentUserEmail;
      }

      const creatorId = String(creator?._id || creator?.id || "").trim().toLowerCase();
      const creatorEmail = String(creator?.email || "").trim().toLowerCase();

      return (
        (creatorId && creatorId === String(currentUserId).trim().toLowerCase()) ||
        (creatorEmail && creatorEmail === currentUserEmail)
      );
    };

    return list.filter((u: any) => {
      if (hideCurrentUserFromTable && currentUserId && String(u._id ?? u.id ?? "") === String(currentUserId)) {
        return false;
      }

      if (isManagerRole) {
        return isCreatedByCurrentManager(u);
      }

      return true;
    });
  }, [usersResponse, hideCurrentUserFromTable, currentUserId, currentUserEmail, isManagerRole]);

  const nationalityOptions = useMemo(() => {
    const fromUsers = allUsers
      .map((user: any) => String(user?.nationality || "").trim())
      .filter(Boolean);
    return Array.from(new Set([...COUNTRIES, ...fromUsers])).sort((left, right) =>
      left.localeCompare(right),
    );
  }, [allUsers]);

  const filteredNationalityOptions = useMemo(() => {
    const query = nationalitySearch.trim().toLowerCase();
    if (!query) return nationalityOptions;
    return nationalityOptions.filter((country) =>
      country.toLowerCase().includes(query),
    );
  }, [nationalityOptions, nationalitySearch]);

  const getUserDocumentTypes = (user: any) => {
    const rawDocuments = [
      ...(Array.isArray(user?.documents) ? user.documents : []),
      ...(Array.isArray(user?.currentStepData?.documents?.data)
        ? user.currentStepData.documents.data
        : []),
      ...(Array.isArray(user?.userDocuments) ? user.userDocuments : []),
    ];

    const rawTypes = [
      user?.docType,
      user?.documentType,
      user?.latestDocument?.docType,
      user?.latestDocument?.documentType,
      ...rawDocuments.map((document: any) => document?.docType || document?.documentType),
    ];

    return Array.from(
      new Set(
        rawTypes
          .map((value) => String(value || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user: any) => {
      const nationalityMatches =
        !selectedNationality ||
        String(user?.nationality || "").trim().toLowerCase() ===
          selectedNationality.trim().toLowerCase();

      const documentTypeMatches =
        !selectedDocType || getUserDocumentTypes(user).includes(selectedDocType.toLowerCase());

      return nationalityMatches && documentTypeMatches;
    });
  }, [allUsers, selectedNationality, selectedDocType]);

  const meta = useMemo(() => {
    if (isManagerRole) {
      return {
        page: 1,
        limit: rowsPerPage,
        total: filteredUsers.length,
        totalPages: 1,
      };
    }

    const pageMeta = usersResponse?.pagination;
    if (!pageMeta)
      return { page: currentPage, limit: rowsPerPage, total: 0, totalPages: 0 };
    return {
      page: parseInt((pageMeta.page as unknown as string) || "0", 10),
      limit:
        parseInt((pageMeta.limit as unknown as string) || "0", 10) ||
        rowsPerPage,
      total: pageMeta.total,
      totalPages: pageMeta.pages,
    };
  }, [usersResponse, currentPage, rowsPerPage, isManagerRole, filteredUsers.length]);

  // Keep current page valid when search changes result size.
  useEffect(() => {
    if (meta.totalPages > 0 && currentPage > meta.totalPages) {
      setCurrentPage(meta.totalPages);
    }
  }, [meta.totalPages, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) deleteUser(id);
  };

  // Pagination
  const totalPages = meta.totalPages || 1;
  const startEntry = meta.total === 0 ? 0 : (currentPage - 1) * meta.limit + 1;
  const endEntry = Math.min(currentPage * meta.limit, meta.total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    const adjustedStart = Math.max(1, end - maxVisible + 1);
    for (let i = adjustedStart; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100/50 overflow-hidden flex flex-col w-full text-left">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#111827]">Employees</h1>
          <p className="text-[13px] text-gray-400 mt-1">
            Stay informed about employees
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canShowTransferButton && (
            <div className="relative inline-block">
              <button
                onClick={() => router.push("/users/transfer-requests")}
                className="w-auto p-2 gap-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-amber-500/90 hover:bg-amber-600 text-white shadow-sm transition-colors hover:cursor-pointer"
                type="button"
              >
                Transfer Requests
              </button>
            </div>
          )}
          {canShowBulkImport && (
            <button
              onClick={() => router.push("/users/bulk-create")}
              className="w-auto p-2 gap-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-[#007aff]/80 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-colors hover:cursor-pointer"
            >
              Bulk Import
            </button>
          )}
          {canCreateUser && (
            <button
              onClick={() => router.push("/users/new")}
              className="w-auto p-2 gap-2 font-bold h-[38px] flex justify-center items-center rounded-[10px] bg-[#007aff] hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-colors hover:cursor-pointer"
            >
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="flex gap-10 px-6 py-5 border-b border-gray-100">
        <div>
          <p className="text-[40px] leading-tight font-bold text-[#4285f4] tracking-tight">
            {isLoading ? "—" : String(meta.total).padStart(2, "0")}
          </p>
          <p className="text-[13px] font-bold text-gray-900 tracking-wide mt-1">
            Employees
          </p>
        </div>
      </div>

      {/* ── Controls Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
        {/* Left Side: Search + Filters (same row) */}
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="relative w-[280px] shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2.5 text-[13px] font-medium border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white shadow-sm placeholder-gray-400 text-gray-700"
            />
          </div>

          {/* Branch multi-select with checkboxes — dropdown rendered in portal to avoid overflow clipping */}
          <div className="relative shrink-0" ref={branchFilterRef}>
            <button
              ref={branchTriggerRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (branchTriggerRef.current) {
                  const rect = branchTriggerRef.current.getBoundingClientRect();
                  setDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                }
                setBranchFilterOpen((o) => !o);
              }}
              className={cn(
                "w-60 h-[42px] flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white shadow-sm text-[13px] font-medium px-4 transition-colors",
                "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-0",
                branchFilterOpen && "ring-2 ring-blue-100 border-blue-400"
              )}
              title="Filter by branch(es)"
            >
              <span className="truncate text-left">
                {selectedBranchIds.length === 0
                  ? "All Branches"
                  : selectedBranchIds.length === 1
                    ? branches.find((b: any) => b._id === selectedBranchIds[0])?.branchName ?? "1 branch"
                    : `${selectedBranchIds.length} branches`}
              </span>
              <ChevronDown className={cn("w-4 h-4 shrink-0 text-gray-400 transition-transform", branchFilterOpen && "rotate-180")} />
            </button>
            {branchFilterOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={branchDropdownRef}
                  className="fixed z-9999 w-[280px] max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-2"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-3 pb-2">
                    <input
                      type="text"
                      value={branchSearch}
                      onChange={(e) => setBranchSearch(e.target.value)}
                      placeholder="Search branches..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBranchIds([]);
                        setCurrentPage(1);
                        setBranchSearch("");
                        setBranchFilterOpen(false);
                      }}
                      className="w-full text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg py-2 px-2 -mx-1"
                    >
                      Clear selection (All Branches)
                    </button>
                  </div>
                  <div className="border-t border-gray-100 my-1" />
                  {filteredBranches.map((branch: any) => (
                    <label
                      key={branch._id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-blue-50/50 rounded-lg mx-1",
                        selectedBranchIds.includes(branch._id) && "bg-blue-50/80"
                      )}
                    >
                      <Checkbox
                        checked={selectedBranchIds.includes(branch._id)}
                        onCheckedChange={(checked) => {
                          setSelectedBranchIds((prev) =>
                            checked
                              ? [...prev, branch._id]
                              : prev.filter((id) => id !== branch._id)
                          );
                          setCurrentPage(1);
                        }}
                        className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                      />
                      <span className="font-medium text-gray-800">{branch.branchName}</span>
                      {branch.branchCode && (
                        <span className="text-gray-500 text-[12px]">· {branch.branchCode}</span>
                      )}
                    </label>
                  ))}
                  {filteredBranches.length === 0 && (
                    <p className="px-3 py-4 text-[13px] text-gray-500">No branches available</p>
                  )}
                </div>,
                document.body
              )}
          </div>

          <Select
            value={selectedRoleId || "__all__"}
            onValueChange={(v) => {
              setSelectedRoleId(v === "__all__" ? "" : v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="w-[220px] shrink-0 h-[42px] rounded-xl border-gray-200 bg-white shadow-sm text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 data-placeholder:text-gray-500"
              title="Filter by role"
            >
              <span className="flex items-center gap-2">
                <SelectValue placeholder="All Roles" />
              </span>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-lg max-h-80" sideOffset={4}>
              <SelectItem value="__all__" className="rounded-lg py-2.5 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                All Roles
              </SelectItem>
              {(roles || []).filter(Boolean).map((role: any) => (
                <SelectItem
                  key={role?._id ?? role?.id}
                  value={role?._id ?? role?.id}
                  className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
                >
                  <span className="font-medium">{role?.roleName ?? "—"}</span>
                  {role?.roleType && (
                    <span className="text-gray-500 font-normal ml-1.5">· {String(role.roleType).toLowerCase()}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative shrink-0">
            <button
              ref={nationalityTriggerRef}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (nationalityTriggerRef.current) {
                  const rect = nationalityTriggerRef.current.getBoundingClientRect();
                  setNationalityDropdownPosition({ top: rect.bottom + 4, left: rect.left });
                }
                setNationalityFilterOpen((open) => !open);
              }}
              className={cn(
                "w-[220px] h-[42px] flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white shadow-sm text-[13px] font-medium px-4 transition-colors",
                "hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:ring-offset-0",
                nationalityFilterOpen && "ring-2 ring-blue-100 border-blue-400",
              )}
              title="Filter by nationality"
            >
              <span className="truncate text-left">
                {selectedNationality || "All Nationalities"}
              </span>
              <ChevronDown className={cn("w-4 h-4 shrink-0 text-gray-400 transition-transform", nationalityFilterOpen && "rotate-180")} />
            </button>
            {nationalityFilterOpen &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={nationalityDropdownRef}
                  className="fixed z-9999 w-[280px] max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-2"
                  style={{ top: nationalityDropdownPosition.top, left: nationalityDropdownPosition.left }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="px-3 pb-2">
                    <input
                      type="text"
                      value={nationalitySearch}
                      onChange={(event) => setNationalitySearch(event.target.value)}
                      placeholder="Search nationalities..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div className="px-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNationality("");
                        setNationalitySearch("");
                        setCurrentPage(1);
                        setNationalityFilterOpen(false);
                      }}
                      className="w-full text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50 rounded-lg py-2 px-2 -mx-1"
                    >
                      Clear selection (All Nationalities)
                    </button>
                  </div>
                  <div className="border-t border-gray-100 my-1" />
                  {filteredNationalityOptions.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => {
                        setSelectedNationality(country);
                        setCurrentPage(1);
                        setNationalityFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-blue-50/50 rounded-lg mx-1",
                        selectedNationality === country && "bg-blue-50 text-blue-700",
                      )}
                    >
                      {country}
                    </button>
                  ))}
                  {filteredNationalityOptions.length === 0 && (
                    <p className="px-3 py-4 text-[13px] text-gray-500">No nationalities available</p>
                  )}
                </div>,
                document.body,
              )}
          </div>

          <Select
            value={selectedDocType || "__all__"}
            onValueChange={(value) => {
              setSelectedDocType(value === "__all__" ? "" : value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="w-[200px] shrink-0 h-[42px] rounded-xl border-gray-200 bg-white shadow-sm text-[13px] font-medium focus:ring-2 focus:ring-blue-100 focus:ring-offset-0 data-placeholder:text-gray-500"
              title="Filter by document type"
            >
              <SelectValue placeholder="All Doc Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-gray-200 shadow-lg max-h-80" sideOffset={4}>
              <SelectItem value="__all__" className="rounded-lg py-2.5 focus:bg-blue-50 focus:text-blue-900 cursor-pointer">
                All Doc Types
              </SelectItem>
              {Object.values(UserDocumentTypeEnum).map((docType) => (
                <SelectItem
                  key={docType}
                  value={docType}
                  className="rounded-lg py-2.5 pl-8 pr-3 focus:bg-blue-50 focus:text-blue-900 cursor-pointer"
                >
                  {DocumentTypeLabels[docType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pl-6 pr-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                EMP CODE
              </th>
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                EMP NAME
              </th>
              {/* <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                ROLE
              </th> */}
              <th className="px-3 py-4 text-left text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                BRANCH
              </th>
              {/* <th className="px-3 py-4 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                CREATED
              </th> */}
              <th className="px-3 py-4 pr-6 text-center text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading || isFetching ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No employees found
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const uAny = u as any;
                const roleName =
                  uAny.permissions?.designation?.name ??
                  uAny.designationRoleName ??
                  (uAny.roleId && typeof uAny.roleId === "object" && uAny.roleId?.roleName != null
                    ? String(uAny.roleId.roleName)
                    : null) ??
                  (uAny.role?.roleName != null ? String(uAny.role.roleName) : null) ??
                  "—";

                const empCode =
                  u.employeeId ||
                  u.uniqueWorkerId ||
                  `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

                return (
                  <tr
                    key={u._id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* EMP CODE */}
                    <td className="pl-6 pr-3 py-4 text-[13px] font-bold text-gray-800">
                      {empCode}
                    </td>

                    {/* EMP NAME */}
                    <td className="px-3 py-4">
                      <p className="font-bold text-gray-800 text-[13px]">
                        {u.fullName || "Anirudh Tiwari"}
                      </p>
                      <p className="text-[12px] text-gray-400 mt-0.5">
                        {u.email}
                      </p>
                    </td>

                    {/* ROLE (Pill) */}
                    {/* <td className="px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 border rounded-full text-[10px] font-bold px-3 py-1 tracking-wide ${
                          roleName.toLowerCase().includes("hr")
                            ? "border-purple-200 text-purple-600 bg-purple-50"
                            : "border-orange-200 text-orange-600 bg-orange-50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            roleName.toLowerCase().includes("hr")
                              ? "bg-purple-500"
                              : "bg-orange-400"
                          }`}
                        />
                        {roleName.toUpperCase() === "—"
                          ? "ADMIN"
                          : roleName.toUpperCase()}
                      </span>
                    </td> */}

                    {/* BRANCH */}
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-1.5 w-fit px-2 py-1 -ml-2 rounded-md transition-colors group/branch">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[12px] font-semibold text-gray-700">
                          {(typeof u.branchId === "object"
                            ? (u.branchId as any)?.branchName
                            : branches.find((b: any) => b._id === u.branchId)
                                ?.branchName) || "Unassigned"}
                        </span>
                        {canShowTransferButton && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const branchObj: any =
                                typeof u.branchId === "object"
                                  ? u.branchId
                                  : branches.find(
                                      (b: any) => b._id === u.branchId,
                                    );
                              const rawId = (u as any)._id ?? (u as any).id;
                              const uid =
                                rawId == null
                                  ? ""
                                  : typeof rawId === "string"
                                    ? rawId
                                    : (rawId as any)?.toString?.() ?? String(rawId);
                              const cid =
                                branchObj?._id != null
                                  ? typeof branchObj._id === "string"
                                    ? branchObj._id
                                    : (branchObj._id as any)?.toString?.() ?? ""
                                  : "";
                              setTransferData({
                                userId: uid,
                                userName: u.fullName || "—",
                                currentBranchId: cid,
                                currentBranchName:
                                  branchObj?.branchName || "Unassigned",
                                targetBranchId: "",
                              });
                            }}
                            className="ml-1 p-1.5 bg-blue-100 hover:bg-blue-200 rounded-md text-blue-600 transition-all cursor-pointer font-bold"
                            aria-label="Transfer employee to another branch"
                            title="Transfer employee to another branch"
                            type="button"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* CREATED */}
                    {/* <td className="px-3 py-4 text-center text-gray-600 text-[13px] font-medium">
                      {u.createdAt
                        ? format(new Date(u.createdAt), "dd MMM, yyyy")
                        : "Nov 23, 2025"}
                    </td> */}

                    {/* ACTIONS */}
                    <td className="px-3 py-4 pr-6 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-100 transition-opacity">
                        {canUpdateUser && (
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined" && u._id)
                                window.location.href = `/users/${u._id}`;
                            }}
                            className="w-7 h-7 rounded-[6px] bg-blue-50 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDeleteEmployee && (
                          <button
                            onClick={() => {
                              if (typeof window !== "undefined" && u._id) {
                                const event = new CustomEvent(
                                  WINDOWS_EVENTS.USER.DELETE.ID,
                                  {
                                    detail: { id: u._id },
                                  },
                                );
                                window.dispatchEvent(event);
                              }
                            }}
                            className="w-7 h-7 rounded-[6px] bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-t border-gray-100 gap-4">
        <p className="text-[13px] font-medium text-gray-500">
          Showing {startEntry} to {endEntry} of {meta.total} entries
        </p>

        <div className="flex items-center gap-1.5">
          {/* First */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            «
          </button>

          {/* Prev */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ‹
          </button>

          {/* Page numbers */}
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              onClick={() => setCurrentPage(pg)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl text-[13px] font-bold transition-colors ${
                currentPage === pg
                  ? "bg-[#007aff] text-white shadow-sm shadow-blue-500/30"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {pg}
            </button>
          ))}

          {/* Next */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            ›
          </button>

          {/* Last */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors text-sm"
          >
            »
          </button>
        </div>
      </div>
      {/* ── Branch Transfer Popup ── */}
      {transferData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Transfer Employee
              </h2>
              <button
                onClick={() => setTransferData(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm text-gray-500">Employee Name</p>
                <p className="text-base font-medium text-gray-900 mt-1">
                  {transferData.userName}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Current Branch
                  </p>
                  <p className="text-[15px] font-semibold text-gray-900 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {transferData.currentBranchName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">
                  Transfer To Branch
                </label>
                <select
                  className="w-full text-[14px] border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl px-4 py-3 outline-none transition-all cursor-pointer bg-white"
                  value={transferData.targetBranchId}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      targetBranchId: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Select target branch
                  </option>
                  {transferBranches.map((b: any) => {
                    const bid =
                      typeof b._id === "string"
                        ? b._id
                        : (b._id as any)?.toString?.() ?? "";
                    return (
                      <option key={bid || b.branchName} value={bid}>
                        {b.branchName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => setTransferData(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBranchChange}
                disabled={!transferData.targetBranchId || isSavingBranch}
                className="px-5 py-2 text-sm font-bold bg-[#007aff] hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingBranch && <Loader2 className="w-4 h-4 animate-spin" />}
                Transfer Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
