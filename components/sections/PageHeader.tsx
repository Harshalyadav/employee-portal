"use client";
import { useRouter } from "next/navigation";
import React from "react";

type PageHeaderProps = {
  title: string;
  backUrl?: string;
  options?: React.ReactNode;
};

const PageHeader: React.FC<PageHeaderProps> = ({ title, backUrl, options }) => {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center"
          aria-label="Back"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
          {title}
        </h1>
      </div>
      {options && <div className="mt-2 sm:mt-0">{options}</div>}
    </div>
  );
};

export default PageHeader;
