"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultipleFileUpload } from "@/components/upload/MultipleFileUpload";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { useInfiniteRawMaterials } from "@/hooks/query/raw-material.hook";
import { useInfiniteRecipeCategories } from "@/hooks/query/recipe-category.hook";
import { useEditRecipe } from "@/hooks/query/recipe.hook";
import { cn, computeNutritionFromIngredients } from "@/lib/utils";
import {
  editRecipeSchema,
  type EditRecipeSchema,
  RECIPE_DIFFICULTIES,
  RECIPE_STATUSES,
  stepFieldsRecipe,
} from "@/types/recipe.type";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Apple,
  Braces,
  CheckCircle2,
  ChefHat,
  Flame,
  FlameIcon,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

interface EditRecipeFormProps {
  defaultValues: Partial<EditRecipeSchema>;
  onSuccess?: () => void;
}

export function EditRecipeForm({
  defaultValues,
  onSuccess,
}: EditRecipeFormProps) {
  const editRecipeMutation = useEditRecipe();
  const isLoading = editRecipeMutation.isPending;

  // Multi-step state
  const steps = [
    "basic",
    "ingredients",
    "preparation",
    "nutrition",
    "media",
    "review",
  ];
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [showJsonReview, setShowJsonReview] = useState(false);

  // StepCard configuration
  const stepCardSteps = [
    {
      label: "Basic Information",
      description: "Recipe name, category & difficulty",
      icon: <ChefHat className="w-5 h-5" />,
    },
    {
      label: "Ingredients",
      description: "Add raw materials and quantities",
      icon: <FlameIcon className="w-5 h-5" />,
    },
    {
      label: "Preparation",
      description: "Steps, tips & videos",
      icon: <Plus className="w-5 h-5" />,
    },
    {
      label: "Nutrition",
      description: "Nutritional information",
      icon: <Plus className="w-5 h-5" />,
    },
    {
      label: "Media",
      description: "Images & videos",
      icon: <Plus className="w-5 h-5" />,
    },
    {
      label: "Review & Submit",
      description: "Verify details before publishing",
      icon: <Plus className="w-5 h-5" />,
    },
  ];
  const {
    data: rawMaterialsPages,
    hasNextPage: hasNextRawMaterials,
    fetchNextPage: fetchNextRawMaterials,
    isFetchingNextPage,
    isLoading: isLoadingRawMaterials,
  } = useInfiniteRawMaterials({ limit: 20 });
  const { data: categoriesPages } = useInfiniteRecipeCategories({ limit: 100 });

  // Ensure raw materials are fetched on mount
  useEffect(() => {
    if (!rawMaterialsPages?.pages || rawMaterialsPages.pages.length === 0) {
      fetchNextRawMaterials();
    }
  }, []);

  const rawMaterials = useMemo(() => {
    const raw = (rawMaterialsPages?.pages || []).flatMap((p) => p?.items ?? []);
    const map = new Map();
    for (const r of raw) {
      const key = r?._id || r?.id;
      if (key && !map.has(key)) {
        map.set(key, r);
      }
    }
    return Array.from(map.values());
  }, [rawMaterialsPages]);

  const categories = useMemo(() => {
    const raw = (categoriesPages?.pages || []).flatMap((p) => p?.items ?? []);
    const map = new Map();
    for (const c of raw) {
      if (c?.id && !map.has(c.id)) {
        map.set(c.id, c);
      }
    }
    return Array.from(map.values());
  }, [categoriesPages]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    trigger,
    getValues,
  } = useForm<EditRecipeSchema>({
    resolver: zodResolver(editRecipeSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      _id: (defaultValues as any)?._id || (defaultValues as any)?.id || "",
      id: (defaultValues as any)?.id,
      name:
        (defaultValues as any)?.name ||
        (defaultValues as any)?.recipeName ||
        "",
      description: (defaultValues as any)?.description || "",
      categoryId:
        (defaultValues as any)?.categoryId ||
        (defaultValues as any)?.category ||
        "",
      cuisine: (defaultValues as any)?.cuisine || "",
      difficulty:
        (defaultValues as any)?.difficulty ||
        (defaultValues as any)?.recipeType ||
        "",
      servings: (defaultValues as any)?.servings || 0,
      prepTimeMinutes:
        (defaultValues as any)?.prepTimeMinutes ||
        (defaultValues as any)?.preparationTime ||
        0,
      cookTimeMinutes: (defaultValues as any)?.cookTimeMinutes || 0,
      status: (defaultValues as any)?.status || "active",
      ingredients: (defaultValues as any)?.ingredients || [],
      preparation: (defaultValues as any)?.preparation || {
        steps: [],
        tips: [],
      },
      nutrition: (defaultValues as any)?.nutrition || {},
      media: (defaultValues as any)?.media || { gallery: [], videoUrl: [] },
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: "ingredients",
  });

  // Watch ingredients for auto nutrition calculation
  const ingredients = useWatch({ control, name: "ingredients" });

  const {
    fields: preparationStepsFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: "preparation.steps",
  });

  const handleScalableChange = useCallback(
    (index: number, value: boolean) => {
      if (value) {
        // If setting this ingredient to scalable, unset all others
        ingredientFields.forEach((_, i) => {
          if (i !== index) {
            setValue(`ingredients.${i}.isScalable`, false);
          }
        });
      }
    },
    [ingredientFields, setValue],
  );

  const saveRecipe = useCallback(
    (data: EditRecipeSchema) => {
      const { _id, id, ...payload } = data;
      editRecipeMutation.mutate(
        { id: _id || id!, payload: payload as any },
        {
          onSuccess: () => {
            reset(data);
            onSuccess?.();
          },
        },
      );
    },
    [editRecipeMutation, onSuccess, reset],
  );

  const handleSaveAndNext = useCallback(
    async (nextStepIndex: number) => {
      const currentStepKey = steps[step];
      const fields =
        stepFieldsRecipe[currentStepKey as keyof typeof stepFieldsRecipe] || [];
      if (currentStepKey !== "review") {
        const valid = await trigger(fields as any);
        if (!valid) return;
      }

      setStep(nextStepIndex);
      setMaxStep((prev) => Math.max(prev, nextStepIndex));
    },
    [step, steps, trigger],
  );

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleFinalSubmit = handleSubmit((data) => saveRecipe(data));

  function ReviewSection({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: ReactNode;
  }) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80 tracking-tight">
          <Icon className="w-4 h-4 text-primary/70" />
          {title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pl-6 border-l ml-2">
          {children}
        </div>
      </div>
    );
  }

  function ReviewItem({
    label,
    value,
    fullWidth,
  }: {
    label: string;
    value: React.ReactNode;
    fullWidth?: boolean;
  }) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "number" && isNaN(value))
    )
      return null;

    return (
      <div className={cn("space-y-1", fullWidth && "md:col-span-2")}>
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          {label}
        </p>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    );
  }

  const renderReview = () => {
    const values = getValues();
    const hasErrors = errors && Object.keys(errors).length > 0;

    return (
      <Card className="overflow-hidden border-2">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <div
                className={cn(
                  "p-1.5 rounded-full",
                  hasErrors
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                )}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
              Review & Submit Recipe
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="p-6 space-y-8">
            {values && (
              <div className="space-y-8">
                <ReviewSection title="Basic Information" icon={Info}>
                  <ReviewItem label="Recipe Name" value={values.name} />
                  <ReviewItem
                    label="Category"
                    value={
                      categories.find((c: any) => c.id === values.categoryId)
                        ?.name || "-"
                    }
                  />
                  <ReviewItem
                    label="Difficulty"
                    value={
                      values.difficulty
                        ? String(values.difficulty).charAt(0).toUpperCase() +
                          String(values.difficulty).slice(1)
                        : "-"
                    }
                  />
                  <ReviewItem
                    label="Status"
                    value={
                      values.status
                        ? String(values.status).charAt(0).toUpperCase() +
                          String(values.status).slice(1)
                        : "-"
                    }
                  />
                  <ReviewItem label="Cuisine" value={values.cuisine} />
                  <ReviewItem
                    label="Description"
                    value={values.description}
                    fullWidth
                  />
                </ReviewSection>

                <ReviewSection title="Timing" icon={Flame}>
                  <ReviewItem
                    label="Prep Time"
                    value={
                      values.prepTimeMinutes
                        ? `${values.prepTimeMinutes} mins`
                        : "-"
                    }
                  />
                  <ReviewItem
                    label="Cook Time"
                    value={
                      values.cookTimeMinutes
                        ? `${values.cookTimeMinutes} mins`
                        : "-"
                    }
                  />
                  <ReviewItem label="Servings" value={values.servings || "-"} />
                </ReviewSection>

                {values.ingredients && values.ingredients.length > 0 && (
                  <ReviewSection title="Ingredients" icon={Apple}>
                    {values.ingredients.map((ing, idx) => (
                      <ReviewItem
                        key={idx}
                        label={
                          rawMaterials.find(
                            (r: any) =>
                              r._id === ing.materialId ||
                              r.id === ing.materialId,
                          )?.name || ing.materialId
                        }
                        value={`${ing.quantity} ${ing.unit || ""}${
                          ing.isScalable ? " (Scalable)" : ""
                        }`}
                      />
                    ))}
                  </ReviewSection>
                )}

                {values.preparation?.steps &&
                  values.preparation.steps.length > 0 && (
                    <ReviewSection title="Preparation Steps" icon={ChefHat}>
                      {values.preparation.steps.map((stepItem, idx) => (
                        <ReviewItem
                          key={idx}
                          label={`Step ${stepItem.step}`}
                          value={stepItem.instruction}
                          fullWidth
                        />
                      ))}
                    </ReviewSection>
                  )}

                {(values.nutrition?.calories ||
                  values.nutrition?.protein ||
                  values.nutrition?.carbohydrate ||
                  values.nutrition?.fat) && (
                  <ReviewSection title="Nutrition" icon={Apple}>
                    <ReviewItem
                      label="Calories"
                      value={
                        values.nutrition?.calories
                          ? `${values.nutrition.calories} kcal`
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Protein"
                      value={
                        values.nutrition?.protein
                          ? `${values.nutrition.protein}g`
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Carbohydrate"
                      value={
                        values.nutrition?.carbohydrate
                          ? `${values.nutrition.carbohydrate}g`
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Fat"
                      value={
                        values.nutrition?.fat ? `${values.nutrition.fat}g` : "-"
                      }
                    />
                  </ReviewSection>
                )}

                {(values.media?.coverImage ||
                  values.media?.gallery?.length ||
                  values.media?.videoUrl?.length) && (
                  <ReviewSection title="Media" icon={ChefHat}>
                    {values.media?.coverImage && (
                      <ReviewItem
                        label="Cover Image"
                        value={
                          <a
                            href={values.media.coverImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-primary hover:underline"
                          >
                            View Image
                          </a>
                        }
                      />
                    )}
                    {values.media?.gallery &&
                      values.media.gallery.length > 0 && (
                        <ReviewItem
                          label="Gallery Images"
                          value={`${values.media.gallery.length} images`}
                        />
                      )}
                    {values.media?.videoUrl &&
                      values.media.videoUrl.length > 0 && (
                        <ReviewItem
                          label="Recipe Videos"
                          value={`${values.media.videoUrl.length} videos`}
                        />
                      )}
                  </ReviewSection>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted/30 p-6 pt-0 space-y-4">
            <Separator />
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-json"
                checked={showJsonReview}
                onCheckedChange={(checked) =>
                  setShowJsonReview(checked as boolean)
                }
              />
              <Label
                htmlFor="show-json"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-1.5"
              >
                <Braces className="w-3.5 h-3.5" />
                Developer JSON View
              </Label>
            </div>

            {/* {hasErrors && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs font-mono text-destructive border border-destructive/20">
                <p className="font-bold mb-1 uppercase tracking-wider">
                  Validation Errors:
                </p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )} */}

            {showJsonReview && values && (
              <div className="relative group">
                <pre className="bg-background p-4 rounded-lg text-[11px] font-mono overflow-x-auto border shadow-inner max-h-[300px] custom-scrollbar">
                  {JSON.stringify(values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const error = editRecipeMutation.isError
    ? editRecipeMutation.error?.message
    : null;

  // Auto-calculate nutrition when ingredients or raw materials change
  useEffect(() => {
    const nutrition = computeNutritionFromIngredients(
      ingredients as any,
      rawMaterials as any,
    );
    setValue("nutrition", nutrition as any, {
      shouldDirty: true,
      shouldValidate: false,
    });
  }, [ingredients, rawMaterials, setValue]);

  return (
    <form onSubmit={handleFinalSubmit} noValidate className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <Tabs
        value={steps[step]}
        onValueChange={(val) => {
          const idx = steps.indexOf(val);
          if (idx !== -1 && idx <= maxStep) setStep(idx);
        }}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {stepCardSteps.map((s, idx) => (
            <TabsTrigger
              key={s.label}
              value={steps[idx]}
              disabled={idx > maxStep}
              className="min-w-[120px]"
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Recipe Name *</Label>
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
              <Label htmlFor="difficulty">Difficulty *</Label>
              <select
                id="difficulty"
                disabled={isLoading}
                {...register("difficulty")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select difficulty</option>
                {RECIPE_DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.difficulty && (
                <p className="text-xs text-destructive">
                  {errors.difficulty.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <select
                id="categoryId"
                disabled={isLoading}
                {...register("categoryId")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select category</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prepTimeMinutes">Prep Time (mins)</Label>
              <Input
                id="prepTimeMinutes"
                type="number"
                disabled={isLoading}
                {...register("prepTimeMinutes", { valueAsNumber: true })}
              />
              {errors.prepTimeMinutes && (
                <p className="text-xs text-destructive">
                  {errors.prepTimeMinutes.message}
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                disabled={isLoading}
                {...register("status")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select status</option>
                {RECIPE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                disabled={isLoading}
                {...register("servings", { valueAsNumber: true })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Ingredients */}
        <TabsContent value="ingredients" className="space-y-6">
          <div className="space-y-4">
            {ingredientFields?.length > 0 ? (
              ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg"
                >
                  <select
                    disabled={isLoading}
                    {...register(`ingredients.${index}.materialId`)}
                    onScroll={(e: React.UIEvent<HTMLSelectElement>) => {
                      const element = e.currentTarget;
                      // Check if user scrolled near the bottom
                      const isNearBottom =
                        element.scrollHeight - element.scrollTop <=
                        element.clientHeight + 50;
                      if (
                        isNearBottom &&
                        hasNextRawMaterials &&
                        !isFetchingNextPage
                      ) {
                        fetchNextRawMaterials();
                      }
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select Material</option>
                    {rawMaterials.map((material) => (
                      <option
                        key={material._id || material.id}
                        value={material._id || material.id}
                      >
                        {material.name || material.materialName}
                      </option>
                    ))}
                    {hasNextRawMaterials && isFetchingNextPage && (
                      <option disabled>Loading more materials...</option>
                    )}
                  </select>
                  {errors.ingredients?.[index]?.materialId && (
                    <p className="text-xs text-destructive col-span-1">
                      {errors.ingredients[index]?.materialId?.message}
                    </p>
                  )}

                  <Input
                    placeholder="Quantity"
                    type="number"
                    step="0.01"
                    disabled={isLoading}
                    {...register(`ingredients.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />

                  <Input
                    placeholder="Unit (g, ml, pcs)"
                    disabled={isLoading}
                    {...register(`ingredients.${index}.unit`)}
                  />

                  <label className="flex items-center gap-2 border border-input rounded-md p-2 bg-background">
                    <input
                      type="checkbox"
                      disabled={isLoading}
                      {...register(`ingredients.${index}.isScalable`)}
                      onChange={(e) =>
                        handleScalableChange(index, e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Scalable</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No ingredients added yet
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                appendIngredient({
                  isScalable: false,
                  materialId: "",
                  quantity: 0,
                  unit: "",
                })
              }
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Ingredient
            </button>
          </div>
        </TabsContent>

        {/* Preparation Steps */}
        <TabsContent value="preparation" className="space-y-6">
          <div className="space-y-4">
            {preparationStepsFields?.length > 0 ? (
              preparationStepsFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                >
                  <Input
                    placeholder="Step number"
                    type="number"
                    disabled={isLoading}
                    {...register(`preparation.steps.${index}.step`, {
                      valueAsNumber: true,
                    })}
                  />
                  <textarea
                    placeholder="Step description"
                    disabled={isLoading}
                    {...register(`preparation.steps.${index}.instruction`)}
                    className="col-span-2 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No preparation steps added yet
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                appendStep({
                  step: (preparationStepsFields?.length || 0) + 1,
                  instruction: "",
                })
              }
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>
        </TabsContent>

        {/* Nutrition */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/30 dark:border-primary/40 mb-4">
            <p className="text-sm text-muted-foreground">
              Nutritional values are auto-calculated from ingredients. You can
              manually adjust them below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                disabled={isLoading}
                {...register("nutrition.calories", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.protein", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carbs">Carbohydrates (g)</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.carbohydrate", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.fat", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Vitamins */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vitaminA">Vitamin A</Label>
              <Input
                id="vitaminA"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminA", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitaminB">Vitamin B</Label>
              <Input
                id="vitaminB"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminB", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitaminC">Vitamin C</Label>
              <Input
                id="vitaminC"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminC", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitaminD">Vitamin D</Label>
              <Input
                id="vitaminD"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminD", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitaminE">Vitamin E</Label>
              <Input
                id="vitaminE"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminE", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vitaminK">Vitamin K</Label>
              <Input
                id="vitaminK"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.vitamins.vitaminK", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          {/* Minerals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="calcium">Calcium</Label>
              <Input
                id="calcium"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.minerals.calcium", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iron">Iron</Label>
              <Input
                id="iron"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.minerals.iron", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="magnesium">Magnesium</Label>
              <Input
                id="magnesium"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.minerals.magnesium", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="potassium">Potassium</Label>
              <Input
                id="potassium"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.minerals.potassium", {
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zinc">Zinc</Label>
              <Input
                id="zinc"
                type="number"
                step="0.1"
                disabled={isLoading}
                {...register("nutrition.minerals.zinc", {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <SingleFileUpload
                folder="recipes/cover"
                accept="image/*"
                label="Cover Image"
                showPreview={true}
                defaultValue={(defaultValues as any)?.media?.coverImage}
                onUploadSuccess={(url) => {
                  setValue("media.coverImage", url);
                }}
              />
            </div>

            <div className="space-y-2">
              <MultipleFileUpload
                folder="recipes/gallery"
                accept="image/*"
                label="Gallery Images"
                maxFiles={10}
                showPreview={true}
                onUploadSuccess={(files) => {
                  const urls = files.map((f) => f.url);
                  setValue("media.gallery", urls);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          {renderReview()}
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 justify-end pt-2">
        {step > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isLoading}
          >
            Previous
          </Button>
        )}
        {step < steps.length - 1 && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSaveAndNext(step + 1)}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save & Next"}
          </Button>
        )}
        {step === steps.length - 1 && (
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? "Saving..." : "Submit Changes"}
          </Button>
        )}
      </div>
    </form>
  );
}
