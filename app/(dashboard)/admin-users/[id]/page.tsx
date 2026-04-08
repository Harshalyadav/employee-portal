"use client";

import { EditAdminUserPage } from "@/components/pages/admin-user-edit";

export default function AdminUserLegacyEditRoute({ params }: { params: Promise<{ id: string }> }) {
  return <EditAdminUserPage params={params} />;
}
