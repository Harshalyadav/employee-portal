"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/stores/actions/auth.action";
import { useRouter } from "next/navigation";
import { isValidSrc } from "@/lib";

interface UserMenuProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export default function UserMenu({
  userName = "User",
  userEmail = "user@example.com",
  userAvatar,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/auth/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  // Menu items array removed in favor of direct logout button

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center overflow-hidden">
          {isValidSrc(userAvatar) ? (
            <Image
              src={userAvatar}
              alt={userName}
              width={32}
              height={32}
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/images/logo.svg";
              }}
            />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {userName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {userEmail}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {userName}
            </p>
            {userEmail !== userName && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {userEmail}
              </p>
            )}
          </div>
          <div className="p-1.5 space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
