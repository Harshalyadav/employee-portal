import { cn } from "@/lib";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./sidebar";
import { MenuItemConfig, ROLE_ENUM } from "@/types";

interface SidebarProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  items?: MenuItemConfig[];
  activePath?: string;
  userRoles?: ROLE_ENUM[];
  className?: string;
  "aria-label"?: string;
}

export default function NavMini({
  header,
  footer,
  items = [],
  activePath,
  userRoles = [],
  className,
  "aria-label": ariaLabel = "Mini Sidebar",
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white dark:bg-slate-900 w-16", // Adjust width for a mini sidebar
        className
      )}
      aria-label={ariaLabel}
    >
      {header ? (
        <SidebarHeader className="p-2">{header}</SidebarHeader> // Compact header
      ) : null}
      <div className="flex-1 min-h-0">
        <SidebarContent
          items={items}
          activePath={activePath}
          userRoles={userRoles}
          className="space-y-2 text-center" // Adjust spacing and alignment for compact layout
        />
      </div>
      {footer ? (
        <SidebarFooter className="p-2">{footer}</SidebarFooter> // Compact footer
      ) : null}
    </aside>
  );
}
