"use client";

import { EditAdminUserPage } from "@/components/pages/admin-user-edit";

export default function AdminUserEditRoute({ params }: { params: Promise<{ id: string }> }) {
  return <EditAdminUserPage params={params} />;
}
