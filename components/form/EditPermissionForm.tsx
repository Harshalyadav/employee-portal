"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editPermissionSchema,
  type EditPermissionSchema,
} from "@/types/permission.type";
import { useEditPermission } from "@/hooks/query/permission.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditPermissionFormProps {
  defaultValues: Partial<EditPermissionSchema>;
  onSuccess?: () => void;
}

export function EditPermissionForm({
  defaultValues,
  onSuccess,
}: EditPermissionFormProps) {
  const editPermissionMutation = useEditPermission();
  const isLoading = editPermissionMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditPermissionSchema>({
    resolver: zodResolver(editPermissionSchema),
    mode: "onBlur",
    defaultValues: {
      id: defaultValues?.id || "",
      module: defaultValues?.module || "",
      description: defaultValues?.description || "",
    },
  });

  const onSubmit = async (data: EditPermissionSchema) => {
    const { id, ...payload } = data;
    editPermissionMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          reset(data);
          onSuccess?.();
        },
        onError: (err) => {
          console.log(
            "Error updating permission:",
            // @ts-ignore - best-effort reading from axios-like error
            err?.response?.data?.message
          );
          // @ts-ignore - best-effort reading from axios-like error
          const message = err?.response?.data?.message;
          toast.error(
            message
              ? `Error updating permission: ${message}`
              : "Failed to update permission"
          );
        },
      }
    );
  };

  const error = editPermissionMutation.isError
    ? editPermissionMutation.error?.message
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Permission Name *</Label>
        <Input
          id="name"
          type="text"
          disabled={isLoading}
          placeholder="e.g., View Users, Edit Recipes"
          {...register("module")}
        />
        {errors.module && (
          <p className="text-xs text-destructive">{errors.module.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          disabled={isLoading}
          placeholder="Describe what this permission allows..."
          {...register("description")}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
