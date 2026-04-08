"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { stockColumns } from "@/config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { useInfiniteStocks, useDeleteStock } from "@/hooks/query/stock.hook";
import { Plus, Filter } from "lucide-react";
import { Stock, StockFilters } from "@/types/stock.type";

interface StockTableProps {
  filters?: StockFilters;
}

const StockTable = ({ filters }: StockTableProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: stocksPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteStocks({ limit: 10, ...filters });

  const { mutate: deleteStock } = useDeleteStock();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const stocks = useMemo(() => {
    const raw = (stocksPages?.pages || []).flatMap((p) => p?.stocks ?? []);
    const map = new Map<string, Stock>();
    for (const s of raw) {
      const key = s?.id;
      if (key && !map.has(key)) {
        map.set(key, s);
      }
    }
    return Array.from(map.values());
  }, [stocksPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleLocationFilter = (value: string) => {
    setLocationFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setLocationFilter("");
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this stock item?")) {
      deleteStock(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading stocks..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Stocks"
        message={error?.message || "Failed to load stocks. Please try again."}
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={stockColumns} rows={stocks} />
        </div>
      </div>
    </>
  );
};

export default StockTable;
