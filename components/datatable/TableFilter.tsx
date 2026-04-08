import React, { useCallback, useEffect, useRef, useState } from "react";

export const TableFilter = ({
  value,
  onChange,
  disabled = false,
  debounceMs = 300,
  title,
  dataCount,
  endSlot,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  debounceMs?: number;
  title?: string;
  dataCount?: number;
  /** Extra content rendered to the right of the search input */
  endSlot?: React.ReactNode;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value immediately for UI responsiveness
  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounced callback
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full mb-4 sm:mb-6 sticky top-0 z-30 bg-white/90 dark:bg-gray-900/80 backdrop-blur supports-backdrop-filter:bg-white/60 dark:supports-backdrop-filter:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 pt-2 pb-2 px-0">
      {/* Title and Data Count Section */}
      {(title || dataCount !== undefined) && (
        <div className="flex items-center justify-between mb-3 px-0">
          {title && (
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </h3>
          )}
          {dataCount !== undefined && (
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Total:{" "}
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {dataCount}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Search Input + endSlot in the same row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search..."
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm sm:text-base bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        {endSlot && <div className="flex-shrink-0">{endSlot}</div>}
      </div>
    </div>
  );
};
