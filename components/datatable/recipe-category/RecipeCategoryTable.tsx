"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { recipeCategoryColumns } from "@/config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import {
  useInfiniteRecipeCategories,
  useDeleteRecipeCategory,
} from "@/hooks/query/recipe-category.hook";
import { Plus, Filter } from "lucide-react";
import {
  RecipeCategory,
  RecipeCategoryFilters,
} from "@/types/recipe-category.type";

interface RecipeCategoryTableProps {
  filters?: RecipeCategoryFilters;
}

const RecipeCategoryTable = ({ filters }: RecipeCategoryTableProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: categoriesPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteRecipeCategories({ limit: 10, ...filters });

  const { mutate: deleteCategory } = useDeleteRecipeCategory();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const categories = useMemo(() => {
    const raw = (categoriesPages?.pages || []).flatMap((p) => p?.items ?? []);
    const map = new Map<string, RecipeCategory>();
    for (const c of raw) {
      const key = c?.id;
      if (key && !map.has(key)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [categoriesPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return <LoadingState message="Loading recipe categories..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Recipe Categories"
        message={
          error?.message ||
          "Failed to load recipe categories. Please try again."
        }
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={recipeCategoryColumns} rows={categories} />
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

export default RecipeCategoryTable;
