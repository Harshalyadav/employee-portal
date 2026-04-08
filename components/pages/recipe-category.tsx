"use client";
import { useRouter } from "next/navigation";
import PageHeader from "../sections/PageHeader";
import RecipeCategoryTable from "@/components/datatable/recipe-category/RecipeCategoryTable";
import { Button } from "../ui/button";

const RecipeCategoryPage = () => {
  const router = useRouter();

  return (
    <div className="w-full">
      <PageHeader
        title="Recipe Categories"
        options={
          <Button onClick={() => router.push("/recipe-categories/new")}>
            Create Category
          </Button>
        }
      />
      <RecipeCategoryTable />
    </div>
  );
};

export default RecipeCategoryPage;
