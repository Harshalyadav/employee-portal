"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createLotMasterSchema,
  type CreateLotMasterSchema,
  type LotMaster,
} from "@/types/lot-master.type";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLotMasterMutations } from "@/hooks/useLotMaster";
import { useState } from "react";
import { APP_ROUTE } from "@/routes";

interface CreateLotMasterFormProps {
  lotMaster?: LotMaster;
  onSuccess?: () => void;
}

export function CreateLotMasterForm({
  lotMaster,
  onSuccess,
}: CreateLotMasterFormProps) {
  const router = useRouter();
  const isEditMode = !!lotMaster;
  const { create, update, loading } = useLotMasterMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLotMasterSchema>({
    resolver: zodResolver(createLotMasterSchema),
    defaultValues: isEditMode
      ? {
          name: lotMaster.name,
          lotCapAmount: lotMaster.lotCapAmount,
          isActive: lotMaster.isActive,
        }
      : {
          name: "",
          lotCapAmount: 0,
          isActive: true,
        },
  });

  const onSubmit = async (data: CreateLotMasterSchema) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        name: data.name,
        lotCapAmount: Number(data.lotCapAmount),
        isActive: isEditMode ? data.isActive : true,
      };

      if (isEditMode) {
        await update(lotMaster._id, submitData);
        toast.success("LOT Master updated successfully!");
      } else {
        await create(submitData);
        toast.success("LOT Master created successfully!");
      }

      onSuccess?.();
      router.push(APP_ROUTE.LOT.ALL.PATH);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save LOT Master";
      toast.error(errorMessage);
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit LOT Cap Master" : "Create LOT Cap Master"}
        </h1>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>LOT Cap Master Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              LOT Cap Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g., Monthly LOT Limit, Q1 Special LOT"
              {...register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* LOT Cap Amount */}
          <div>
            <label
              htmlFor="lotCapAmount"
              className="block text-sm font-medium mb-2"
            >
              Maximum Cap Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="lotCapAmount"
              type="number"
              step="0.01"
              placeholder="50000"
              {...register("lotCapAmount", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.lotCapAmount && (
              <p className="text-red-500 text-sm mt-1">
                {errors.lotCapAmount.message}
              </p>
            )}
          </div>

          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                {...register("isActive")}
                className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active Status
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || loading}>
          {isSubmitting || loading
            ? "Saving..."
            : isEditMode
              ? "Update"
              : "Create"}
        </Button>
      </div>
    </form>
  );
}
