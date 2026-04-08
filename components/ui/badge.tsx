"use client";

type BadgeProps = {
  children: React.ReactNode;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "warning"
    | "success"
    | "info";
  className?: string;
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const base =
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded";
  const variants: Record<string, string> = {
    default: "bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100",
    secondary: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    destructive: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    success: "bg-secondary text-secondary-foreground",
    info: "bg-primary text-primary-foreground",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
