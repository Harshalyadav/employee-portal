"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { menuColumns } from "@/config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { useInfiniteMenus, useDeleteMenu } from "@/hooks/query/menu.hook";
import { Plus, Filter } from "lucide-react";
import { Menu, MenuFilters } from "@/types/menu.type";

interface MenuTableProps {
  filters?: MenuFilters;
}

const MenuTable = ({ filters }: MenuTableProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: menusPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteMenus({ limit: 10, ...filters });

  const { mutate: deleteMenu } = useDeleteMenu();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const menus = useMemo(() => {
    const raw = (menusPages?.pages || []).flatMap((p) => p?.items ?? []);
    const map = new Map<string, Menu>();
    for (const m of raw) {
      const key = m?.id;
      if (key && !map.has(key)) {
        map.set(key, m);
      }
    }
    return Array.from(map.values());
  }, [menusPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return <LoadingState message="Loading menus..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Menus"
        message={error?.message || "Failed to load menus. Please try again."}
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={menuColumns} rows={menus} />
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

export default MenuTable;
