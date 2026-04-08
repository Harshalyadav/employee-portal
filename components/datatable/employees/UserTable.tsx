"use client";

import { useEffect, useMemo, useState } from "react";
import { userColumns } from "@/config";
import { DataTable } from "../Datable";
import { useInfiniteUsers, useDeleteUser } from "@/hooks/query/user.hook";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { UserFilters } from "@/types";
import { WINDOWS_EVENTS } from "@/config/constants";

interface UserTableProps {
  initialFilters?: UserFilters;
}

const UserTable = ({ initialFilters }: UserTableProps) => {
  const [search, setSearch] = useState(initialFilters?.search || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filters: UserFilters = useMemo(
    () => ({
      ...initialFilters,
      search: search || undefined,
      // page: currentPage,
      // limit: rowsPerPage,
    }),
    [initialFilters, search, currentPage, rowsPerPage],
  );

  const {
    data: usersPages,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
  } = useInfiniteUsers(filters);

  const { mutate: deleteUser } = useDeleteUser();

  useEffect(() => {
    fetchNextPage();
  }, [currentPage, hasNextPage]);

  // Listen for delete event from datatable
  useEffect(() => {
    const handleDeleteEvent = (event: CustomEvent) => {
      const userId = event.detail?.id;
      if (userId) {
        handleDelete(userId);
      }
    };

    window.addEventListener(
      WINDOWS_EVENTS.USER.DELETE.ID,
      handleDeleteEvent as EventListener,
    );

    return () => {
      window.removeEventListener(
        WINDOWS_EVENTS.USER.DELETE.ID,
        handleDeleteEvent as EventListener,
      );
    };
  }, []);

  // Get current page data and meta
  const currentPageData = useMemo(() => {
    const allPages = usersPages?.pages || [];

    console.log("All Pages:", allPages);

    // Find the page matching our current page number
    // Support both 'meta' and 'pagination' property names
    const pageData = allPages.find((p) => {
      const pageMeta = p.pagination;
      return (
        parseInt((pageMeta?.page as unknown as string) || "0", 10) ===
        currentPage
      );
    });
    return pageData;
  }, [usersPages, currentPage]);

  const users = useMemo(() => {
    const page = currentPageData as any;
    return page?.data || page?.users || [];
  }, [currentPageData]);

  const meta = useMemo(() => {
    // Support both 'meta' and 'pagination' property names
    const pageMeta = currentPageData?.pagination || currentPageData?.pagination;
    if (!pageMeta) {
      return {
        page: currentPage,
        limit: rowsPerPage,
        total: 0,
        totalPages: 0,
      };
    }
    return {
      page: parseInt((pageMeta.page as unknown as string) || "0", 10),
      limit:
        parseInt((pageMeta.limit as unknown as string) || "0", 10) ||
        rowsPerPage,
      total: pageMeta.total,
      totalPages: pageMeta.pages,
    };
  }, [currentPageData, currentPage, rowsPerPage]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (limit: number) => {
    setRowsPerPage(limit);
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser(id);
    }
  };

  if (isError) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Error Loading Users"
        message="Failed to load users. Please try again."
      />
    );
  }

  return (
    <>
      {/* <ErrorAlert
        isOpen={isError}
        title="Error Loading Users"
        message={error?.message || "Failed to load users. Please try again."}
      /> */}
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable
            columns={userColumns}
            rows={users}
            serverSide={true}
            meta={meta}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            onSearchChange={handleSearch}
            isLoading={isLoading || isFetchingNextPage}
          />
        </div>
      </div>
    </>
  );
};

export default UserTable;
