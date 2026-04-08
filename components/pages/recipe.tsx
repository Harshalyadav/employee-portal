"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import RecipeTable from "@/components/datatable/recipe/RecipeTable";
import { Button } from "../ui/button";

const RecipePage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Recipes"
        options={
          <Button onClick={() => router.push("/recipes/new")}>
            Create Recipe
          </Button>
        }
      />
      <RecipeTable />
    </div>
  );
};

export default RecipePage;
