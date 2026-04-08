"use client";

import { IBranch } from "@/types/branch.type";
import { CreateBranchForm } from "@/components/form/CreateBranchForm";
import { EditBranchForm } from "@/components/form/EditBranchForm";

interface BranchFormProps {
  branch?: IBranch;
  onSuccess?: () => void;
}

export function BranchForm({ branch, onSuccess }: BranchFormProps) {
  if (branch) {
    return <EditBranchForm branch={branch} onSuccess={onSuccess} />;
  }

  return <CreateBranchForm onSuccess={onSuccess} />;
}
