"use client";
import { usePermission } from "@/hooks";
import { canAccessPathByRole, canAccessSidebarItemByRole } from "@/lib/admin-head-access";
import { cn } from "@/lib";
import {
  MenuItemConfig,
  ROLE_ENUM,
  SidebarContentProps,
  SidebarFooterProps,
  SidebarHeaderProps,
} from "@/types";
import { PermissionAction } from "@/types/role.type";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAppStore } from "@/stores";
import Link from "next/link";

// ---- Small internal components ----
function Badge({ value }: { value: string | number }) {
  return (
    <span className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4 bg-muted dark:bg-muted">
      {value}
    </span>
  );
}

function Item({
  item,
  activePath,
  userRoles,
  hasPermission,
  collapsed,
}: {
  item: MenuItemConfig;
  activePath?: string;
  userRoles?: ROLE_ENUM[];
  hasPermission: (moduleName: any, action: PermissionAction) => boolean;
  collapsed?: boolean;
}) {
  const { user } = useAppStore();

  if (!canAccessSidebarItemByRole(user, item.id)) {
    return null;
  }

  if (item.path && !canAccessPathByRole(user, item.path)) {
    return null;
  }

  // Permission-based filtering - if module is specified, check read permission
  if (item.module) {
    const canRead = hasPermission(item.module, PermissionAction.READ);

    if (!canRead) return null;
  }

  // Hide separators and menu titles in collapsed mode
  if (item.separator) {
    if (collapsed) return null;
    return <li className="my-2 h-px bg-border dark:bg-border" aria-hidden />;
  }

  if (item.isMenuTitle) {
    if (collapsed) return null;
    const label = item.label;
    return (
      <li className="px-3 pt-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </li>
    );
  }

  const isActive =
    item.path && activePath
      ? item.path === activePath ||
      (item.path !== "/" && activePath.startsWith(item.path + "/"))
      : false;

  const label = item.label;

  // Collapsed: icon-only view
  if (collapsed) {
    const iconContent = (
      <div
        className={cn(
          "group flex items-center justify-center w-full rounded-md p-2 transition-colors",
          isActive
            ? "bg-primary/70 text-primary-foreground dark:bg-slate-800 dark:text-slate-300"
            : "text-slate-700 hover:bg-accent dark:text-slate-300 dark:hover:bg-slate-900"
        )}
        aria-current={isActive ? "page" : undefined}
        title={label}
      >
        {item.icon ? (
          <span className="flex-none">{item.icon}</span>
        ) : (
          <span className="w-5 h-5 flex items-center justify-center text-xs font-semibold">
            {label.charAt(0)}
          </span>
        )}
      </div>
    );

    return (
      <li>
        {item.path ? (
          <Link href={item.path} className="block w-full">
            {iconContent}
          </Link>
        ) : (
          iconContent
        )}
      </li>
    );
  }

  // Expanded: full view
  const content = (
    <div
      className={cn(
        "group flex items-center w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/70 text-primary-foreground dark:bg-slate-800 dark:text-slate-300"
          : "text-slate-700 hover:bg-accent dark:text-slate-300 dark:hover:bg-slate-900"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon ? <span className="flex-none">{item.icon}</span> : null}
      <span className="ml-3">{label}</span>
      {item.badge ? <Badge value={item.badge} /> : null}
    </div>
  );

  return (
    <li>
      {item.path ? (
        <Link href={item.path} className="block w-full">
          {content}
        </Link>
      ) : (
        content
      )}

      {/* children (one level) */}
      {item.children && item.children.length > 0 && (
        <ul className="mt-1 ml-6 space-y-1">
          {item.children.map((ch) => (
            <Item
              key={ch.id}
              item={ch}
              activePath={activePath}
              userRoles={userRoles}
              hasPermission={hasPermission}
              collapsed={collapsed}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// ---- Public components ----
export function SidebarHeader({ children, className }: SidebarHeaderProps) {
  return (
    <div
      className={cn("px-4 py-4 flex items-center justify-between", className)}
    >
      {children}
    </div>
  );
}

export function SidebarContent({
  items,
  activePath,
  userRoles,
  className,
}: SidebarContentProps) {
  const { hasPermission } = usePermission();
  const { isOpen } = useSidebar();
  const collapsed = !isOpen;

  return (
    <div className={cn("px-2 py-3 overflow-y-auto", className)}>
      <ul className="space-y-1">
        {items.map((it) => (
          <Item
            key={it.id}
            item={it}
            activePath={activePath}
            userRoles={userRoles}
            hasPermission={hasPermission}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </div>
  );
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "px-4 py-3 border-t border-slate-100 dark:border-slate-800",
        className
      )}
    >
      {children}
    </div>
  );
}
