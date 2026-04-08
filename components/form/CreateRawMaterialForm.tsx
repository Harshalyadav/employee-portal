"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCreateRawMaterial } from "@/hooks";
import {
  createRawMaterialSchema,
  CreateRawMaterialSchema,
  RAW_MATERIAL_BASE_UNITS,
  RAW_MATERIAL_CATEGORIES,
  RAW_MATERIAL_PORTION_UNITS,
  RAW_MATERIAL_STATUSES,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { APP_ROUTE } from "@/routes";
import { toast } from "sonner";

interface CreateRawMaterialFormProps {
  onSuccess?: () => void;
}

export function CreateRawMaterialForm({
  onSuccess,
}: CreateRawMaterialFormProps) {
  const router = useRouter();
  const { mutate: createRawMaterial, isPending } = useCreateRawMaterial();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<CreateRawMaterialSchema>({
    resolver: zodResolver(createRawMaterialSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      status: RAW_MATERIAL_STATUSES[0],
      portionSize: 100,
      portionUnit: "g",
      baseUnit: RAW_MATERIAL_BASE_UNITS[0],
      conversionFactors: [],
      nutrition: {
        calories: undefined,
        protein: undefined,
        carbohydrate: undefined,
        fat: undefined,
        fiber: undefined,
        sugar: undefined,
        sodium: undefined,
        vitamins: {},
        minerals: {},
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conversionFactors",
  });

  const UNIT_OPTIONS = [
    "g",
    "kg",
    "mg",
    "ml",
    "l",
    "piece",
    "pieces",
    "teaspoon",
    "tablespoon",
    "cup",
  ];

  const onSubmit = (data: CreateRawMaterialSchema) => {
    createRawMaterial(data, {
      onSuccess: () => {
        toast.success("Raw material created successfully");
        reset();
        router.push(APP_ROUTE.RAW_MATERIALS.ALL.PATH);
      },
      onError: (error) => {
        toast.error(
          error?.response?.data?.message ||
            "An error occurred while creating the raw material"
        );
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {JSON.stringify(errors)}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Material Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Coffee Beans, Sugar, Milk"
                disabled={isPending}
                {...register("name")}
                className="h-10"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <select
                id="category"
                disabled={isPending}
                {...register("category")}
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Category</option>
                {RAW_MATERIAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.category.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="status"
                disabled={isPending}
                {...register("status")}
                className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {RAW_MATERIAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-xs text-destructive mt-1.5">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <textarea
              id="description"
              placeholder="Enter a brief description of the raw material..."
              rows={4}
              disabled={isPending}
              {...register("description")}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1.5">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Conversion Factors */}
          <div className="bg-secondary/10 dark:bg-secondary/20 p-4 rounded-lg border border-secondary/30 dark:border-secondary/40 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Conversion Factors</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => append({ fromUnit: "", toUnit: "", factor: 1 })}
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Factor
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No conversion factors added yet. Click "Add Factor" to create
                one.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">From Unit</Label>
                      <select
                        disabled={isPending}
                        {...register(`conversionFactors.${index}.fromUnit`)}
                        className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select unit</option>
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      {errors.conversionFactors?.[index]?.fromUnit && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.conversionFactors[index]?.fromUnit?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">To Unit</Label>
                      <select
                        disabled={isPending}
                        {...register(`conversionFactors.${index}.toUnit`)}
                        className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select unit</option>
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      {errors.conversionFactors?.[index]?.toUnit && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.conversionFactors[index]?.toUnit?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Factor</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1"
                        disabled={isPending}
                        {...register(`conversionFactors.${index}.factor`, {
                          valueAsNumber: true,
                        })}
                        className="h-10"
                      />
                      {errors.conversionFactors?.[index]?.factor && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.conversionFactors[index]?.factor?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => remove(index)}
                        className="w-full gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Nutritional Information */}
        <TabsContent value="nutrition" className="space-y-6">
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/30 dark:border-primary/40 mb-6">
            <h3 className="font-semibold text-sm mb-4">
              Nutritional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="portionSize" className="text-sm font-medium">
                  Portion Size
                </Label>
                <Input
                  id="portionSize"
                  type="number"
                  placeholder="100"
                  disabled={isPending}
                  {...register("portionSize", { valueAsNumber: true })}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portionUnit" className="text-sm font-medium">
                  Portion Unit
                </Label>
                <select
                  id="portionUnit"
                  disabled={isPending}
                  {...register("portionUnit")}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {RAW_MATERIAL_PORTION_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baseUnit" className="text-sm font-medium">
                  Base Unit
                </Label>
                <select
                  id="baseUnit"
                  disabled={isPending}
                  {...register("baseUnit")}
                  className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {RAW_MATERIAL_BASE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="calories" className="text-sm font-medium">
                Calories (per portion)
              </Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.calories", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="protein" className="text-sm font-medium">
                Protein (g)
              </Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.protein", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="carbohydrate" className="text-sm font-medium">
                Carbohydrates (g)
              </Label>
              <Input
                id="carbohydrate"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.carbohydrate", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fat" className="text-sm font-medium">
                Fat (g)
              </Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.fat", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fiber" className="text-sm font-medium">
                Fiber (g)
              </Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.fiber", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sugar" className="text-sm font-medium">
                Sugar (g)
              </Label>
              <Input
                id="sugar"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.sugar", { valueAsNumber: true })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sodium" className="text-sm font-medium">
                Sodium (mg)
              </Label>
              <Input
                id="sodium"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.sodium", { valueAsNumber: true })}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="vitaminA" className="text-sm font-medium">
                Vitamin A
              </Label>
              <Input
                id="vitaminA"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminA", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vitaminB" className="text-sm font-medium">
                Vitamin B
              </Label>
              <Input
                id="vitaminB"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminB", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vitaminC" className="text-sm font-medium">
                Vitamin C
              </Label>
              <Input
                id="vitaminC"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminC", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vitaminD" className="text-sm font-medium">
                Vitamin D
              </Label>
              <Input
                id="vitaminD"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminD", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vitaminE" className="text-sm font-medium">
                Vitamin E
              </Label>
              <Input
                id="vitaminE"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminE", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vitaminK" className="text-sm font-medium">
                Vitamin K
              </Label>
              <Input
                id="vitaminK"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.vitamins.vitaminK", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="calcium" className="text-sm font-medium">
                Calcium
              </Label>
              <Input
                id="calcium"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.minerals.calcium", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iron" className="text-sm font-medium">
                Iron
              </Label>
              <Input
                id="iron"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.minerals.iron", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="magnesium" className="text-sm font-medium">
                Magnesium
              </Label>
              <Input
                id="magnesium"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.minerals.magnesium", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="potassium" className="text-sm font-medium">
                Potassium
              </Label>
              <Input
                id="potassium"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.minerals.potassium", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="zinc" className="text-sm font-medium">
                Zinc
              </Label>
              <Input
                id="zinc"
                type="number"
                step="0.1"
                placeholder="0"
                disabled={isPending}
                {...register("nutrition.minerals.zinc", {
                  valueAsNumber: true,
                })}
                className="h-10"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/raw-materials")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
