"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { warehouseColumns } from "@/config/datatable-config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import {
  useInfiniteWarehouses,
  useDeleteWarehouse,
} from "@/hooks/query/warehouse.hook";
import { Warehouse, WarehouseFilters } from "@/types/warehouse.type";

interface WarehouseTableProps {
  filters?: WarehouseFilters;
}

const WarehouseTable = ({ filters }: WarehouseTableProps) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: warehousesPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteWarehouses({ limit: 10, ...filters });

  const { mutate: deleteWarehouse } = useDeleteWarehouse();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const warehouses = useMemo(() => {
    const raw = (warehousesPages?.pages || []).flatMap(
      (p) => p?.warehouses ?? []
    );
    const map = new Map<string, Warehouse>();
    for (const w of raw) {
      const key = w?.id;
      if (key && !map.has(key)) {
        map.set(key, w);
      }
    }
    return Array.from(map.values());
  }, [warehousesPages]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this warehouse?")) {
      deleteWarehouse(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading warehouses..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Warehouses"
        message={
          error?.message || "Failed to load warehouses. Please try again."
        }
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={warehouseColumns} rows={warehouses} />
        </div>

        {/* {isFetchingNextPage && (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading more...
          </p>
        </div>
      )} */}
      </div>
    </>
  );
};

export default WarehouseTable;
