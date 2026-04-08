"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { recipeColumns } from "@/config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { useInfiniteRecipes, useDeleteRecipe } from "@/hooks/query/recipe.hook";
import { Plus, Filter } from "lucide-react";
import { Recipe, RecipeFilters } from "@/types/recipe.type";

const RecipeTable = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  const filters: RecipeFilters = useMemo(
    () => ({
      search: search || undefined,
      categoryId: categoryFilter || undefined,
      difficulty: difficultyFilter || undefined,
      status: statusFilter || undefined,
      page: currentPage,
      limit: 10,
    }),
    [search, categoryFilter, difficultyFilter, statusFilter, currentPage]
  );

  const {
    data: recipesPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteRecipes(filters);

  const { mutate: deleteRecipe } = useDeleteRecipe();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const handleDeleteEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      handleDelete(customEvent.detail.id);
    };

    window.addEventListener("deleteRecipe", handleDeleteEvent);
    return () => {
      window.removeEventListener("deleteRecipe", handleDeleteEvent);
    };
  }, []);

  const recipes = useMemo(() => {
    const raw = (recipesPages?.pages || []).flatMap((p) => p?.items ?? []);
    const map = new Map<string, Recipe>();
    for (const r of raw) {
      const key = r?.id;
      if (key && !map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [recipesPages]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleDifficultyFilter = (value: string) => {
    setDifficultyFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setDifficultyFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this recipe?")) {
      deleteRecipe(id);
    }
  };

  // if (isLoading) {
  //   return <LoadingState message="Loading recipes..." />;
  // }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Recipes"
        message={error?.message || "Failed to load recipes. Please try again."}
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={recipeColumns} rows={recipes} />
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

export default RecipeTable;
