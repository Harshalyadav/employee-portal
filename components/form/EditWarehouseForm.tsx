"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { useUpdateWarehouse, useWarehouse } from "@/hooks/query/warehouse.hook";
import { WarehouseFormData } from "@/types/warehouse.type";
import { ArrowLeft } from "lucide-react";

interface EditWarehouseFormProps {
  warehouseId: string;
}

export function EditWarehouseForm({ warehouseId }: EditWarehouseFormProps) {
  const router = useRouter();
  const { data: warehouse, isLoading } = useWarehouse(warehouseId);
  const { mutate: updateWarehouse, isPending } = useUpdateWarehouse();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    defaultValues: {
      name: "",
      code: "",
      location: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      manager: "",
      contact: "",
      email: "",
      phone: "",
      capacity: "",
      utilization: "",
      status: "Active",
    },
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        name: warehouse.name,
        code: warehouse.code,
        location: warehouse.location,
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        pincode: warehouse.pincode,
        manager: warehouse.manager,
        contact: warehouse.contact,
        email: warehouse.email,
        phone: warehouse.phone,
        capacity: warehouse.capacity,
        utilization: warehouse.utilization,
        status: warehouse.status,
      });
    }
  }, [warehouse, reset]);

  const onSubmit = (data: WarehouseFormData) => {
    updateWarehouse(
      { id: warehouseId, data },
      {
        onSuccess: () => router.push("/warehouse"),
      }
    );
  };

  if (isLoading) {
    return <LoadingState message="Loading warehouse data..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Warehouse</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Warehouse Name
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Enter warehouse name"
                      {...register("name", {
                        required: "Warehouse name is required",
                      })}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Code
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="WH-001"
                      {...register("code", { required: "Code is required" })}
                    />
                    {errors.code && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.code.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Address
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Street address"
                      {...register("address", {
                        required: "Address is required",
                      })}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      City
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="City"
                      {...register("city", { required: "City is required" })}
                    />
                    {errors.city && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      State
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="State"
                      {...register("state", { required: "State is required" })}
                    />
                    {errors.state && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Pincode
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="400001"
                      {...register("pincode", {
                        required: "Pincode is required",
                      })}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.pincode.message}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      Location Summary
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="e.g., Pune, Maharashtra"
                      {...register("location", {
                        required: "Location is required",
                      })}
                    />
                    {errors.location && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Manager Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Manager Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Manager Name
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Full name"
                      {...register("manager", {
                        required: "Manager name is required",
                      })}
                    />
                    {errors.manager && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.manager.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="+91 98765 43210"
                      {...register("phone", { required: "Phone is required" })}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="manager@example.com"
                      {...register("email", { required: "Email is required" })}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Contact Person
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Contact name"
                      {...register("contact", {
                        required: "Contact is required",
                      })}
                    />
                    {errors.contact && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.contact.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Capacity & Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Capacity & Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Capacity
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="5,000 units"
                      {...register("capacity", {
                        required: "Capacity is required",
                      })}
                    />
                    {errors.capacity && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.capacity.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Total storage capacity
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Utilization %
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="65"
                      {...register("utilization", {
                        required: "Utilization is required",
                      })}
                    />
                    {errors.utilization && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.utilization.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Current utilization percentage
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("status")}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Updating..." : "Update Warehouse"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
