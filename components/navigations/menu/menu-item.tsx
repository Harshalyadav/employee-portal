import { LucideIcon } from "lucide-react";
import { MenuButton } from "./menu-button";
import { cn } from "@/lib";

export type MenuItemProps = {
  id?: string;
  Icon?: LucideIcon;
  label: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
};

export function MenuItem({
  id,
  Icon,
  label,
  href,
  onClick,
  active,
  disabled,
  className,
}: MenuItemProps) {
  return (
    <li id={id} className={cn("list-none", className)}>
      <MenuButton
        Icon={Icon}
        href={href}
        onClick={onClick}
        active={!!active}
        disabled={!!disabled}
      >
        {label}
      </MenuButton>
    </li>
  );
}
