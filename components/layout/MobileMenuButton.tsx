"use client";

import { useSidebar } from "@/contexts/SidebarContext";

export default function MobileMenuButton() {
  const { toggle, isMobile } = useSidebar();

  if (!isMobile) return null;

  return (
    <button
      onClick={toggle}
      className="fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-lg md:hidden"
      aria-label="Toggle menu"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
