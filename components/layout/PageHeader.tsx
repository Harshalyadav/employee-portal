"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";
// import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { Menu } from "lucide-react";
import { useAppStore } from "@/stores";

interface PageHeaderProps {
  title?: string;
  children?: React.ReactNode;
  showSearch?: boolean;
}

export default function PageHeader({
  title,
  children,
  showSearch = false,
}: PageHeaderProps) {
  const { toggle, isOpen, isMobile } = useSidebar();
  const { user } = useAppStore();

  return (
    <header className="h-[60px] bg-white/70 backdrop-blur-md dark:bg-background/80 shadow-sm rounded-[1.25rem] flex items-center px-4 gap-4 shrink-0 mx-2 mt-2">
      {isMobile && !isOpen && (
        <button
          onClick={toggle}
          className="p-2 hover:bg-muted dark:hover:bg-muted rounded-md transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {title && (
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden md:block">
          {title}
        </h1>
      )}

      {/* Search Bar Removed */}

      <div className="ml-auto flex items-center gap-3 pr-2">
        {children}
        {/* <ThemeSwitcher /> */}
        <UserMenu
          userName={user?.email || "User"}
          userEmail={user?.email}
        />
      </div>
    </header>
  );
}
