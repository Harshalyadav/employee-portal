"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { editMenuSchema, type EditMenuSchema } from "@/types/menu.type";
import {
  RAW_MATERIAL_PORTION_UNITS,
  RAW_MATERIAL_BASE_UNITS,
} from "@/types/raw-material.type";
import { useEditMenu } from "@/hooks/query/menu.hook";
import { useInfiniteRecipeCategories } from "@/hooks/query/recipe-category.hook";
import { useInfiniteModels } from "@/hooks/query/model.hook";
import { useInfiniteFranchises } from "@/hooks/query/franchise.hook";
import { useInfiniteRawMaterials } from "@/hooks/query/raw-material.hook";
import { useInfiniteRecipes } from "@/hooks/query/recipe.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { SingleFileUpload } from "@/components/upload/SingleFileUpload";
import { useAppStore } from "@/stores/main.store";
import {
  saveEditMenuForm,
  clearEditMenuForm,
} from "@/stores/actions/menuForm.action";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface EditMenuFormProps {
  defaultValues: Partial<EditMenuSchema>;
  onSuccess?: () => void;
}

const UNIT_OPTIONS = Array.from(
  new Set([...RAW_MATERIAL_PORTION_UNITS, ...RAW_MATERIAL_BASE_UNITS])
);

// Step field mappings for validation
const stepFields = {
  basic: ["_id", "name", "type", "category", "menuFor", "status"],
  recipes: ["recipes"],
  modifiers: ["modifiers"],
  pricing: [
    "basePricing.baseCost",
    "basePricing.sellPrice",
    "basePricing.finalPrice",
  ],
  media: ["mediaInfo"],
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
          <Label htmlFor={`modifiers.${modifierIndex}.name`}>
            Group Name *
          </Label>
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
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select raw material</option>
                {availableRawMaterials.map((rm: any) => (
                  <option key={rm._id || rm.id} value={rm._id || rm.id}>
                    {rm.name}
                  </option>
                ))}
              </select>
              {errors?.modifiers?.[modifierIndex]?.rawMaterialId && (
                <p className="text-xs text-destructive">
                  {errors.modifiers[modifierIndex].rawMaterialId.message}
                </p>
              )}
            </>
          ) : (
            <>
              <select
                id={`modifiers.${modifierIndex}.recipeId`}
                disabled={isLoading}
                {...register(`modifiers.${modifierIndex}.recipeId`)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select recipe</option>
                {availableRecipes.map((rec: any) => (
                  <option key={rec._id || rec.id} value={rec._id || rec.id}>
                    {rec.name}
                  </option>
                ))}
              </select>
              {errors?.modifiers?.[modifierIndex]?.recipeId && (
                <p className="text-xs text-destructive">
                  {errors.modifiers[modifierIndex].recipeId.message}
                </p>
              )}
            </>
          )}
        </div>
        <div className="space-y-2">
          <Label className="opacity-0">Hidden</Label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              disabled={isLoading}
              {...register(`modifiers.${modifierIndex}.required`)}
              className="rounded"
            />
            <span className="text-sm">Required</span>
          </label>
          {errors?.modifiers?.[modifierIndex]?.required && (
            <p className="text-xs text-destructive">
              {errors.modifiers[modifierIndex].required.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="opacity-0">Hidden</Label>
          <button
            type="button"
            onClick={() => removeModifier(modifierIndex)}
            className="flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modifier Options */}
      <div className="ml-4 space-y-3 border-l-2 pl-4">
        <Label className="text-sm font-semibold">
          Options ({optionFields.length})
        </Label>
        {optionFields.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No options added yet. Click "+ Add Option" to add one.
          </p>
        ) : (
          optionFields.map((optionField, optionIndex) => (
            <div
              key={optionField.id}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-muted rounded"
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
                      errors.modifiers[modifierIndex].options[optionIndex].label
                        .message
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
                      errors.modifiers[modifierIndex].options[optionIndex].unit
                        .message
                    }
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Cost"
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
                  className="text-red-600 hover:bg-red-50 rounded p-2"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
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
          className="text-sm text-primary hover:underline"
          disabled={isLoading}
        >
          + Add Option
        </button>
      </div>
    </div>
  );
}

export function EditMenuForm({ defaultValues, onSuccess }: EditMenuFormProps) {
  const editMenuMutation = useEditMenu();
  const isLoading = editMenuMutation.isPending;
  const { data: categoriesData } = useInfiniteRecipeCategories({ limit: 100 });
  const { data: modelsData } = useInfiniteModels({ limit: 100 });
  const { data: franchisesData } = useInfiniteFranchises({ limit: 100 });
  const { data: rawMaterialsData } = useInfiniteRawMaterials({ limit: 100 });
  const { data: recipesData } = useInfiniteRecipes({ limit: 100 });

  const availableCategories = categoriesData?.pages[0]?.items || [];
  const availableModels = modelsData?.pages[0]?.items || [];
  const availableFranchises = franchisesData?.pages[0]?.data || [];
  const availableRawMaterials = rawMaterialsData?.pages[0]?.items || [];
  const availableRecipes = recipesData?.pages[0]?.items || [];

  // Zustand global state
  const editMenuFormGlobal = useAppStore((s) => s.editMenu ?? {});

  // Tab navigation state
  const tabs = ["basic", "recipes", "modifiers", "pricing", "media"];
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
  } = useForm<EditMenuSchema>({
    resolver: zodResolver(editMenuSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      _id: editMenuFormGlobal._id ?? defaultValues?._id ?? "",
      name: editMenuFormGlobal.name ?? defaultValues?.name ?? "",
      type: editMenuFormGlobal.type ?? defaultValues?.type ?? "ready_to_serve",
      category: editMenuFormGlobal.category ?? defaultValues?.category ?? "",
      description:
        editMenuFormGlobal.description ?? defaultValues?.description ?? "",
      status: editMenuFormGlobal.status ?? defaultValues?.status ?? "active",
      menuFor: editMenuFormGlobal.menuFor ?? defaultValues?.menuFor ?? "model",
      recipes: editMenuFormGlobal.recipes ?? defaultValues?.recipes ?? [],
      modifiers: editMenuFormGlobal.modifiers ?? defaultValues?.modifiers ?? [],
      basePricing: editMenuFormGlobal.basePricing ??
        defaultValues?.basePricing ?? {
          baseCost: 0,
          sellPrice: 0,
          finalPrice: 0,
        },
      customPricing:
        editMenuFormGlobal.customPricing ?? defaultValues?.customPricing ?? [],
      mediaInfo: editMenuFormGlobal.mediaInfo ?? defaultValues?.mediaInfo ?? {},
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
    fields: customPricingFields,
    append: appendCustomPricing,
    remove: removeCustomPricing,
  } = useFieldArray({
    control,
    name: "customPricing",
  });

  const menuType = watch("type");
  const menuFor = watch("menuFor");

  // Restore form state from store on mount
  useEffect(() => {
    if (Object.keys(editMenuFormGlobal).length > 0) {
      reset(editMenuFormGlobal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form state to store on every change
  useEffect(() => {
    saveEditMenuForm(getValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuType, menuFor]);

  useEffect(() => {
    const subscription = watch((values) => {
      saveEditMenuForm(values);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Clear store on unmount
  useEffect(() => {
    return () => clearEditMenuForm();
  }, []);

  const onSubmit = async (data: EditMenuSchema) => {
    const { _id, ...payload } = data;
    editMenuMutation.mutate(
      { id: _id, payload: payload as any },
      {
        onSuccess: () => {
          reset(data);
          clearEditMenuForm();
          onSuccess?.();
        },
      }
    );
  };

  const error = editMenuMutation.isError
    ? editMenuMutation.error?.message
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
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
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

        <TabsContent value="basic" className="space-y-6">
          {/* Menu ID */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="_id">Menu ID</Label>
              <Input
                id="_id"
                type="text"
                placeholder="Enter menu ID"
                disabled={true}
                {...register("_id")}
              />
            </div>
          </div>

          {/* Menu Name */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Menu Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter menu name"
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          {/* Menu Type */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Menu Type *</Label>
              <select
                id="type"
                disabled={isLoading}
                {...register("type")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a menu type</option>
                <option value="ready_to_serve">Ready to Serve</option>
                <option value="made_to_order">Made to Order</option>
              </select>
              {errors.type && (
                <p className="text-xs text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>
          </div>

          {/* Menu For */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menuFor">Menu For *</Label>
              <select
                id="menuFor"
                disabled={isLoading}
                {...register("menuFor")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                disabled={isLoading}
                {...register("category")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Enter a brief description of the menu"
                disabled={isLoading}
                {...register("description")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <select
                id="status"
                disabled={isLoading}
                {...register("status")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-xs text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipes">Recipes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  appendRecipe({
                    recipeId: "",
                    quantity: 1,
                    unit: "",
                  })
                }
                disabled={isLoading}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Recipe
              </Button>
            </div>

            {recipeFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recipes added. Click "Add Recipe" to include one.
              </p>
            )}

            {recipeFields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-md bg-muted my-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Recipe {index + 1}</h3>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeRecipe(index)}
                    disabled={isLoading}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`recipes.${index}.recipeId`}>
                      Recipe ID *
                    </Label>
                    <Input
                      id={`recipes.${index}.recipeId`}
                      type="text"
                      placeholder="Enter recipe ID"
                      disabled={isLoading}
                      {...register(`recipes.${index}.recipeId`)}
                    />
                    {errors.recipes?.[index]?.recipeId && (
                      <p className="text-xs text-destructive">
                        {errors.recipes[index].recipeId?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`recipes.${index}.quantity`}>
                        Quantity *
                      </Label>
                      <Input
                        id={`recipes.${index}.quantity`}
                        type="number"
                        step="0.01"
                        placeholder="Enter quantity"
                        disabled={isLoading}
                        {...register(`recipes.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.recipes?.[index]?.quantity && (
                        <p className="text-xs text-destructive">
                          {errors.recipes[index].quantity?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`recipes.${index}.unit`}>Unit *</Label>
                      <Select
                        value={watch(`recipes.${index}.unit`) || ""}
                        onValueChange={(value) =>
                          setValue(`recipes.${index}.unit`, value)
                        }
                        disabled={isLoading}
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
                          {errors.recipes[index].unit?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`recipes.${index}.cost`}>
                      Cost (optional)
                    </Label>
                    <Input
                      id={`recipes.${index}.cost`}
                      type="number"
                      step="0.01"
                      placeholder="Enter cost"
                      disabled={isLoading}
                      {...register(`recipes.${index}.cost`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modifiers" className="space-y-6">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="modifiers">Modifiers</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  appendModifier({
                    name: "",
                    type: "rawMaterial",
                    required: false,
                    options: [],
                  })
                }
                disabled={isLoading}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Modifier
              </Button>
            </div>

            {modifierFields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No modifiers added. Click "Add Modifier" to include one.
              </p>
            )}

            <div
              className={cn("space-y-8 mt-6", {
                "divide-y divide-gray-200 divide-dashed":
                  modifierFields?.length > 0,
              })}
            >
              {modifierFields.map((field, index) => (
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
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Base Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="basePricing.baseCost">Base Cost *</Label>
                <Input
                  id="basePricing.baseCost"
                  type="number"
                  step="0.01"
                  placeholder="Enter base cost"
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
                <Label htmlFor="basePricing.sellPrice">Selling Price *</Label>
                <Input
                  id="basePricing.sellPrice"
                  type="number"
                  step="0.01"
                  placeholder="Enter selling price"
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
                <Label htmlFor="basePricing.finalPrice">Final Price *</Label>
                <Input
                  id="basePricing.finalPrice"
                  type="number"
                  step="0.01"
                  placeholder="Enter final price"
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
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
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
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
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
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
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
                  defaultValue={(defaultValues as any)?.mediaInfo?.thumbnail}
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
                      defaultValue={(
                        defaultValues?.mediaInfo?.images || []
                      ).join(", ")}
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
                      defaultValue={(
                        defaultValues?.mediaInfo?.videos || []
                      ).join(", ")}
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
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
