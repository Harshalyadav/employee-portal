"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateOffer } from "@/hooks/query/offer.hook";
import { OfferFormData } from "@/types/offer.type";
import { ArrowLeft } from "lucide-react";

export function CreateOfferForm() {
  const router = useRouter();
  const { mutate: createOffer, isPending } = useCreateOffer();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OfferFormData>({
    defaultValues: {
      name: "",
      type: "Percentage",
      description: "",
      discountValue: 0,
      applicableScope: "Category",
      selectedCategories: [],
      minimumOrderValue: 0,
      maxDiscountLimit: 0,
      autoApply: true,
      couponCode: "",
      startDate: "",
      endDate: "",
      daysActive: [],
      displayOrder: 1,
      visibility: "Featured",
      status: "Active",
    },
  });

  const offerType = watch("type");
  const autoApply = watch("autoApply");

  const onSubmit = (data: OfferFormData) => {
    createOffer(data as any);
  };

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
            <CardTitle>Create New Offer</CardTitle>
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
                      Offer Name
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Enter offer name"
                      {...register("name", {
                        required: "Offer name is required",
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
                      Type
                    </label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("type")}
                    >
                      <option value="Percentage">Percentage</option>
                      <option value="Flat">Flat</option>
                      <option value="Combo">Combo</option>
                      <option value="Coupon">Coupon</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    placeholder="Offer description"
                    rows={3}
                    {...register("description", {
                      required: "Description is required",
                    })}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Offer Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Offer Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {offerType === "Flat" ? "Discount Amount" : "Discount %"}
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder={offerType === "Flat" ? "₹" : "%"}
                      {...register("discountValue", {
                        required: "Discount value is required",
                      })}
                    />
                    {errors.discountValue && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.discountValue.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Applicable Scope
                    </label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("applicableScope")}
                    >
                      <option value="Model">Model</option>
                      <option value="Franchise">Franchise</option>
                      <option value="Menu">Menu</option>
                      <option value="Category">Category</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Minimum Order Value
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="₹0"
                      {...register("minimumOrderValue")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Max Discount Limit
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="₹0"
                      {...register("maxDiscountLimit")}
                    />
                  </div>
                </div>
              </div>

              {/* Offer Duration */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Offer Duration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("startDate", {
                        required: "Start date is required",
                      })}
                    />
                    {errors.startDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("endDate", {
                        required: "End date is required",
                      })}
                    />
                    {errors.endDate && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">
                    Days Active
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <label key={day} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={day}
                            {...register("daysActive")}
                            className="rounded"
                          />
                          <span className="text-sm">{day}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Coupon & Auto Apply */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Coupon Settings</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("autoApply")}
                      className="rounded"
                    />
                    <span className="text-sm">Auto Apply</span>
                  </label>
                  {!autoApply && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Coupon Code
                      </label>
                      <input
                        className="w-full rounded-md border px-3 py-2 bg-background"
                        placeholder="OFFER2025"
                        {...register("couponCode")}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Display Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Display Text
                    </label>
                    <input
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      placeholder="Display text on UI"
                      {...register("displayText")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Display Order
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("displayOrder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Visibility
                    </label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-background"
                      {...register("visibility")}
                    >
                      <option value="Featured">Featured</option>
                      <option value="Hidden">Hidden</option>
                    </select>
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
                  {isPending ? "Creating..." : "Create Offer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
