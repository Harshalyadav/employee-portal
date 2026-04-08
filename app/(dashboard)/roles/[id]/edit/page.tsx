"use client";

import { useParams } from "next/navigation";
import { EditRoleForm } from "@/components/form/EditRoleForm";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";
import { ErrorAlert } from "@/components/ErrorAlert";

export default function EditRolePage() {
  const params = useParams();
  const roleId = params.id as string;
  const { canUpdate } = usePermission();

  // Check if user has UPDATE permission
  if (!canUpdate(ModuleNameEnum.ROLES)) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Access Denied"
        message="You do not have permission to edit roles."
      />
    );
  }

  return <EditRoleForm roleId={roleId} />;
}
