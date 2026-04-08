"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePendingTransferRequests } from "@/hooks/query/branch-transfer-request.hook";
import { useAppStore } from "@/stores";
import { canViewTransferRequests } from "@/lib/admin-head-access";

export default function TransferRequestBell() {
  const router = useRouter();
  const { user } = useAppStore();
  const canView = canViewTransferRequests(user);
  const { data } = usePendingTransferRequests({ page: 1, limit: 1 }, { enabled: canView });
  const count = data?.pagination?.total || 0;

  if (!canView) {
    return null;
  }

  return (
    <button
      aria-label="View transfer requests"
      className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      onClick={() => router.push("/users/transfer-requests")}
      type="button"
    >
      <Bell className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1">
          <Badge variant="destructive" className="px-1.5 py-0.5 text-xs min-w-[18px] h-[18px] flex items-center justify-center">
            {count}
          </Badge>
        </span>
      )}
    </button>
  );
}
