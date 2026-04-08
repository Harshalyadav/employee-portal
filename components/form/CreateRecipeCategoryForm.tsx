"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRecipeCategorySchema,
  type CreateRecipeCategorySchema,
} from "@/types/recipe-category.type";
import { useCreateRecipeCategory } from "@/hooks/query/recipe-category.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { VideoUpload } from "@/components/upload/VideoUpload";

interface CreateRecipeCategoryFormProps {
  onSuccess?: () => void;
}

export function CreateRecipeCategoryForm({
  onSuccess,
}: CreateRecipeCategoryFormProps) {
  const createCategoryMutation = useCreateRecipeCategory();
  const isLoading = createCategoryMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateRecipeCategorySchema>({
    resolver: zodResolver(createRecipeCategorySchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: CreateRecipeCategorySchema) => {
    createCategoryMutation.mutate(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  const error = createCategoryMutation.isError
    ? createCategoryMutation.error?.message
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Bewragesss"
            disabled={isLoading}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            type="text"
            placeholder="bewragesss"
            disabled={isLoading}
            {...register("slug")}
          />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Hot and healthy soups"
            disabled={isLoading}
            {...register("description")}
            className="w-full px-3 py-2 border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-24"
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
            onUploadSuccess={(url) => {
              setValue("imageUrl", url);
            }}
          />
        </div>

        <div className="space-y-2">
          <VideoUpload
            folder="recipe-categories"
            label="Category Video"
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
            className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating..." : "Save Category"}
        </Button>
      </div>
    </form>
  );
}
