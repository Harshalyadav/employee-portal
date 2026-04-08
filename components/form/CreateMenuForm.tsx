"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMenuSchema, type CreateMenuSchema } from "@/types/menu.type";
import {
  RAW_MATERIAL_PORTION_UNITS,
  RAW_MATERIAL_BASE_UNITS,
} from "@/types/raw-material.type";
import { useCreateMenu } from "@/hooks/query/menu.hook";
import { useInfiniteRecipes } from "@/hooks/query/recipe.hook";
import { useInfiniteRecipeCategories } from "@/hooks/query/recipe-category.hook";
import { useInfiniteModels } from "@/hooks/query/model.hook";
import { useInfiniteFranchises } from "@/hooks/query/franchise.hook";
import { useInfiniteRawMaterials } from "@/hooks/query/raw-material.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2, AlertCircle, FileWarning } from "lucide-react";
import { useAppStore } from "@/stores/main.store";
import {
  saveCreateMenuForm,
  clearCreateMenuForm,
} from "@/stores/actions/menuForm.action";
import { useState } from "react";
import { cn } from "@/lib";

interface CreateMenuFormProps {
  onSuccess?: () => void;
}

const UNIT_OPTIONS = Array.from(
  new Set([...RAW_MATERIAL_PORTION_UNITS, ...RAW_MATERIAL_BASE_UNITS])
);

// Step field mappings for validation
const stepFields = {
  basic: ["name", "type", "category", "menuFor", "status"],
  recipes: ["recipes"],
  modifiers: ["modifiers"],
  variants: ["variants"],
  pricing: [
    "basePricing.baseCost",
    "basePricing.sellPrice",
    "basePricing.finalPrice",
  ],
  media: ["mediaInfo"],
  review: [],
};

// Modifier Options Section Component
function ModifierOptionsSection({
  modifierIndex,
  modifierField,
  control,
  register,
  watch,
  setValue,
  removeModifier,
  isLoading,
  availableRecipes,
  availableRawMaterials,
  errors,
}: any) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control,
    name: `modifiers.${modifierIndex}.options`,
  });

  const modifierType = watch(`modifiers.${modifierIndex}.type`);
  const selectedRawMaterialId = watch(
    `modifiers.${modifierIndex}.rawMaterialId`
  );
  const selectedRecipeId = watch(`modifiers.${modifierIndex}.recipeId`);

  const getDefaultUnit = () => {
    if (modifierType === "rawMaterial") {
      const rm = availableRawMaterials.find(
        (r: any) => (r._id || r.id) === selectedRawMaterialId
      );
      return rm?.unit || rm?.measurementUnit || rm?.baseUnit || rm?.uom || "";
    }
    if (modifierType === "recipe") {
      const rec = availableRecipes.find(
        (r: any) => (r._id || r.id) === selectedRecipeId
      );
      return rec?.ingredients?.[0]?.unit || "piece";
    }
    return "";
  };

  useEffect(() => {
    const unit = getDefaultUnit();
    if (!unit) return;
    optionFields.forEach((_, optionIndex) => {
      const currentUnit = watch(
        `modifiers.${modifierIndex}.options.${optionIndex}.unit`
      );
      if (!currentUnit) {
        setValue(
          `modifiers.${modifierIndex}.options.${optionIndex}.unit`,
          unit
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modifierType,
    selectedRawMaterialId,
    selectedRecipeId,
    optionFields.length,
  ]);

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        <div className="space-y-2">
          <Label htmlFor={`modifiers.${modifierIndex}.name`}>Name *</Label>
          <Input
            id={`modifiers.${modifierIndex}.name`}
            placeholder="e.g., Size Options"
            disabled={isLoading}
            {...register(`modifiers.${modifierIndex}.name`)}
          />
          {errors?.modifiers?.[modifierIndex]?.name && (
            <p className="text-xs text-destructive">
              {errors.modifiers[modifierIndex].name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`modifiers.${modifierIndex}.type`}>Type *</Label>
          <select
            id={`modifiers.${modifierIndex}.type`}
            disabled={isLoading}
            {...register(`modifiers.${modifierIndex}.type`)}
            className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
          >
            <option value="">Select type</option>
            <option value="rawMaterial">Raw Material</option>
            <option value="recipe">Recipe</option>
          </select>
          {errors?.modifiers?.[modifierIndex]?.type && (
            <p className="text-xs text-destructive">
              {errors.modifiers[modifierIndex].type.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label
            htmlFor={`modifiers.${modifierIndex}.${
              modifierType === "rawMaterial" ? "rawMaterialId" : "recipeId"
            }`}
          >
            {modifierType === "rawMaterial" ? "Raw Material *" : "Recipe *"}
          </Label>
          {modifierType === "rawMaterial" ? (
            <>
              <select
                id={`modifiers.${modifierIndex}.rawMaterialId`}
                disabled={isLoading}
                {...register(`modifiers.${modifierIndex}.rawMaterialId`)}
                className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
              >
                <option value="">Select raw material</option>
                {availableRawMaterials.map((rm: any) => (
                  <option key={rm._id || rm.id} value={rm._id || rm.id}>
                    {rm.name}
                  </option>
                ))}
              </select>
              {(errors?.modifiers?.[modifierIndex]?.rawMaterialId ||
                (modifierType === "rawMaterial" &&
                  errors?.modifiers?.[modifierIndex] &&
                  "message" in (errors.modifiers[modifierIndex] as any))) && (
                <p className="text-xs text-destructive">
                  {errors.modifiers[modifierIndex].rawMaterialId?.message ||
                    (errors.modifiers[modifierIndex] as any)?.message ||
                    "Raw material is required"}
                </p>
              )}
            </>
          ) : (
            <>
              <select
                id={`modifiers.${modifierIndex}.recipeId`}
                disabled={isLoading}
                {...register(`modifiers.${modifierIndex}.recipeId`)}
                className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
              >
                <option value="">Select recipe</option>
                {availableRecipes.map((rec: any) => (
                  <option key={rec._id || rec.id} value={rec._id || rec.id}>
                    {rec.name}
                  </option>
                ))}
              </select>
              {(errors?.modifiers?.[modifierIndex]?.recipeId ||
                (modifierType === "recipe" &&
                  errors?.modifiers?.[modifierIndex] &&
                  "message" in (errors.modifiers[modifierIndex] as any))) && (
                <p className="text-xs text-destructive">
                  {errors.modifiers[modifierIndex].recipeId?.message ||
                    (errors.modifiers[modifierIndex] as any)?.message ||
                    "Recipe is required"}
                </p>
              )}
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label className="block mb-2">Required</Label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={isLoading}
              {...register(`modifiers.${modifierIndex}.required`)}
              className="rounded"
            />
            <span className="text-sm">Yes</span>
          </label>
        </div>
        <div className="space-y-2">
          <Label className="block mb-2 opacity-0">Remove</Label>
          <button
            type="button"
            onClick={() => removeModifier(modifierIndex)}
            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg max-h-10 max-w-10"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modifier Options */}
      <div className="ml-4 space-y-3 border-l-2 pl-4">
        <Label className="text-sm font-semibold">
          Options ({optionFields.length}) *
        </Label>
        {optionFields.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground italic">
              No options added yet. Click "+ Add Option" to add one.
            </p>
            {errors?.modifiers?.[modifierIndex]?.options && (
              <p className="text-xs text-destructive">
                {errors.modifiers[modifierIndex].options.message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {optionFields.map((optionField, optionIndex) => (
              <div
                key={optionField.id}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 p-3 bg-muted rounded items-start"
              >
                <div className="space-y-2">
                  <Input
                    placeholder="Label (e.g., Medium)"
                    disabled={isLoading}
                    {...register(
                      `modifiers.${modifierIndex}.options.${optionIndex}.label`
                    )}
                  />
                  {errors?.modifiers?.[modifierIndex]?.options?.[optionIndex]
                    ?.label && (
                    <p className="text-xs text-destructive">
                      {
                        errors.modifiers[modifierIndex].options[optionIndex]
                          .label.message
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Quantity"
                    type="number"
                    step="0.1"
                    disabled={isLoading}
                    {...register(
                      `modifiers.${modifierIndex}.options.${optionIndex}.quantity`,
                      { valueAsNumber: true }
                    )}
                  />
                  {errors?.modifiers?.[modifierIndex]?.options?.[optionIndex]
                    ?.quantity && (
                    <p className="text-xs text-destructive">
                      {
                        errors.modifiers[modifierIndex].options[optionIndex]
                          .quantity.message
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Select
                    disabled={isLoading}
                    value={
                      watch(
                        `modifiers.${modifierIndex}.options.${optionIndex}.unit`
                      ) || ""
                    }
                    onValueChange={(value) =>
                      setValue(
                        `modifiers.${modifierIndex}.options.${optionIndex}.unit`,
                        value
                      )
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
                  {errors?.modifiers?.[modifierIndex]?.options?.[optionIndex]
                    ?.unit && (
                    <p className="text-xs text-destructive">
                      {
                        errors.modifiers[modifierIndex].options[optionIndex]
                          .unit.message
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Cost (₹)"
                    type="number"
                    step="0.01"
                    disabled={isLoading}
                    {...register(
                      `modifiers.${modifierIndex}.options.${optionIndex}.unitPricing.unitCost`,
                      { valueAsNumber: true }
                    )}
                  />
                  {errors?.modifiers?.[modifierIndex]?.options?.[optionIndex]
                    ?.unitPricing?.unitCost && (
                    <p className="text-xs text-destructive">
                      {
                        errors.modifiers[modifierIndex].options[optionIndex]
                          .unitPricing.unitCost.message
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => removeOption(optionIndex)}
                    className="flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg p-2 max-w-10 h-10"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() =>
            appendOption({
              label: "",
              quantity: 1,
              unit: getDefaultUnit() || "",
              unitPricing: {
                unitCost: 0,
                unitSellPrice: 0,
                unitFinalPrice: 0,
              },
            })
          }
          className="text-sm text-primary hover:underline mt-6"
          disabled={isLoading}
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}

export function CreateMenuForm({ onSuccess }: CreateMenuFormProps) {
  const createMenuMutation = useCreateMenu();
  const isLoading = createMenuMutation.isPending;
  const { data: recipesData } = useInfiniteRecipes({ limit: 100 });
  const { data: categoriesData } = useInfiniteRecipeCategories({ limit: 100 });
  const { data: modelsData } = useInfiniteModels({ limit: 100 });
  const { data: franchisesData } = useInfiniteFranchises({ limit: 100 });
  const { data: rawMaterialsData } = useInfiniteRawMaterials({ limit: 100 });

  const availableRecipes = recipesData?.pages[0]?.items || [];
  const availableCategories = categoriesData?.pages[0]?.items || [];
  const availableModels = modelsData?.pages[0]?.items || [];
  const availableFranchises = franchisesData?.pages[0]?.data || [];
  const availableRawMaterials = rawMaterialsData?.pages[0]?.items || [];

  // Zustand global state
  const createMenuFormGlobal = useAppStore((s) => s.createMenu ?? {});

  // Tab navigation state
  const tabs = [
    "basic",
    "recipes",
    "modifiers",
    "variants",
    "pricing",
    "media",
    "review",
  ];
  const [currentTab, setCurrentTab] = useState(0);
  const [maxStep, setMaxStep] = useState(0); // Track furthest step reached

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<CreateMenuSchema>({
    resolver: zodResolver(createMenuSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      name: createMenuFormGlobal.name ?? "",
      type: createMenuFormGlobal.type ?? "ready_to_serve",
      category: createMenuFormGlobal.category ?? "",
      description: createMenuFormGlobal.description ?? "",
      status: createMenuFormGlobal.status ?? "active",
      isDeleted: createMenuFormGlobal.isDeleted ?? false,
      menuFor: createMenuFormGlobal.menuFor ?? "model",
      recipes: createMenuFormGlobal.recipes ?? [],
      modifiers: createMenuFormGlobal.modifiers ?? [],
      variants: createMenuFormGlobal.variants ?? [],
      basePricing: createMenuFormGlobal.basePricing ?? {
        baseCost: 0,
        sellPrice: 0,
        finalPrice: 0,
      },
      customPricing: createMenuFormGlobal.customPricing ?? [],
      mediaInfo: createMenuFormGlobal.mediaInfo ?? {},
    },
  });

  const {
    fields: recipeFields,
    append: appendRecipe,
    remove: removeRecipe,
  } = useFieldArray({
    control,
    name: "recipes",
  });

  const {
    fields: modifierFields,
    append: appendModifier,
    remove: removeModifier,
  } = useFieldArray({
    control,
    name: "modifiers",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: customPricingFields,
    append: appendCustomPricing,
    remove: removeCustomPricing,
  } = useFieldArray({
    control,
    name: "customPricing",
  });

  const sellPrice = watch("basePricing.sellPrice");
  const baseCost = watch("basePricing.baseCost");
  const menuType = watch("type");
  const menuFor = watch("menuFor");

  // Restore form state from store on mount
  useEffect(() => {
    if (Object.keys(createMenuFormGlobal).length > 0) {
      reset(createMenuFormGlobal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form state to store on every change
  useEffect(() => {
    saveCreateMenuForm(getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellPrice, baseCost, menuType, menuFor]);

  useEffect(() => {
    const subscription = watch((values) => {
      saveCreateMenuForm(values);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Clear store on unmount
  useEffect(() => {
    return () => clearCreateMenuForm();
  }, []);

  const onSubmit = async (data: CreateMenuSchema) => {
    createMenuMutation.mutate(data as any, {
      onSuccess: () => {
        reset();
        clearCreateMenuForm();
        onSuccess?.();
      },
    });
  };

  const error = createMenuMutation.isError
    ? createMenuMutation.error?.message
    : null;

  const handleNext = async () => {
    // Validate current step fields before allowing navigation
    const currentStepName = tabs[currentTab];
    const fieldsToValidate =
      stepFields[currentStepName as keyof typeof stepFields] || [];

    const isValid = await trigger(fieldsToValidate as any);
    if (!isValid) return;

    if (currentTab < tabs.length - 1) {
      const nextTab = currentTab + 1;
      setCurrentTab(nextTab);
      setMaxStep((prev) => Math.max(prev, nextTab));
    }
  };

  const handleNavigateTabs = async (tabIndex: number) => {
    // If going backward to a previously visited tab, allow without validation
    if (tabIndex < currentTab) {
      setCurrentTab(tabIndex);
      return;
    }

    // If going forward, validate current step fields before allowing navigation
    const currentStepName = tabs[currentTab];
    const fieldsToValidate =
      stepFields[currentStepName as keyof typeof stepFields] || [];

    const isValid = await trigger(fieldsToValidate as any);
    if (!isValid) return;

    // Validation passed, navigate to the target tab
    setCurrentTab(tabIndex);
    setMaxStep((prev) => Math.max(prev, tabIndex));
  };

  const handlePrev = () => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {error && (
        <div className="bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <Tabs
        value={tabs[currentTab]}
        className="w-full"
        onValueChange={(val) => {
          const idx = tabs.indexOf(val);
          // Allow navigation to any step up to maxStep
          if (idx !== -1 && idx <= maxStep) setCurrentTab(idx);
        }}
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {tabs.map((tab, idx) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={idx > maxStep}
              onClick={() => handleNavigateTabs(idx)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Menu Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Coffee Combo"
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
              <Label htmlFor="type">Menu Type *</Label>
              <select
                id="type"
                disabled={isLoading}
                {...register("type")}
                className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                <option value="">Select type</option>
                <option value="ready_to_serve">Ready to Serve</option>
                <option value="made_to_order">Made to Order</option>
              </select>
              {errors.type && (
                <p className="text-xs text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                disabled={isLoading}
                {...register("category")}
                className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                <option value="">Select category</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                disabled={isLoading}
                {...register("status")}
                className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menuFor">Menu For *</Label>
              <select
                id="menuFor"
                disabled={isLoading}
                {...register("menuFor")}
                className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
              >
                <option value="">Select option</option>
                <option value="model">Model</option>
                <option value="franchise">Franchise</option>
              </select>
              {errors.menuFor && (
                <p className="text-xs text-destructive">
                  {errors.menuFor.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                placeholder="Menu description"
                disabled={isLoading}
                {...register("description")}
                className="w-full px-3 py-2 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md min-h-24"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Recipes */}
        <TabsContent value="recipes" className="space-y-6 ">
          <div
            className={cn("space-y-8 mt-6  ", {
              "divide-y divide-gray-200 divide-dashed":
                recipeFields?.length > 0,
            })}
          >
            {recipeFields?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pb-2">
                <Label className="text-sm font-semibold">Recipe *</Label>
                <Label className="text-sm font-semibold">Quantity *</Label>
                <Label className="text-sm font-semibold">Unit *</Label>
                <Label className="text-sm font-semibold">Cost (₹)</Label>
                <Label className="text-sm font-semibold">Action</Label>
              </div>
            )}
            {recipeFields?.length > 0 ? (
              recipeFields.map((field, index) => {
                const selectedRecipeId = watch(`recipes.${index}.recipeId`);
                const recipe = availableRecipes.find(
                  (r) => r.id === selectedRecipeId
                );

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 pb-6  last:pb-0 last:border-0 "
                  >
                    <div className="space-y-2">
                      <Select
                        value={watch(`recipes.${index}.recipeId`) || ""}
                        onValueChange={(value) => {
                          const selected = availableRecipes.find(
                            (r) => r.id === value
                          );
                          setValue(`recipes.${index}.recipeId`, value);
                          if (selected) {
                            setValue(
                              `recipes.${index}.unit`,
                              selected.ingredients?.[0]?.unit || "piece"
                            );
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipe" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRecipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id || ""}>
                              {recipe.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.recipes?.[index]?.recipeId && (
                        <p className="text-xs text-destructive">
                          {errors.recipes[index].recipeId.message}
                        </p>
                      )}
                    </div>
                    <Input
                      placeholder="Quantity"
                      type="number"
                      step="1"
                      className="max-h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                      disabled={isLoading}
                      {...register(`recipes.${index}.quantity`, {
                        valueAsNumber: true,
                      })}
                    />{" "}
                    <div className="space-y-2">
                      <Select
                        disabled={isLoading}
                        value={watch(`recipes.${index}.unit`) || ""}
                        onValueChange={(value) =>
                          setValue(`recipes.${index}.unit`, value)
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
                      {errors.recipes?.[index]?.unit && (
                        <p className="text-xs text-destructive">
                          {errors.recipes[index].unit.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Cost (₹)"
                        type="number"
                        step="0.01"
                        className="max-h-10"
                        disabled={isLoading}
                        {...register(`recipes.${index}.cost`, {
                          valueAsNumber: true,
                        })}
                      />

                      {errors.recipes?.[index]?.cost && (
                        <p className="text-xs text-destructive">
                          {errors.recipes[index].cost.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRecipe(index)}
                      className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg max-h-10 max-w-10"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No recipes added yet
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                appendRecipe({
                  recipeId: "",
                  quantity: 1,
                  unit: "",
                })
              }
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed hover:cursor-pointer hover:border-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Recipe
            </button>
          </div>

          <p>
            Tip: You can add multiple recipes to a menu. The total cost will be
            calculated based on the sum of individual recipe costs.
          </p>
          {errors?.recipes && (
            <p className="text-sm text-destructive flex items-center">
              <AlertCircle className="mr-1 w-4 h-4" />
              {errors?.recipes?.message}
            </p>
          )}
        </TabsContent>

        {/* Modifiers */}
        <TabsContent value="modifiers" className="space-y-6">
          <div
            className={cn("space-y-8 mt-6", {
              "divide-y divide-gray-200 divide-dashed":
                modifierFields?.length > 0,
            })}
          >
            {modifierFields?.length > 0 ? (
              modifierFields.map((field, index) => (
                <div key={field.id} className="pb-6 last:pb-0 last:border-0">
                  <ModifierOptionsSection
                    modifierIndex={index}
                    modifierField={field}
                    control={control}
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    removeModifier={removeModifier}
                    isLoading={isLoading}
                    availableRecipes={availableRecipes}
                    availableRawMaterials={availableRawMaterials}
                    errors={errors}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No modifiers added yet
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                appendModifier({
                  name: "",
                  type: "rawMaterial",
                  required: false,
                  options: [],
                })
              }
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed hover:cursor-pointer hover:border-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Modifier Group
            </button>
          </div>
        </TabsContent>

        {/* Variants */}
        <TabsContent value="variants" className="space-y-6">
          <div
            className={cn("space-y-8 mt-6", {
              "divide-y divide-gray-200 divide-dashed":
                variantFields?.length > 0,
            })}
          >
            {variantFields?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-9 gap-4 pb-2">
                <Label className="text-sm font-semibold">Label *</Label>
                <Label className="text-sm font-semibold">Type *</Label>
                <Label className="text-sm font-semibold">Unit *</Label>
                <Label className="text-sm font-semibold">Base Cost *</Label>
                <Label className="text-sm font-semibold">Driver Value</Label>
                <Label className="text-sm font-semibold">
                  Scaling Driver ID
                </Label>
                <Label className="text-sm font-semibold">Default</Label>
                <Label className="text-sm font-semibold">Active</Label>
                <Label className="text-sm font-semibold">Action</Label>
              </div>
            )}
            {variantFields?.length > 0 ? (
              variantFields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-1 md:grid-cols-9 gap-4 pb-6 last:pb-0 last:border-0"
                >
                  <div className="space-y-2">
                    <Input
                      placeholder="e.g., Large"
                      disabled={isLoading}
                      {...register(`variants.${index}.label`)}
                    />
                    {errors?.variants?.[index]?.label && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].label.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="e.g., size"
                      disabled={isLoading}
                      {...register(`variants.${index}.type`)}
                    />
                    {errors?.variants?.[index]?.type && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].type.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="e.g., portion"
                      disabled={isLoading}
                      {...register(`variants.${index}.unit`)}
                    />
                    {errors?.variants?.[index]?.unit && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].unit.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Cost (₹)"
                      type="number"
                      step="0.01"
                      disabled={isLoading}
                      {...register(`variants.${index}.pricing.baseCost`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors?.variants?.[index]?.pricing?.baseCost && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].pricing.baseCost.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Driver value (e.g., 2)"
                      type="number"
                      step="0.01"
                      disabled={isLoading}
                      {...register(`variants.${index}.driverValue`, {
                        valueAsNumber: true,
                      })}
                    />
                    {errors?.variants?.[index]?.driverValue && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].driverValue.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Scaling driver ID"
                      disabled={isLoading}
                      {...register(`variants.${index}.recipeScalingDriverId`)}
                    />
                    {errors?.variants?.[index]?.recipeScalingDriverId && (
                      <p className="text-xs text-destructive">
                        {errors.variants[index].recipeScalingDriverId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 flex items-end pb-0.5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={isLoading}
                        {...register(`variants.${index}.isDefault`)}
                        className="rounded"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                  </div>

                  <div className="space-y-2 flex items-end pb-0.5">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={isLoading}
                        {...register(`variants.${index}.isActive`)}
                        className="rounded"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg max-h-10 max-w-10"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No variants added yet
              </p>
            )}

            {!variantFields.length && errors?.variants?.message && (
              <p className="text-xs text-destructive">
                {errors.variants.message}
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                appendVariant({
                  label: "",
                  type: "size",
                  unit: "portion",
                  driverValue: 1,
                  recipeScalingDriverId: "",
                  pricing: { baseCost: 0 },
                  isDefault: false,
                  isActive: true,
                })
              }
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-dashed hover:cursor-pointer hover:border-white disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Base Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="baseCost">Base Cost *</Label>
                <Input
                  id="baseCost"
                  type="number"
                  step="0.01"
                  disabled={isLoading}
                  {...register("basePricing.baseCost", {
                    valueAsNumber: true,
                  })}
                />
                {errors.basePricing?.baseCost && (
                  <p className="text-xs text-destructive">
                    {errors.basePricing.baseCost.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Selling Price *</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  disabled={isLoading}
                  {...register("basePricing.sellPrice", {
                    valueAsNumber: true,
                  })}
                />
                {errors.basePricing?.sellPrice && (
                  <p className="text-xs text-destructive">
                    {errors.basePricing.sellPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxPercentage">Tax (%)</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  step="0.01"
                  disabled={isLoading}
                  {...register("basePricing.taxInfo.taxPercentage", {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="finalPrice">Final Price *</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  step="0.01"
                  disabled={isLoading}
                  {...register("basePricing.finalPrice", {
                    valueAsNumber: true,
                  })}
                />
                {errors.basePricing?.finalPrice && (
                  <p className="text-xs text-destructive">
                    {errors.basePricing.finalPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                <Input
                  id="profitMargin"
                  type="number"
                  step="0.01"
                  disabled={isLoading}
                  {...register("basePricing.profitMargin", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
          </div>

          {/* Custom Pricing Overrides */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Custom Pricing Overrides
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  appendCustomPricing({
                    appliesTo: menuFor || "model",
                    modelId: undefined,
                    franchiseId: undefined,
                    pricing: {},
                  })
                }
                disabled={isLoading}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Custom Price
              </Button>
            </div>

            {customPricingFields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No custom pricing overrides added. Leave empty to use base
                pricing.
              </p>
            )}

            {customPricingFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-semibold">
                    Override {index + 1}
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCustomPricing(index)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`customPricing.${index}.appliesTo`}>
                      Applies To *
                    </Label>
                    <select
                      id={`customPricing.${index}.appliesTo`}
                      disabled={isLoading}
                      {...register(`customPricing.${index}.appliesTo`)}
                      className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                    >
                      <option value="model">Model</option>
                      <option value="franchise">Franchise</option>
                    </select>
                  </div>

                  {watch(`customPricing.${index}.appliesTo`) === "model" ? (
                    <div className="space-y-2">
                      <Label htmlFor={`customPricing.${index}.modelId`}>
                        Select Model *
                      </Label>
                      <select
                        id={`customPricing.${index}.modelId`}
                        disabled={isLoading}
                        {...register(`customPricing.${index}.modelId`)}
                        className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                      >
                        <option value="">Select a model</option>
                        {availableModels.map((model: any) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor={`customPricing.${index}.franchiseId`}>
                        Select Franchise *
                      </Label>
                      <select
                        id={`customPricing.${index}.franchiseId`}
                        disabled={isLoading}
                        {...register(`customPricing.${index}.franchiseId`)}
                        className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md"
                      >
                        <option value="">Select a franchise</option>
                        {availableFranchises.map((franchise: any) => (
                          <option key={franchise.id} value={franchise.id}>
                            {franchise.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor={`customPricing.${index}.pricing.sellPrice`}>
                      Override Selling Price
                    </Label>
                    <Input
                      id={`customPricing.${index}.pricing.sellPrice`}
                      type="number"
                      step="0.01"
                      placeholder="Leave empty to use base price"
                      disabled={isLoading}
                      {...register(`customPricing.${index}.pricing.sellPrice`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor={`customPricing.${index}.pricing.finalPrice`}
                    >
                      Override Final Price
                    </Label>
                    <Input
                      id={`customPricing.${index}.pricing.finalPrice`}
                      type="number"
                      step="0.01"
                      placeholder="Leave empty to use base price"
                      disabled={isLoading}
                      {...register(
                        `customPricing.${index}.pricing.finalPrice`,
                        { valueAsNumber: true }
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media Information</h3>
            <p className="text-sm text-muted-foreground">
              Menu Type:{" "}
              <span className="font-semibold capitalize">{menuType}</span>
            </p>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <SingleFileUpload
                  folder="menus"
                  accept="image/*"
                  label="Menu Thumbnail"
                  showPreview={true}
                  onUploadSuccess={(url) => {
                    setValue("mediaInfo.thumbnail", url);
                  }}
                />
              </div>

              {menuType === "ready_to_serve" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="images">
                      Additional Images (comma-separated)
                    </Label>
                    <Input
                      id="images"
                      type="text"
                      placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                      disabled={isLoading}
                      onChange={(e) => {
                        const urls = e.target.value
                          .split(",")
                          .map((u) => u.trim())
                          .filter(Boolean);
                        setValue("mediaInfo.images", urls);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videos">Video URLs (comma-separated)</Label>
                    <Input
                      id="videos"
                      type="text"
                      placeholder="https://youtube.com/v1, https://youtube.com/v2"
                      disabled={isLoading}
                      onChange={(e) => {
                        const urls = e.target.value
                          .split(",")
                          .map((u) => u.trim())
                          .filter(Boolean);
                        setValue("mediaInfo.videos", urls);
                      }}
                    />
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-sm text-primary">
                      ℹ️ <strong>Ready-to-Serve menus</strong> support
                      thumbnail, additional images, and videos for rich visual
                      presentation.
                    </p>
                  </div>
                </>
              )}

              {menuType === "made_to_order" && (
                <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/30">
                  <p className="text-sm text-secondary">
                    ℹ️ <strong>Made-to-Order menus</strong> typically use
                    thumbnail for preview. Detailed images are shown during
                    customization.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Review */}
        <TabsContent value="review" className="space-y-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review Your Menu</h3>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/30">
              <p className="text-sm text-primary">
                ℹ️ Please review all the information below before submitting.
              </p>
            </div>

            {/* Basic Info */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{watch("name")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{watch("type")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{watch("category")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{watch("status")}</p>
                </div>
              </div>
            </div>

            {/* Recipes */}
            {recipeFields.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">
                  Recipes ({recipeFields.length})
                </h4>
                <div className="space-y-2">
                  {recipeFields.map((_, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">
                        {watch(`recipes.${index}.recipeId`)}
                      </p>
                      <p className="text-muted-foreground">
                        Qty: {watch(`recipes.${index}.quantity`)}{" "}
                        {watch(`recipes.${index}.unit`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {modifierFields.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">
                  Modifiers ({modifierFields.length})
                </h4>
                <div className="space-y-2">
                  {modifierFields.map((_, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">
                        {watch(`modifiers.${index}.name`)}
                      </p>
                      <p className="text-muted-foreground">
                        Options:{" "}
                        {watch(`modifiers.${index}.options`)?.length || 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants */}
            {variantFields.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">
                  Variants ({variantFields.length})
                </h4>
                <div className="space-y-2">
                  {variantFields.map((_, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                      <p className="font-medium">
                        {watch(`variants.${index}.label`)}
                      </p>
                      <p className="text-muted-foreground">
                        Cost: ₹{watch(`variants.${index}.pricing.baseCost`)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold">Pricing</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Base Cost</p>
                  <p className="font-medium">
                    ₹{watch("basePricing.baseCost")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sell Price</p>
                  <p className="font-medium">
                    ₹{watch("basePricing.sellPrice")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Final Price</p>
                  <p className="font-medium">
                    ₹{watch("basePricing.finalPrice")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4">
        {currentTab > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handlePrev}
            disabled={isLoading}
          >
            Previous
          </Button>
        )}
        {currentTab < tabs.length - 1 && (
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
        {currentTab === tabs.length - 1 && (
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Menu"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
