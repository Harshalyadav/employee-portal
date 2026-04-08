"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreatePermissionDto,
  createPermissionSchema,
  type CreatePermissionSchema,
} from "@/types";
import { useCreatePermission } from "@/hooks/query/permission.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreatePermissionFormProps {
  onSuccess?: () => void;
}

export function CreatePermissionForm({ onSuccess }: CreatePermissionFormProps) {
  const createPermissionMutation = useCreatePermission();
  const isLoading = createPermissionMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePermissionSchema>({
    resolver: zodResolver(createPermissionSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: CreatePermissionSchema) => {
    const permissionData: CreatePermissionDto = {
      module: data.module,
      description: data.description,
    };
    createPermissionMutation.mutate(permissionData, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
      onError: (err) => {
        console.log("Error creating permission:", err.response?.data?.message);
        toast.error(
          `Error creating permission: ${err.response?.data?.message}` ||
            "Failed to create permission"
        );
      },
    });
  };

  const error = createPermissionMutation.isError
    ? createPermissionMutation.error?.message
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
          placeholder="e.g., View Users, Edit Recipes"
          disabled={isLoading}
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
          placeholder="Describe what this permission allows..."
          disabled={isLoading}
          {...register("description")}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Creating..." : "Create Permission"}
        </Button>
      </div>
    </form>
  );
}
