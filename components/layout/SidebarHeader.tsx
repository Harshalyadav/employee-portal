"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import Image from "next/image";
import { cn, isValidSrc } from "@/lib";

interface SidebarHeaderProps {
  logo?: string;
  companyName?: string;
}

export default function SidebarHeader({
  logo = "/logo.svg",
  companyName,
}: SidebarHeaderProps) {
  const { toggle, isOpen } = useSidebar();
  const validLogo = isValidSrc(logo) ? logo : "/logo.svg";

  return (
    <div
      className={cn(
        "h-16 flex items-center border-b border-gray-200 dark:border-gray-700 shrink-0 bg-white dark:bg-background transition-all duration-300",
        isOpen ? "justify-between px-4" : "justify-center px-2"
      )}
    >
      {isOpen ? (
        <>
          <div
            className={`flex items-center h-full ${companyName ? "gap-3" : "flex-1"
              }`}
          >
            <div
              className={cn(
                "relative py-2",
                companyName ? "w-8" : "flex-1 h-12 py-4"
              )}
            >
              <Image
                src={validLogo}
                alt={companyName || "Logo"}
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo.svg";
                }}
              />
            </div>
            {companyName && (
              <span className="font-semibold text-lg text-gray-800 dark:text-gray-100">
                {companyName}
              </span>
            )}
          </div>
          <button
            onClick={toggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </>
      ) : (
        <button
          onClick={toggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          aria-label="Open sidebar"
        >
          <div className="relative w-8 h-8">
            <Image
              src={validLogo}
              alt={companyName || "Logo"}
              fill
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/logo.svg";
              }}
            />
          </div>
        </button>
      )}
    </div>
  );
}
