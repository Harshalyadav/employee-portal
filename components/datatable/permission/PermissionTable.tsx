"use client";

import { permissionColumns } from "@/config";
import {
  useDeletePermission,
  useInfinitePermissions,
} from "@/hooks/query/permission.hook";
import { Permission, PermissionFilters } from "@/types/permission.type";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";

const PermissionTable = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filters: PermissionFilters = useMemo(
    () => ({
      search: search || undefined,
      page: currentPage,
      limit: 10,
    }),
    [search, currentPage]
  );

  const {
    data: permissionsPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfinitePermissions(filters);

  const { mutate: deletePermission } = useDeletePermission();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const permissions = useMemo(() => {
    const raw = (permissionsPages?.pages || []).flatMap((p) => p.items ?? []);
    console.log("permissionsPages", raw);
    const map = new Map<string, Permission>();
    for (const r of raw) {
      const key = r?.id;
      if (key && !map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [permissionsPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this permission?")) {
      deletePermission(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading permissions..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Permissions"
        message={
          error?.message || "Failed to load permissions. Please try again."
        }
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={permissionColumns} rows={permissions} />
        </div>

        {isFetchingNextPage && (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading more...
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PermissionTable;
