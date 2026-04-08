"use client";

import { AdminUserForm } from "./admin-user-form";

interface EditAdminUserFormMultiStepProps {
  userId: string;
  onSuccess?: () => void;
}

export function EditAdminUserFormMultiStep({ userId, onSuccess }: EditAdminUserFormMultiStepProps) {
  return <AdminUserForm mode="edit" userId={userId} />;
}
