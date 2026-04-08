"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editFranchiseSchema,
  type EditFranchiseSchema,
} from "@/types/franchise.type";
import { useEditFranchise } from "@/hooks/query/franchise.hook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditFranchiseFormProps {
  defaultValues: EditFranchiseSchema;
  onSuccess?: () => void;
}

export function EditFranchiseForm({
  defaultValues,
  onSuccess,
}: EditFranchiseFormProps) {
  const editFranchiseMutation = useEditFranchise();
  const isLoading = editFranchiseMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFranchiseSchema>({
    resolver: zodResolver(editFranchiseSchema),
    mode: "onBlur",
    defaultValues,
  });

  const onSubmit = async (data: EditFranchiseSchema) => {
    const { id, ...payload } = data;
    const normalizedPayload = {
      ...payload,
      basicInfo: payload.basicInfo
        ? { ...payload.basicInfo, status: payload.basicInfo.status || "" }
        : undefined,
      franchiseOverview: payload.franchiseOverview
        ? Object.fromEntries(
            Object.entries(payload.franchiseOverview).filter(
              ([, value]) => value !== undefined
            )
          )
        : undefined,
    };
    editFranchiseMutation.mutate(
      { id, payload: normalizedPayload as any },
      {
        onSuccess: () => {
          reset(data);
          onSuccess?.();
        },
      }
    );
  };

  const error = editFranchiseMutation.isError
    ? editFranchiseMutation.error?.message
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        {/* Same tab content structure as CreateFranchiseForm but with defaultValues */}
        <TabsContent value="basic" className="space-y-6">
          {/* ...same fields as create form... */}
        </TabsContent>

        {/* ...other tabs... */}
      </Tabs>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
