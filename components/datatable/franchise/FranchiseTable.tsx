"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { franchiseColumns } from "@/config";
import { DataTable } from "../Datable";
import { LoadingState, ErrorAlert } from "@/components";
import {
  useInfiniteFranchises,
  useDeleteFranchise,
} from "@/hooks/query/franchise.hook";
import { Plus, Filter } from "lucide-react";
import { Franchise, FranchiseFilters } from "@/types/franchise.type";

interface FranchiseTableProps {
  filters?: FranchiseFilters;
}

const FranchiseTable = ({ filters }: FranchiseTableProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: franchisesPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteFranchises({ limit: 10, ...filters });

  const { mutate: deleteFranchise } = useDeleteFranchise();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const franchises = useMemo(() => {
    const raw = (franchisesPages?.pages || []).flatMap((p) => p?.data ?? []);
    const map = new Map<string, Franchise>();
    for (const f of raw) {
      const key = f?.id;
      if (key && !map.has(key)) {
        map.set(key, f);
      }
    }
    return Array.from(map.values());
  }, [franchisesPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleCityFilter = (value: string) => {
    setCityFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCityFilter("");
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this franchise?")) {
      deleteFranchise(id);
    }
  };

  // if (isLoading) {
  //   return <LoadingState message="Loading franchises..." />;
  // }

  return (
    <>
      {isError && (
        <ErrorAlert
          isOpen={true}
          message={error?.message || "An error occurred"}
        />
      )}
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={franchiseColumns} rows={franchises} />
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

export default FranchiseTable;
