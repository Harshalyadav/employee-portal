"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStockSchema, type CreateStockSchema } from "@/types/stock.type";
import { useCreateStock } from "@/hooks/query/stock.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CreateStockFormProps {
  onSuccess?: () => void;
}

export function CreateStockForm({ onSuccess }: CreateStockFormProps) {
  const createStockMutation = useCreateStock();
  const isLoading = createStockMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateStockSchema>({
    resolver: zodResolver(createStockSchema),
    mode: "onBlur",
  });

  const currentStock = watch("currentStock");
  const unitPrice = watch("unitPrice");

  const onSubmit = async (data: CreateStockSchema) => {
    createStockMutation.mutate(data as any, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
    });
  };

  const error = createStockMutation.isError
    ? createStockMutation.error?.message
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
          <TabsTrigger value="location">Location Details</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                type="text"
                placeholder="Coffee Beans"
                disabled={isLoading}
                {...register("itemName")}
              />
              {errors.itemName && (
                <p className="text-xs text-destructive">
                  {errors.itemName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                disabled={isLoading}
                {...register("category")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select category</option>
                <option value="Ingredient">Ingredient</option>
                <option value="Beverage Base">Beverage Base</option>
                <option value="Mix">Mix</option>
                <option value="Spices">Spices</option>
                <option value="Packaging">Packaging</option>
                <option value="Dairy">Dairy</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Meat">Meat</option>
                <option value="Frozen">Frozen</option>
                <option value="Dry Goods">Dry Goods</option>
              </select>
              {errors.category && (
                <p className="text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                placeholder="100"
                disabled={isLoading}
                {...register("currentStock", { valueAsNumber: true })}
              />
              {errors.currentStock && (
                <p className="text-xs text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                type="text"
                placeholder="kg, L, pieces"
                disabled={isLoading}
                {...register("unit")}
              />
              {errors.unit && (
                <p className="text-xs text-destructive">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                placeholder="450"
                disabled={isLoading}
                {...register("unitPrice", { valueAsNumber: true })}
              />
              {errors.unitPrice && (
                <p className="text-xs text-destructive">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalValue">Total Value</Label>
              <Input
                id="totalValue"
                type="text"
                value={`₹${(
                  (currentStock || 0) * (unitPrice || 0)
                ).toLocaleString()}`}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderThreshold">Reorder Threshold *</Label>
              <Input
                id="reorderThreshold"
                type="number"
                step="0.01"
                placeholder="20"
                disabled={isLoading}
                {...register("reorderThreshold", { valueAsNumber: true })}
              />
              {errors.reorderThreshold && (
                <p className="text-xs text-destructive">
                  {errors.reorderThreshold.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                disabled={isLoading}
                {...register("status")}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="expired">Expired</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                type="text"
                placeholder="Supplier name"
                disabled={isLoading}
                {...register("supplier")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                disabled={isLoading}
                {...register("expiryDate")}
              />
            </div>
          </div>
        </TabsContent>

        {/* Location Details */}
        <TabsContent value="location" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                placeholder="Warehouse, Franchise, etc."
                disabled={isLoading}
                {...register("location")}
              />
              {errors.location && (
                <p className="text-xs text-destructive">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storedAt">Stored At</Label>
              <Input
                id="storedAt"
                type="text"
                placeholder="Central Warehouse"
                disabled={isLoading}
                {...register("locationDetails.storedAt")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                type="text"
                placeholder="Warehouse name"
                disabled={isLoading}
                {...register("locationDetails.warehouse")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="franchise">Franchise</Label>
              <Input
                id="franchise"
                type="text"
                placeholder="Franchise name"
                disabled={isLoading}
                {...register("locationDetails.franchise")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managedBy">Managed By</Label>
              <Input
                id="managedBy"
                type="text"
                placeholder="Manager name"
                disabled={isLoading}
                {...register("locationDetails.managedBy")}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating..." : "Create Stock Item"}
        </Button>
      </div>
    </form>
  );
}
