import { cn } from "@/lib";
import { LucideIcon } from "lucide-react";

export type MenuIconProps = {
  Icon: LucideIcon;
  className?: string;
  size?: number; // in px
  "aria-hidden"?: boolean;
};
export function MenuIcon({
  Icon,
  className,
  size = 18,
  ...rest
}: MenuIconProps) {
  // Icon is a lucide-react component (or any react component)
  return (
    <span
      className={cn(
        "flex-none",
        "inline-flex",
        "items-center",
        "justify-center",
        className
      )}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon size={size} />
    </span>
  );
}
