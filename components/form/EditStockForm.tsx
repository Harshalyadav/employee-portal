"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editStockSchema, type EditStockSchema } from "@/types/stock.type";
import { useEditStock } from "@/hooks/query/stock.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditStockFormProps {
  defaultValues: EditStockSchema;
  onSuccess?: () => void;
}

export function EditStockForm({
  defaultValues,
  onSuccess,
}: EditStockFormProps) {
  const editStockMutation = useEditStock();
  const isLoading = editStockMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditStockSchema>({
    resolver: zodResolver(editStockSchema),
    mode: "onBlur",
    defaultValues,
  });

  const currentStock = watch("currentStock");
  const unitPrice = watch("unitPrice");

  const onSubmit = async (data: EditStockSchema) => {
    const { id, ...payload } = data;
    editStockMutation.mutate(
      { id, payload: payload as any },
      {
        onSuccess: () => {
          reset(data);
          onSuccess?.();
        },
      }
    );
  };

  const error = editStockMutation.isError
    ? editStockMutation.error?.message
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

        {/* Same structure as CreateStockForm but with default values */}
        <TabsContent value="basic" className="space-y-6">
          {/* ...same fields as create form... */}
        </TabsContent>

        <TabsContent value="location" className="space-y-6">
          {/* ...same fields as create form... */}
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
