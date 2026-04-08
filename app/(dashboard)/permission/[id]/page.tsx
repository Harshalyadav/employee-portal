"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetPermissionDetail } from "@/hooks/query/permission.hook";
import { CreatePermissionForm } from "@/components/form/CreatePermissionForm";
import { EditPermissionForm } from "@/components/form/EditPermissionForm";
import PageHeader from "@/components/sections/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const PermissionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const permissionId = params?.id as string;

  const isNewPermission = permissionId === "new";
  const {
    data: permission,
    isLoading,
    error,
  } = useGetPermissionDetail(!isNewPermission ? permissionId : undefined);

  if (isLoading && !isNewPermission) {
    return (
      <div className="w-full">
        <PageHeader
          title="Permission Details"
          options={
            <Button
              variant="outline"
              onClick={() => router.push("/permission")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          }
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || (!permission && !isNewPermission)) {
    return (
      <div className="w-full">
        <PageHeader
          title="Permission not found"
          options={
            <Button
              variant="outline"
              onClick={() => router.push("/permission")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Permissions
            </Button>
          }
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Permission not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PageHeader
        title={isNewPermission ? "Create Permission" : "Permission Details"}
        options={
          <Button variant="outline" onClick={() => router.push("/permission")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="rounded-lg shadow p-6">
        {isNewPermission ? (
          <CreatePermissionForm onSuccess={() => router.push("/permission")} />
        ) : (
          permission && (
            <EditPermissionForm
              defaultValues={permission as any}
              onSuccess={() => router.push("/permission")}
            />
          )
        )}
      </div>
    </div>
  );
};

export default PermissionDetailPage;
