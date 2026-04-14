"use client";

import { ReactNode } from "react";

import LoginPage from "@/components/pages/LoginPage";
import { DashboardLayout } from "@/components/layout";
import TransferRequestBell from "@/components/layout/TransferRequestBell";
import SidebarHeader from "@/components/layout/SidebarHeader";
import NavVertical from "@/components/navigations/nav-v";
import { DashboardPage } from "@/components/pages";
import { EmployeePortalSidebar } from "@/components/pages/EmployeePortalPage";
import { menuItems } from "@/config";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { isEmployeePortalUser } from "@/lib/admin-head-access";
import { useAppStore } from "@/stores";

interface EmployeeBankDetailsRouteFrameProps {
  title: string;
  children: ReactNode;
}

export default function EmployeeBankDetailsRouteFrame({ title, children }: EmployeeBankDetailsRouteFrameProps) {
  const { user } = useAppStore();
  const isAuthenticated = !!user;
  const isEmployeeUser = isEmployeePortalUser(user);

  if (isAuthenticated) {
    if (isEmployeeUser) {
      return (
        <SidebarProvider>
          <DashboardLayout
            sidebarHeader={<SidebarHeader logo="/images/logo.svg" />}
            sidebar={<EmployeePortalSidebar />}
            sidebarPosition="left"
            headerTitle={title}
          >
            {children}
          </DashboardLayout>
        </SidebarProvider>
      );
    }

    return (
      <SidebarProvider>
        <DashboardLayout
          sidebarHeader={<SidebarHeader logo="/images/logo.svg" />}
          sidebar={<NavVertical items={menuItems} activePath="/" />}
          sidebarPosition="left"
          headerTitle="Dashboard"
          headerChildren={<TransferRequestBell />}
        >
          <DashboardPage />
        </DashboardLayout>
      </SidebarProvider>
    );
  }

  return <LoginPage />;
}
