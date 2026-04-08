"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { modelColumns } from "@/config";
import { DataTable } from "../Datable";
import { useInfiniteModels, useDeleteModel } from "@/hooks/query/model.hook";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { Plus, Filter } from "lucide-react";
import { Model, ModelFilters } from "@/types/model.type";
import { WINDOWS_EVENTS } from "@/config/constants";

interface ModelTableProps {
  filters?: ModelFilters;
}

const ModelTable = ({ filters }: ModelTableProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: modelsPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteModels({
    ...filters,
    search: search || undefined,
    limit: rowsPerPage,
  });

  const { mutate: deleteModel } = useDeleteModel();

  // Pagination meta and current page data
  const currentPageData = useMemo(() => {
    const allPages = modelsPages?.pages || [];
    // Find the page matching our current page number
    const pageData = allPages.find((p) => {
      const pageMeta = p.meta;
      return pageMeta?.page === currentPage;
    });
    return pageData;
  }, [modelsPages, currentPage, fetchNextPage]);

  const models = useMemo(() => {
    return currentPageData?.items || [];
  }, [currentPageData]);

  const meta = useMemo(() => {
    if (!currentPageData?.meta) {
      return {
        page: currentPage,
        limit: rowsPerPage,
        total: 0,
        totalPages: 0,
      };
    }
    return {
      page: currentPageData.meta.page,
      limit: currentPageData.meta.limit,
      total: currentPageData.meta.total,
      totalPages: currentPageData.meta.totalPages,
    };
  }, [currentPageData, currentPage, rowsPerPage]);

  useEffect(() => {
    fetchNextPage();
  }, [currentPage]);

  useEffect(() => {
    const handleDeleteEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      const id = customEvent.detail?.id;
      if (id) {
        handleDelete(id);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(
        WINDOWS_EVENTS.MODEL.DELETE.ID,
        handleDeleteEvent
      );
      return () => {
        window.removeEventListener(
          WINDOWS_EVENTS.MODEL.DELETE.ID,
          handleDeleteEvent
        );
      };
    }
  }, []);

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

  const handleStatusFilter = (value: string) => {
    setCurrentPage(1);
  };

  // Remove unused handleClearFilters and statusFilter

  const handleEdit = (id: string) => {
    router.push(`/models/${id}`);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this model?")) {
      deleteModel(id);
    }
  };

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Models"
        message={error?.message || "Failed to load models. Please try again."}
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable
            columns={modelColumns}
            rows={models}
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

export default ModelTable;
