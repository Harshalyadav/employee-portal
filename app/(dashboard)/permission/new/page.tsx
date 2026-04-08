"use client";

import { CreatePermissionForm } from "@/components/form/CreatePermissionForm";
import PageHeader from "@/components/sections/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

const PermissionDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const permissionId = params?.id as string;

  return (
    <div className="w-full">
      <PageHeader
        title="Create Permission"
        options={
          <Button variant="outline" onClick={() => router.push("/permission")}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />

      <div className="rounded-lg shadow p-6">
        {<CreatePermissionForm onSuccess={() => router.push("/permission")} />}
      </div>
    </div>
  );
};
// Permission detail page component
export default PermissionDetailPage;
