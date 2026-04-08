"use client";

import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { rawMaterialColumns } from "@/config";
import {
  useDeleteRawMaterial,
  useInfiniteRawMaterials,
} from "@/hooks/query/raw-material.hook";
import { RawMaterialFilters } from "@/types";
import { WINDOWS_EVENTS } from "@/config/constants";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../Datable";

const RawMaterialTable = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filters: RawMaterialFilters = useMemo(
    () => ({
      search: search || undefined,
      limit: rowsPerPage,
    }),
    [search, currentPage, rowsPerPage]
  );

  const {
    data: rawMaterialsPages,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    error,
  } = useInfiniteRawMaterials(filters);

  const { mutate: deleteRawMaterial } = useDeleteRawMaterial();

  // Listen for delete events
  useEffect(() => {
    const handleDelete = (event: CustomEvent) => {
      const { id } = event.detail;
      if (id && confirm("Are you sure you want to delete this raw material?")) {
        deleteRawMaterial(id);
      }
    };

    window.addEventListener(
      WINDOWS_EVENTS.RAW_MATERIAL.DELETE.ID as any,
      handleDelete as any
    );

    return () => {
      window.removeEventListener(
        WINDOWS_EVENTS.RAW_MATERIAL.DELETE.ID as any,
        handleDelete as any
      );
    };
  }, [deleteRawMaterial]);

  // Get current page data and meta
  const currentPageData = useMemo(() => {
    const allPages = rawMaterialsPages?.pages || [];
    // Find the page matching our current page number
    const pageData = allPages.find((p) => {
      const pageMeta = p.pagination;
      return (
        parseInt((pageMeta?.page as unknown as string) ?? "1", 10) ===
        currentPage
      );
    });
    return pageData;
  }, [rawMaterialsPages, currentPage, fetchNextPage]);

  const rawMaterials = useMemo(() => {
    return currentPageData?.items || [];
  }, [currentPageData]);

  const meta = useMemo(() => {
    if (!currentPageData?.pagination) {
      return {
        page: currentPage,
        limit: rowsPerPage,
        total: 0,
        totalPages: 0,
      };
    }
    return {
      page: parseInt(
        (currentPageData.pagination.page as unknown as string) ?? "1",
        10
      ),
      limit: parseInt(
        (currentPageData.pagination.limit as unknown as string) ?? "10",
        10
      ),
      total: currentPageData.pagination.total,
      totalPages: currentPageData.pagination.totalPages,
    };
  }, [currentPageData, currentPage, rowsPerPage]);

  useEffect(() => {
    fetchNextPage();
  }, [currentPage]);

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
    if (confirm("Are you sure you want to delete this raw material?")) {
      deleteRawMaterial(id);
    }
  };

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Raw Materials"
        message={
          error?.message || "Failed to load raw materials. Please try again."
        }
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable
            columns={rawMaterialColumns}
            rows={rawMaterials}
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

export default RawMaterialTable;
