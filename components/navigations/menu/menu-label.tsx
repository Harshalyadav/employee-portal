import { cn } from "@/lib";

export type MenuLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function MenuLabel({ children, className }: MenuLabelProps) {
  return (
    <span className={cn("truncate", "ml-3", "text-sm", "leading-5", className)}>
      {children}
    </span>
  );
}
