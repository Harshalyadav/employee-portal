"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultipleFileUpload } from "@/components/upload/MultipleFileUpload";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { VideoUpload } from "@/components/upload/VideoUpload";
import { useInfiniteRawMaterials } from "@/hooks/query/raw-material.hook";
import { useInfiniteRecipeCategories } from "@/hooks/query/recipe-category.hook";
import { useCreateRecipe } from "@/hooks/query/recipe.hook";
import {
  clearCreateRecipeForm,
  saveCreateRecipeForm,
} from "@/stores/actions/recipeForm.action";
import { useAppStore } from "@/stores/main.store";
import {
  createRecipeSchema,
  type CreateRecipeSchema,
  RECIPE_DIFFICULTIES,
  RECIPE_STATUSES,
  stepFieldsRecipe,
} from "@/types/recipe.type";
import {
  RAW_MATERIAL_PORTION_UNITS,
  RAW_MATERIAL_BASE_UNITS,
} from "@/types/raw-material.type";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChefHat,
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  Braces,
  Info,
  Flame as FlameLogo,
  Apple,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { cn, computeNutritionFromIngredients } from "@/lib/utils";
import { SingleImageUpload } from "../upload";

interface CreateRecipeFormProps {
  onSuccess?: () => void;
}

const UNIT_OPTIONS = Array.from(
  new Set([...RAW_MATERIAL_PORTION_UNITS, ...RAW_MATERIAL_BASE_UNITS]),
);

export function CreateRecipeForm({ onSuccess }: CreateRecipeFormProps) {
  const createRecipeMutation = useCreateRecipe();
  const isLoading = createRecipeMutation.isPending;

  // Zustand global state
  const createFormGlobal = useAppStore((s) => s.create ?? {});

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
  const [maxStep, setMaxStep] = useState(0); // Track the furthest step reached
  const [showJsonReview, setShowJsonReview] = useState(false); // For review JSON toggle

  // StepCard configuration (labels, descriptions, icons)
  const stepCardSteps = [
    {
      label: "Basic Information",
      description: "Recipe name, category & difficulty",
      icon: <ChefHat className="w-5 h-5" />,
    },
    {
      label: "Ingredients",
      description: "Add raw materials and quantities",
      icon: <Flame className="w-5 h-5" />,
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

  // Fetch raw materials & categories
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
      if (r?.id && !map.has(r.id)) {
        map.set(r.id, r);
      }
    }
    return Array.from(map.values());
  }, [rawMaterialsPages]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    trigger,
    getValues,
    watch,
  } = useForm<CreateRecipeSchema>({
    resolver: zodResolver(createRecipeSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      name: createFormGlobal.name ?? "",
      description: createFormGlobal.description ?? "",
      categoryId: createFormGlobal.categoryId ?? "",
      cuisine: createFormGlobal.cuisine ?? "",
      difficulty: createFormGlobal.difficulty ?? "easy",
      servings: createFormGlobal.servings ?? 2,
      prepTimeMinutes: createFormGlobal.prepTimeMinutes ?? 0,
      cookTimeMinutes: createFormGlobal.cookTimeMinutes ?? 0,
      status: createFormGlobal.status ?? "active",
      ingredients: createFormGlobal.ingredients ?? [],
      preparation: createFormGlobal.preparation ?? { steps: [], tips: [] },
      nutrition: createFormGlobal.nutrition ?? {},
      media: createFormGlobal.media ?? {
        coverImage: "https://picsum.photos/200/300",
        gallery: ["https://picsum.photos/200/300"],
        videoUrl: [
          "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        ],
      },
    },
  });

  // Restore form state from store on mount
  useEffect(() => {
    if (Object.keys(createFormGlobal).length > 0) {
      reset(createFormGlobal as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form state to store on every change
  useEffect(() => {
    saveCreateRecipeForm(getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("name"), watch("description"), watch("categoryId")]);

  useEffect(() => {
    const subscription = watch((values) => {
      saveCreateRecipeForm(values);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Clear store on unmount
  useEffect(() => {
    return () => clearCreateRecipeForm();
  }, []);

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: "ingredients",
  });

  // Watch all ingredients to enforce single scalable rule
  const ingredients = useWatch({
    control,
    name: "ingredients",
  });

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

  const {
    fields: preparationStepsFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({
    control,
    name: "preparation.steps",
  });

  const {
    fields: videoFields,
    append: appendVideo,
    remove: removeVideo,
  } = useFieldArray({
    control,
    name: "media.videoUrl" as any,
  });

  const {
    fields: tipFields,
    append: appendTip,
    remove: removeTip,
  } = useFieldArray({
    control,
    name: "preparation.tips" as any,
  });

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

  const onSubmit = async (data: CreateRecipeSchema) => {
    const { nutrition, ...rest } = data;
    createRecipeMutation.mutate(
      {
        nutrition: {},
        ...rest,
      } as any,
      {
        onSuccess: () => {
          reset();
          clearCreateRecipeForm();
          onSuccess?.();
        },
      },
    );
  };

  const error = createRecipeMutation.isError
    ? createRecipeMutation.error?.message
    : null;

  // Navigation handlers
  const handleNext = async () => {
    const currentStep = steps[step];
    if (currentStep !== "review") {
      const fields =
        stepFieldsRecipe[currentStep as keyof typeof stepFieldsRecipe];
      const valid = await trigger(fields as any);
      if (!valid) return;
    }
    setStep((s) => {
      const nextStep = Math.min(s + 1, steps.length - 1);
      setMaxStep((prev) => Math.max(prev, nextStep));
      return nextStep;
    });
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  // Review section components
  function ReviewSection({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
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

  // Review step rendering
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
                {/* Basic Information */}
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

                {/* Timing Information */}
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

                {/* Ingredients */}
                {values.ingredients && values.ingredients.length > 0 && (
                  <ReviewSection title="Ingredients" icon={Apple}>
                    {values.ingredients.map((ing, idx) => (
                      <ReviewItem
                        key={idx}
                        label={
                          rawMaterials.find((r: any) => r.id === ing.materialId)
                            ?.name || ing.materialId
                        }
                        value={`${ing.quantity} ${ing.unit}${
                          ing.isScalable ? " (Scalable)" : ""
                        }`}
                      />
                    ))}
                  </ReviewSection>
                )}

                {/* Preparation */}
                {values.preparation?.steps &&
                  values.preparation.steps.length > 0 && (
                    <ReviewSection title="Preparation Steps" icon={ChefHat}>
                      {values.preparation.steps.map((step, idx) => (
                        <ReviewItem
                          key={idx}
                          label={`Step ${step.step}`}
                          value={step.instruction}
                          fullWidth
                        />
                      ))}
                    </ReviewSection>
                  )}

                {/* Nutrition */}
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
                    <ReviewItem
                      label="Fiber"
                      value={
                        values.nutrition?.fiber
                          ? `${values.nutrition.fiber}g`
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Sugar"
                      value={
                        values.nutrition?.sugar
                          ? `${values.nutrition.sugar}g`
                          : "-"
                      }
                    />
                    <ReviewItem
                      label="Sodium"
                      value={
                        values.nutrition?.sodium
                          ? `${values.nutrition.sodium}mg`
                          : "-"
                      }
                    />
                  </ReviewSection>
                )}

                {/* Media */}
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

            {hasErrors && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs font-mono text-destructive border border-destructive/20">
                <p className="font-bold mb-1 uppercase tracking-wider">
                  Validation Errors:
                </p>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(errors, null, 2)}
                </pre>
              </div>
            )}

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
  // Step content rendering
  const renderStep = () => {
    switch (steps[step]) {
      case "basic":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Recipe Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tomato Soup"
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
                {errors.status && (
                  <p className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prepTimeMinutes">Prep Time (mins)</Label>
                <Input
                  id="prepTimeMinutes"
                  type="number"
                  placeholder="10"
                  disabled={isLoading}
                  {...register("prepTimeMinutes", { valueAsNumber: true })}
                />
                {errors.prepTimeMinutes && (
                  <p className="text-xs text-destructive">
                    {errors.prepTimeMinutes.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cookTimeMinutes">Cook Time (mins)</Label>
                <Input
                  id="cookTimeMinutes"
                  type="number"
                  placeholder="20"
                  disabled={isLoading}
                  {...register("cookTimeMinutes", { valueAsNumber: true })}
                />
                {errors.cookTimeMinutes && (
                  <p className="text-xs text-destructive">
                    {errors.cookTimeMinutes.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="servings">Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  placeholder="2"
                  disabled={isLoading}
                  {...register("servings", { valueAsNumber: true })}
                />
                {errors.servings && (
                  <p className="text-xs text-destructive">
                    {errors.servings.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  type="text"
                  placeholder="Indian"
                  disabled={isLoading}
                  {...register("cuisine")}
                />
                {errors.cuisine && (
                  <p className="text-xs text-destructive">
                    {errors.cuisine.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Healthy homemade tomato soup"
                disabled={isLoading}
                {...register("description")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        );

      case "ingredients":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Column Headers */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 font-semibold text-sm border-b">
                <div>Material</div>
                <div>Quantity</div>
                <div>Unit</div>
                <div>Scalable</div>
                <div></div>
              </div>

              {ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <select
                      disabled={isLoading}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      {...register(`ingredients.${index}.materialId`)}
                    >
                      <option value="">Select Material</option>
                      {JSON.stringify(rawMaterials)}
                      {rawMaterials.map((material) => (
                        <option
                          key={material._id || material.id}
                          value={material._id || material.id}
                        >
                          {material.name || material.materialName}
                        </option>
                      ))}
                    </select>
                    {errors.ingredients?.[index]?.materialId && (
                      <p className="text-xs text-destructive">
                        {errors.ingredients[index]?.materialId?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Input
                      placeholder="Quantity"
                      type="number"
                      step="0.01"
                      disabled={isLoading}
                      {...register(`ingredients.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.ingredients?.[index]?.quantity && (
                      <p className="text-xs text-destructive">
                        {errors.ingredients[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Select
                      disabled={isLoading}
                      value={watch(`ingredients.${index}.unit`) || ""}
                      onValueChange={(value) =>
                        setValue(`ingredients.${index}.unit`, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ingredients?.[index]?.unit && (
                      <p className="text-xs text-destructive">
                        {errors.ingredients[index]?.unit?.message}
                      </p>
                    )}
                  </div>

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
              ))}

              {ingredientFields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No ingredients added yet.
                </p>
              )}

              {errors.ingredients &&
                typeof errors.ingredients.message === "string" && (
                  <p className="text-xs text-destructive">
                    {errors.ingredients.message}
                  </p>
                )}

              <Button
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
                className="flex items-center gap-2 px-4 py-2 border-dashed disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </Button>
            </div>
          </div>
        );

      case "preparation":
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-sm font-semibold mb-4">
                Preparation Steps
              </div>
              {preparationStepsFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <Input
                      placeholder="Step number"
                      type="number"
                      disabled={isLoading}
                      {...register(`preparation.steps.${index}.step`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.preparation?.steps?.[index]?.step && (
                      <p className="text-xs text-destructive">
                        {errors.preparation.steps[index]?.step?.message}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-1">
                    <textarea
                      placeholder="Instruction"
                      disabled={isLoading}
                      {...register(`preparation.steps.${index}.instruction`)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {errors.preparation?.steps?.[index]?.instruction && (
                      <p className="text-xs text-destructive">
                        {errors.preparation.steps[index]?.instruction?.message}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {preparationStepsFields.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No preparation steps added yet.
                </p>
              )}

              {errors.preparation?.steps &&
                typeof errors.preparation.steps.message === "string" && (
                  <p className="text-xs text-destructive">
                    {errors.preparation.steps.message}
                  </p>
                )}

              <Button
                type="button"
                onClick={() =>
                  appendStep({
                    step: preparationStepsFields.length + 1,
                    instruction: "",
                  })
                }
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-dashed disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-2 md:col-span-2">
                <VideoUpload
                  folder="recipes/preparation"
                  label="Preparation Video"
                  onUploadSuccess={(url) => {
                    setValue("preparation.preparationVideoUrl", url);
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Tips</Label>
                {tipFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <Input
                      placeholder="Tip"
                      disabled={isLoading}
                      {...register(`preparation.tips.${index}`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTip(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendTip("")}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Tip
                </Button>
              </div>
            </div>
          </div>
        );

      case "nutrition":
        return (
          <div className="space-y-6">
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
                  {...register("nutrition.calories", { valueAsNumber: true })}
                />
                {errors.nutrition?.calories && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.calories.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  disabled={isLoading}
                  {...register("nutrition.protein", { valueAsNumber: true })}
                />
                {errors.nutrition?.protein && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.protein.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="carbohydrate">Carbohydrate (g)</Label>
                <Input
                  id="carbohydrate"
                  type="number"
                  step="0.1"
                  disabled={isLoading}
                  {...register("nutrition.carbohydrate", {
                    valueAsNumber: true,
                  })}
                />
                {errors.nutrition?.carbohydrate && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.carbohydrate.message}
                  </p>
                )}
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
                {errors.nutrition?.fat && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.fat.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiber">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  step="0.1"
                  disabled={isLoading}
                  {...register("nutrition.fiber", { valueAsNumber: true })}
                />
                {errors.nutrition?.fiber && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.fiber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sugar">Sugar (g)</Label>
                <Input
                  id="sugar"
                  type="number"
                  step="0.1"
                  disabled={isLoading}
                  {...register("nutrition.sugar", { valueAsNumber: true })}
                />
                {errors.nutrition?.sugar && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.sugar.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sodium">Sodium (mg)</Label>
                <Input
                  id="sodium"
                  type="number"
                  disabled={isLoading}
                  {...register("nutrition.sodium", { valueAsNumber: true })}
                />
                {errors.nutrition?.sodium && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.sodium.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminA && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminA.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminB && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminB.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminC && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminC.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminD && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminD.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminE && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminE.message}
                  </p>
                )}
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
                {errors.nutrition?.vitamins?.vitaminK && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.vitamins.vitaminK.message}
                  </p>
                )}
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
                {errors.nutrition?.minerals?.calcium && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.minerals.calcium.message}
                  </p>
                )}
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
                {errors.nutrition?.minerals?.iron && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.minerals.iron.message}
                  </p>
                )}
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
                {errors.nutrition?.minerals?.magnesium && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.minerals.magnesium.message}
                  </p>
                )}
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
                {errors.nutrition?.minerals?.potassium && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.minerals.potassium.message}
                  </p>
                )}
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
                {errors.nutrition?.minerals?.zinc && (
                  <p className="text-xs text-destructive">
                    {errors.nutrition.minerals.zinc.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case "media":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <SingleImageUpload
                  folder="recipes/cover"
                  accept="image/*"
                  label="Cover Image"
                  showPreview={true}
                  onUploadSuccess={(url) => {
                    setValue("media.coverImage", url);
                  }}
                />
                {errors.media?.coverImage && (
                  <p className="text-xs text-destructive">
                    {errors.media.coverImage.message}
                  </p>
                )}
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

                {errors.media?.gallery && (
                  <p className="text-xs text-destructive">
                    {errors.media.gallery.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t pt-6">
              <Label>Recipe Videos</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videoFields.map((field, index) => (
                  <div key={field.id} className="relative">
                    <VideoUpload
                      folder="recipes/videos"
                      label={`Recipe Video ${index + 1}`}
                      onUploadSuccess={(url) => {
                        setValue(`media.videoUrl.${index}`, url);
                      }}
                    />
                    {videoFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="absolute top-0 right-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {videoFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No videos added yet.
                  </p>
                )}

                {errors.media?.videoUrl &&
                  typeof errors.media.videoUrl.message === "string" && (
                    <p className="text-xs text-destructive">
                      {errors.media.videoUrl.message}
                    </p>
                  )}
              </div>
              <Button
                type="button"
                onClick={() => appendVideo("")}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-dashed disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Add Another Video
              </Button>
            </div>
          </div>
        );

      case "review":
        return renderReview();

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* Tabs for step navigation */}
      <Tabs
        value={steps[step]}
        className="mb-4"
        onValueChange={(val) => {
          const idx = steps.indexOf(val);
          // Allow navigation to any step up to maxStep
          if (idx !== -1 && idx <= maxStep) setStep(idx);
        }}
      >
        <TabsList className="w-full flex flex-wrap justify-center gap-2">
          {stepCardSteps.map((s, idx) => (
            <TabsTrigger
              key={s.label}
              value={steps[idx]}
              className="min-w-[120px]"
              disabled={idx > maxStep}
            >
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div key={steps[step]}>{renderStep()}</div>

      <div className="flex gap-3 justify-end pt-6">
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
            onClick={handleNext}
            disabled={isLoading}
            className="hover:cursor-pointer"
          >
            Next
          </Button>
        )}
        {step === steps.length - 1 && (
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? "Creating..." : "Submit Recipe"}
          </Button>
        )}
      </div>
    </form>
  );
}
