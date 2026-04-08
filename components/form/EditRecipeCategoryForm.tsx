"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editRecipeCategorySchema,
  type EditRecipeCategorySchema,
  type RecipeCategory,
} from "@/types/recipe-category.type";
import { useEditRecipeCategory } from "@/hooks/query/recipe-category.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { VideoUpload } from "@/components/upload/VideoUpload";

interface EditRecipeCategoryFormProps {
  defaultValues: Partial<RecipeCategory>;
  onSuccess?: () => void;
}
// Form to edit recipe category details
export function EditRecipeCategoryForm({
  defaultValues,
  onSuccess,
}: EditRecipeCategoryFormProps) {
  const editCategoryMutation = useEditRecipeCategory();
  const isLoading = editCategoryMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditRecipeCategorySchema>({
    resolver: zodResolver(editRecipeCategorySchema),
    mode: "onBlur",
    defaultValues,
  });

  const onSubmit = async (data: EditRecipeCategorySchema) => {
    const { id, ...payload } = data;
    editCategoryMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          reset(data);
          onSuccess?.();
        },
      }
    );
  };

  const error = editCategoryMutation.isError
    ? editCategoryMutation.error?.message
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="recipes">Linked Recipes</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                type="text"
                disabled={isLoading}
                {...register("slug")}
              />
              {errors.slug && (
                <p className="text-xs text-destructive">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                disabled={isLoading}
                {...register("description")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-24"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <SingleFileUpload
                folder="recipe-categories"
                accept="image/*"
                label="Category Image"
                showPreview={true}
                defaultValue={(defaultValues as any)?.imageUrl}
                onUploadSuccess={(url) => {
                  setValue("imageUrl", url);
                }}
              />
            </div>

            <div className="space-y-2">
              <VideoUpload
                folder="recipe-categories"
                label="Category Video"
                defaultValue={(defaultValues as any)?.videoUrl}
                onUploadSuccess={(url) => {
                  setValue("videoUrl", url);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                disabled={isLoading}
                {...register("status")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select status</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>
        </TabsContent>

        {/* Linked Recipes */}
        <TabsContent value="recipes" className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Recipe Name</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {defaultValues?.linkedRecipes?.length ? (
                  defaultValues.linkedRecipes.map((recipe, idx) => (
                    <tr
                      key={recipe.recipeId}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">{recipe.recipeName}</td>
                      <td className="p-2">{recipe.recipeType}</td>
                      <td className="p-2">₹{recipe.price || 0}</td>
                      <td className="p-2">{recipe.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      No recipes linked to this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
