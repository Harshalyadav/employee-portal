"use client";

import { useParams } from "next/navigation";
import { CreateLotMasterForm } from "@/components/form/CreateLotMasterForm";
import { useLotMaster } from "@/hooks/useLotMaster";
import { LoadingState } from "@/components/LoadingState";
import { ErrorAlert } from "@/components/ErrorAlert";
import { usePermission } from "@/hooks";
import { ModuleNameEnum } from "@/types/role.type";

export default function EditLotMasterPage() {
  const params = useParams();
  const lotMasterId = params.id as string;
  const { canUpdate } = usePermission();
  const { lotMaster, loading, error } = useLotMaster(lotMasterId);

  // Check if user has UPDATE permission
  if (!canUpdate(ModuleNameEnum.LOT)) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Access Denied"
        message="You do not have permission to edit LOT Masters."
      />
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorAlert
        isOpen={true}
        title="Error Loading LOT Master"
        message={
          error.message || "Failed to load LOT Master. Please try again."
        }
      />
    );
  }

  return <CreateLotMasterForm lotMaster={lotMaster || undefined} />;
}
