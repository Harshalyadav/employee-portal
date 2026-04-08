"use client";
import { DashboardLayout } from "@/components/layout";
import TransferRequestBell from "@/components/layout/TransferRequestBell";
import SidebarHeader from "@/components/layout/SidebarHeader";
import NavVertical from "@/components/navigations/nav-v";
import { menuItems } from "@/config";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const headerTitle = useMemo(() => {
    if (!pathname) return "Dashboard";
    if (pathname === "/profile" || pathname.startsWith("/profile/")) return "Profile";
    // Normalize pathname (remove trailing slash unless root)
    const normalized =
      pathname !== "/" && pathname.endsWith("/")
        ? pathname.slice(0, -1)
        : pathname;

    let bestMatchLabel: string | undefined;
    let bestMatchLength = -1;

    const traverse = (items: typeof menuItems) => {
      for (const item of items) {
        if (item.separator || item.isMenuTitle) continue;
        if (item.path) {
          const path = item.path;
          if (
            normalized === path ||
            (path !== "/" && normalized.startsWith(path + "/"))
          ) {
            if (path.length > bestMatchLength) {
              bestMatchLabel = item.label;
              bestMatchLength = path.length;
            }
          }
        }
        if (item.children && item.children.length) {
          traverse(item.children as any);
        }
      }
    };

    traverse(menuItems);
    return bestMatchLabel || "Dashboard";
  }, [pathname]);
  return (
    <SidebarProvider>
      <DashboardLayout
        sidebarHeader={<SidebarHeader logo="/images/logo.svg" />}
        sidebar={
          <NavVertical
            // header={<div>Header Content</div>}
            // footer={<div>Footer Content</div>}
            items={menuItems}
            activePath={pathname || "/dashboard"}
          />
        }
        sidebarPosition="left"
        headerTitle={headerTitle}
        headerChildren={<TransferRequestBell />}
      >
        {children}
      </DashboardLayout>
    </SidebarProvider>
  );
}
