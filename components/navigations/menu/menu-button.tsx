import { LucideIcon } from "lucide-react";
import { MenuIcon } from "./menu-icon";
import { cn } from "@/lib";
import { MenuLabel } from "./menu-label";
import Link from "next/link";

export type MenuButtonProps = {
  children?: React.ReactNode;
  Icon?: LucideIcon;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
};

export function MenuButton({
  children,
  Icon,
  href,
  onClick,
  active = false,
  disabled = false,
  className,
  title,
}: MenuButtonProps) {
  const base =
    "group flex items-center w-full text-left rounded-md px-2 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const state = cn(
    active
      ? "bg-accent text-accent-foreground dark:bg-accent/40 dark:text-accent-foreground"
      : "text-foreground hover:bg-muted dark:text-foreground dark:hover:bg-muted/50",
    disabled && "opacity-50 cursor-not-allowed"
  );

  const content = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={title}
      className={cn(base, state, className)}
    >
      {Icon ? <MenuIcon Icon={Icon} /> : null}
      {children ? <MenuLabel>{children}</MenuLabel> : null}
    </button>
  );

  if (href && !disabled) {
    // Next.js Link wrapper
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="w-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}
