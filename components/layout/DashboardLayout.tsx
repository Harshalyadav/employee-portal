"use client";

import { DashboardLayoutProps, SidebarPosition } from "@/types";
import { useSidebar } from "@/contexts/SidebarContext";
import PageHeader from "./PageHeader";

const layoutClasses: Record<SidebarPosition, string> = {
  left: "flex flex-row",
  right: "flex flex-row-reverse",
  top: "flex flex-col",
  bottom: "flex flex-col-reverse",
};

export default function DashboardLayout({
  sidebar,
  children,
  sidebarPosition = "top",
  className = "",
  headerTitle,
  headerChildren,
  sidebarHeader,
  showSearch,
}: DashboardLayoutProps) {
  const { isOpen, isMobile, close, toggle } = useSidebar();

  return (
    <section
      className={`${layoutClasses[sidebarPosition]} ${className} h-screen overflow-hidden relative bg-[linear-gradient(to_bottom_right,#dbeafe,#f0f6ff,#ffffff)] dark:bg-background`}
    >
      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-background/90 bg-opacity-50 z-40"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          transition-all duration-300 z-50 bg-white dark:bg-zinc-900 flex flex-col overflow-hidden my-3 ml-3 rounded-2xl shadow-sm
          ${isMobile ? "fixed inset-y-0 left-0 shadow-lg" : "relative"}
          ${isOpen ? "w-64" : isMobile ? "w-0 -translate-x-full" : "w-[80px]"}
          ${!isMobile ? "translate-x-0" : isOpen ? "translate-x-0" : ""}
        `}
      >
        {/* Sidebar Header */}
        {sidebarHeader}
        {/* Sidebar Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col bg-transparent">
        <div className="p-3 pb-0 relative z-50">
          <PageHeader title={headerTitle} showSearch={showSearch}>
            {headerChildren}
          </PageHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-1 sm:px-3 sm:py-3">
          {children}
        </div>
      </main>
    </section>
  );
}
