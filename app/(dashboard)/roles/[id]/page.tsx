"use client";

import RoleDetailsPage from "@/components/pages/role-details";
import { useParams } from "next/navigation";

export default function RoleDetailPage() {
  const params = useParams();
  const roleId = params.id as string;

  return <RoleDetailsPage roleId={roleId} />;
}
