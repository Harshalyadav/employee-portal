"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { logout } from "@/stores/actions/auth.action";
import { cn } from "@/lib/utils";

export default function SidebarLogoutButton() {
  const router = useRouter();
  const { isOpen } = useSidebar();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const collapsed = !isOpen;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        title="Logout"
        className={cn(
          "flex w-full items-center justify-center rounded-md p-2 text-sm transition-colors",
          "text-slate-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={cn(
        "group flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors",
        "text-slate-700 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="ml-3 font-medium">
        {isLoggingOut ? "Logging out..." : "Logout"}
      </span>
    </button>
  );
}
