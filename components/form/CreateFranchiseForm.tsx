"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUpload } from "@/components/upload/PdfUpload";
import { ReviewFranchiseCard } from "@/components/cards/form/ReviewFranchiseCard";
import { useCreateFranchise } from "@/hooks/query/franchise.hook";
import { useInfiniteModels } from "@/hooks/query/model.hook";
import { getModelById } from "@/service/model.service";
import { useAppStore } from "@/stores/main.store";
import {
  saveCreateFranchiseForm,
  clearCreateFranchiseForm,
} from "@/stores/actions/franchiseForm.action";
import {
  createFranchiseSchema,
  franchiseStepFields,
  type CreateFranchiseSchema,
} from "@/types/franchise.type";
import type { Model } from "@/types/model.type";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { generateFranchiseCode } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface CreateFranchiseFormProps {
  onSuccess?: () => void;
}

const EQUIPMENT_OPTIONS = [
  "Oven",
  "Refrigerator",
  "Freezer",
  "Gas Stove",
  "Chimney",
  "Dishwasher",
];
const MODEL_MENU_ITEMS = [
  {
    id: "1",
    name: "Paneer Tikka",
    baseRecipe: "R001",
    modelPrice: 180,
    franchisePrice: 200,
    status: "Active",
    addOns: "Extra Cheese",
  },
  {
    id: "2",
    name: "Butter Chicken",
    baseRecipe: "R002",
    modelPrice: 250,
    franchisePrice: 280,
    status: "Active",
    addOns: "Naan, Rice",
  },
];

export function CreateFranchiseForm({ onSuccess }: CreateFranchiseFormProps) {
  const router = useRouter();
  const createFranchiseMutation = useCreateFranchise();
  const isLoading = createFranchiseMutation.isPending;

  // Zustand global state
  const createFormGlobal = useAppStore((s) => s.create ?? {});

  // Fetch models for dropdown
  const { data: modelsPages } = useInfiniteModels({ limit: 50 });
  const modelItems = useMemo(() => {
    const pages = modelsPages?.pages || [];
    const models = pages.flatMap((p: any) => p.items || []);
    return models.filter((m: any) => m.status === "active");
  }, [modelsPages]);

  // Multi-step state
  const steps = ["basic", "location", "staff", "menu", "legal", "review"];
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0); // Track the furthest step reached

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    createFormGlobal.selectedEquipment ?? []
  );
  const [menuSource, setMenuSource] = useState<"copy" | "custom">(
    createFormGlobal.menuSource ?? "copy"
  );
  const [allowHide, setAllowHide] = useState(
    createFormGlobal.allowHide ?? true
  );
  const [allowOverride, setAllowOverride] = useState(
    createFormGlobal.allowOverride ?? true
  );
  const [allowAddItems, setAllowAddItems] = useState(
    createFormGlobal.allowAddItems ?? true
  );
  const [customMenuItems, setCustomMenuItems] = useState<any[]>(
    createFormGlobal.customMenuItems ?? []
  );
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Create schema with dynamic resolver
  const validationSchema = createFranchiseSchema({
    minArea: selectedModel?.minimumArea ?? 0,
    seatingCapacity: selectedModel?.seatingCapacity ?? 0,
    staffRequired: selectedModel?.staffRequired ?? 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
    trigger,
    getValues,
  } = useForm<CreateFranchiseSchema>({
    resolver: zodResolver(validationSchema),
    mode: "onBlur",
    shouldUnregister: false,
    defaultValues: {
      name: createFormGlobal.name ?? "",
      franchiseCode: createFormGlobal.franchiseCode ?? "",
      status: createFormGlobal.status ?? "active",
      ...createFormGlobal,
    },
  });

  const franchiseModelId = watch("franchiseOverview.franchiseModel");

  // Restore form state from store on mount
  useEffect(() => {
    if (Object.keys(createFormGlobal).length > 0) {
      reset({ ...createFormGlobal });
      setSelectedEquipment(createFormGlobal.selectedEquipment ?? []);
      setMenuSource(createFormGlobal.menuSource ?? "copy");
      setAllowHide(createFormGlobal.allowHide ?? true);
      setAllowOverride(createFormGlobal.allowOverride ?? true);
      setAllowAddItems(createFormGlobal.allowAddItems ?? true);
      setCustomMenuItems(createFormGlobal.customMenuItems ?? []);
    } else {
      // Generate franchise code if not already set
      const generatedCode = generateFranchiseCode(Date.now());
      setValue("franchiseCode", generatedCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save form state to store on every change
  useEffect(() => {
    saveCreateFranchiseForm({
      ...getValues(),
      selectedEquipment,
      menuSource,
      allowHide,
      allowOverride,
      allowAddItems,
      customMenuItems,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedEquipment,
    menuSource,
    allowHide,
    allowOverride,
    allowAddItems,
    customMenuItems,
  ]);

  useEffect(() => {
    const subscription = watch((values) => {
      saveCreateFranchiseForm({
        ...values,
        selectedEquipment,
        menuSource,
        allowHide,
        allowOverride,
        allowAddItems,
        customMenuItems,
      });
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watch,
    selectedEquipment,
    menuSource,
    allowHide,
    allowOverride,
    allowAddItems,
    customMenuItems,
  ]);

  // Load selected model details to enforce minimum criteria
  useEffect(() => {
    let isMounted = true;
    const fetchModel = async () => {
      if (!franchiseModelId) {
        if (isMounted) setSelectedModel(null);
        return;
      }
      try {
        const modelData = await getModelById(franchiseModelId);
        if (isMounted) setSelectedModel(modelData);
      } catch (err) {
        console.error("Failed to fetch model details", err);
        if (isMounted) setSelectedModel(null);
      }
    };
    fetchModel();
    return () => {
      isMounted = false;
    };
  }, [franchiseModelId]);

  // Clear store on unmount
  useEffect(() => {
    return () => clearCreateFranchiseForm();
  }, []);

  const onSubmit = async (data: CreateFranchiseSchema) => {
    createFranchiseMutation.mutate(data as any, {
      onSuccess: () => {
        reset();
        clearCreateFranchiseForm();
        onSuccess?.();
      },
    });
  };

  const onSaveDraft = () => {
    console.log("Saving as draft...");
  };

  const error = createFranchiseMutation.isError
    ? createFranchiseMutation.error?.message
    : null;

  const formValues = watch();

  // Navigation handlers
  const handleNext = async () => {
    const currentStep = steps[step];
    if (currentStep !== "review") {
      const fields =
        franchiseStepFields[currentStep as keyof typeof franchiseStepFields];
      const valid = await trigger(fields as any);
      if (!valid) return;
    }
    setStep((s) => {
      const nextStep = Math.min(s + 1, steps.length - 1);
      setMaxStep((prev) => Math.max(prev, nextStep));
      return nextStep;
    });
  };

  const handleNavigateTabs = async (tabValue: string) => {
    const tabStep = steps.indexOf(tabValue);

    // If going backward to a previously visited tab, allow without validation
    if (tabStep < step) {
      setStep(tabStep);
      return;
    }

    // If going forward, validate current step fields before allowing navigation
    const currentStep = steps[step];
    const fields =
      franchiseStepFields[currentStep as keyof typeof franchiseStepFields];
    const valid = await trigger(fields as any);

    if (!valid) {
      // Validation failed, prevent navigation
      return;
    }

    // Validation passed, navigate to the target tab
    setStep(tabStep);
    setMaxStep((prev) => Math.max(prev, tabStep));
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="container mx-auto px-6 py-8 space-y-6"
      >
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <Tabs
          value={steps[step]}
          className="w-full space-y-6"
          onValueChange={handleNavigateTabs}
        >
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="basic" disabled={0 > maxStep}>
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="location" disabled={1 > maxStep}>
              Location & Infra
            </TabsTrigger>
            <TabsTrigger value="staff" disabled={2 > maxStep}>
              Staff Details
            </TabsTrigger>
            <TabsTrigger value="menu" disabled={3 > maxStep}>
              Menu Setup
            </TabsTrigger>
            <TabsTrigger value="legal" disabled={4 > maxStep}>
              Legal & Policy
            </TabsTrigger>
            <TabsTrigger value="review" disabled={5 > maxStep}>
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {/* Card 1: Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>1. Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Franchise Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter franchise name"
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
                    <Label htmlFor="franchiseModel">Model Type *</Label>
                    <select
                      id="franchiseModel"
                      disabled={isLoading}
                      {...register("franchiseOverview.franchiseModel")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select model</option>
                      {modelItems.map((model: any) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="franchiseCode">Franchise Code *</Label>
                    <Input
                      id="franchiseCode"
                      type="text"
                      placeholder="AUTO-GENERATED"
                      disabled
                      {...register("franchiseCode")}
                    />
                    {errors.franchiseCode && (
                      <p className="text-xs text-destructive">
                        {errors.franchiseCode.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      disabled={isLoading}
                      {...register("status")}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="under_setup">Under Setup</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            {/* Card 2: Location & Infrastructure */}
            <Card>
              <CardHeader>
                <CardTitle>2. Location & Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Address *</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Enter full address"
                      disabled={isLoading}
                      {...register("locationInfrastructure.location")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Enter city"
                      disabled={isLoading}
                      {...register("locationInfrastructure.city")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="Enter state"
                      disabled={isLoading}
                      {...register("locationInfrastructure.state")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Pincode *</Label>
                    <Input
                      id="zipCode"
                      type="text"
                      placeholder="Enter pincode"
                      disabled={isLoading}
                      {...register("locationInfrastructure.zipCode")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minimumArea">
                      Total Area (sq.ft) * Min.{" "}
                      {selectedModel?.minimumArea ?? ""} sq.ft
                    </Label>
                    <Input
                      id="minimumArea"
                      type="number"
                      placeholder="Enter total area"
                      disabled={isLoading}
                      {...register("locationInfrastructure.minimumArea", {
                        valueAsNumber: true,
                        validate: (value) => {
                          const required = selectedModel?.minimumArea ?? 0;
                          if (franchiseModelId && !selectedModel)
                            return "Loading model requirements...";
                          if (
                            required > 0 &&
                            (value === undefined ||
                              value === null ||
                              Number.isNaN(value))
                          )
                            return `Minimum area should be at least ${required} sq.ft`;
                          if (
                            value === undefined ||
                            value === null ||
                            Number.isNaN(value)
                          )
                            return true;
                          return (
                            value >= required ||
                            `Minimum area should be at least ${required} sq.ft`
                          );
                        },
                      })}
                    />
                    {errors.locationInfrastructure?.minimumArea && (
                      <p className="text-xs text-destructive">
                        {
                          errors.locationInfrastructure.minimumArea
                            .message as string
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Equipment Available</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {EQUIPMENT_OPTIONS.map((equip) => (
                        <label
                          key={equip}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value={equip}
                            checked={selectedEquipment.includes(equip)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEquipment([
                                  ...selectedEquipment,
                                  equip,
                                ]);
                              } else {
                                setSelectedEquipment(
                                  selectedEquipment.filter((eq) => eq !== equip)
                                );
                              }
                            }}
                            disabled={isLoading}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">{equip}</span>
                        </label>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            {/* Card 3: Staff Details */}
            <Card>
              <CardHeader>
                <CardTitle>3. Staff Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="kitchenManager">Franchise Manager *</Label>
                    <div className="flex gap-2">
                      <select
                        id="kitchenManager"
                        disabled={isLoading}
                        {...register("staffInformation.kitchenManager")}
                        className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Select manager</option>
                        <option value="manager1">John Doe</option>
                        <option value="manager2">Jane Smith</option>
                      </select>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalStaffCount">Total Staff *</Label>
                    <Input
                      id="totalStaffCount"
                      type="number"
                      placeholder="Enter total staff"
                      disabled={isLoading}
                      {...register("staffInformation.totalStaffCount", {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.staffInformation?.totalStaffCount && (
                      <p className="text-xs text-destructive">
                        {
                          errors.staffInformation.totalStaffCount
                            ?.message as string
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noOfChefs">No. of Chefs *</Label>
                    <Input
                      id="noOfChefs"
                      type="number"
                      placeholder="Enter number of chefs"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="noOfHelpers">No. of Helpers *</Label>
                    <Input
                      id="noOfHelpers"
                      type="number"
                      placeholder="Enter number of helpers"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seatingCapacity">Seating Capacity</Label>
                    <Input
                      id="seatingCapacity"
                      type="number"
                      placeholder="Enter seating capacity"
                      disabled={isLoading}
                      {...register("staffInformation.seatingCapacity", {
                        valueAsNumber: true,
                      })}
                    />
                    {errors.staffInformation?.seatingCapacity && (
                      <p className="text-xs text-destructive">
                        {
                          errors.staffInformation.seatingCapacity
                            ?.message as string
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="setupDate">Setup Date *</Label>
                    <Input
                      id="setupDate"
                      type="date"
                      disabled={isLoading}
                      {...register("establishmentDate")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-6">
            {/* Card 4: Menu Setup */}
            <Card>
              <CardHeader>
                <CardTitle>4. Menu Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Menu Source */}
                <div className="space-y-2">
                  <Label>Menu Source *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="menuSource"
                        value="copy"
                        checked={menuSource === "copy"}
                        onChange={() => setMenuSource("copy")}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Copy from Model</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="menuSource"
                        value="custom"
                        checked={menuSource === "custom"}
                        onChange={() => setMenuSource("custom")}
                        disabled={isLoading}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Custom Menu</span>
                    </label>
                  </div>
                </div>

                {/* Model Menu Items Table */}
                {menuSource === "copy" && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left py-3 px-4 font-semibold">
                              Item Name
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                              Base Recipe
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">
                              Model Price
                            </th>
                            <th className="text-right py-3 px-4 font-semibold">
                              Franchise Price
                            </th>
                            <th className="text-center py-3 px-4 font-semibold">
                              Status
                            </th>
                            <th className="text-left py-3 px-4 font-semibold">
                              Add-Ons
                            </th>
                            <th className="text-center py-3 px-4 font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {MODEL_MENU_ITEMS.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="py-3 px-4 font-medium">
                                {item.name}
                              </td>
                              <td className="py-3 px-4">{item.baseRecipe}</td>
                              <td className="text-right py-3 px-4">
                                ₹{item.modelPrice}
                              </td>
                              <td className="text-right py-3 px-4">
                                ₹{item.franchisePrice}
                              </td>
                              <td className="text-center py-3 px-4">
                                <span className="px-2 py-1 text-xs rounded bg-secondary/20 text-secondary">
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">{item.addOns}</td>
                              <td className="text-center py-3 px-4">
                                <Button type="button" variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Menu Control Toggles */}
                    <div className="space-y-3 pt-4 border-t">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowHide}
                          onChange={() => setAllowHide(!allowHide)}
                          disabled={isLoading}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Allow Hide Items</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowOverride}
                          onChange={() => setAllowOverride(!allowOverride)}
                          disabled={isLoading}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Allow Override Prices</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowAddItems}
                          onChange={() => setAllowAddItems(!allowAddItems)}
                          disabled={isLoading}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Allow Add Custom Items</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Custom Menu Items */}
                {allowAddItems && menuSource === "copy" && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Custom Menu Items</Label>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Menu Item
                      </Button>
                    </div>
                    {customMenuItems.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No custom items added yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal" className="space-y-6">
            {/* Card 5: Legal & Policy */}
            <Card>
              <CardHeader>
                <CardTitle>5. Legal & Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="agreementValidity">
                      Agreement Validity (Years) *
                    </Label>
                    <Input
                      id="agreementValidity"
                      type="number"
                      placeholder="Enter years"
                      disabled={isLoading}
                      {...register("legalPolicyDocuments.agreementValidity", {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewalPolicy">Renewal Policy *</Label>
                    <Input
                      id="renewalPolicy"
                      type="text"
                      placeholder="Enter renewal policy"
                      disabled={isLoading}
                      {...register("legalPolicyDocuments.renewalPolicy")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exitPolicy">Exit Policy *</Label>
                    <Input
                      id="exitPolicy"
                      type="text"
                      placeholder="Enter exit policy"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licensesRequired">
                      Licenses Required *
                    </Label>
                    <Input
                      id="licensesRequired"
                      type="text"
                      placeholder="FSSAI, GST, etc."
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="franchiseAgreement">
                      Upload Legal Documents
                    </Label>
                    <PdfUpload
                      folder="franchises/legal-docs"
                      label="Franchise Agreement"
                      onUploadSuccess={(url) =>
                        setValue("legalPolicyDocuments.franchiseAgreement", url)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            {/* Card 6: Review Summary with ReviewFranchiseCard */}
            <ReviewFranchiseCard
              values={{
                name: formValues.name,
                franchiseCode: formValues.franchiseCode,
                franchiseOverview: formValues.franchiseOverview,
                locationInfrastructure: formValues.locationInfrastructure,
                selectedEquipment,
                staffInformation: formValues.staffInformation,
                establishmentDate: formValues.establishmentDate,
                menuSource,
                allowHide,
                allowOverride,
                allowAddItems,
                legalPolicyDocuments: formValues.legalPolicyDocuments,
                status: formValues.status,
              }}
              errors={errors}
            />
          </TabsContent>

          <div className="flex gap-3 justify-end pb-4">
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
              >
                Next
              </Button>
            )}
            {step === steps.length - 1 && (
              <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Franchise"}
              </Button>
            )}
          </div>
        </Tabs>
      </form>
    </div>
  );
}
