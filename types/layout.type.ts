
type SidebarPosition = "left" | "right" | "top" | "bottom";

interface DashboardLayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    sidebarPosition?: SidebarPosition;
    className?: string;
}
export type { SidebarPosition, DashboardLayoutProps };