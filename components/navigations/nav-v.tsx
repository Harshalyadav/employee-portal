"use client";

import { cn } from "@/lib";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./sidebar";
import { SidebarProps } from "@/types";
import { useSidebar } from "@/contexts/SidebarContext";
import SidebarLogoutButton from "@/components/layout/SidebarLogoutButton";

export default function NavVertical({
  header,
  footer,
  items = [],
  activePath,
  userRoles = [],
  className,
  "aria-label": ariaLabel = "Vertical Sidebar",
}: SidebarProps) {
  const { isOpen } = useSidebar();

  return (
    <aside
      className={cn(
        "flex flex-col h-full max-h-dvh bg-white dark:bg-background shadow-md transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        className
      )}
      aria-label={ariaLabel}
    >
      {header ? (
        <SidebarHeader className="p-4 border-b border-gray-200 dark:border-slate-700">
          {header}
        </SidebarHeader>
      ) : null}
      <div className="flex-1 overflow-y-auto min-h-0">
        <SidebarContent
          items={items}
          activePath={activePath}
          userRoles={userRoles}
          className={isOpen ? "space-y-4 p-4" : "p-1"}
        />
      </div>
      <SidebarFooter className="mt-auto shrink-0 p-4 border-t border-gray-200 dark:border-slate-700">
        {footer}
        {footer ? <div className="mt-2" /> : null}
        <SidebarLogoutButton />
      </SidebarFooter>
    </aside>
  );
}
