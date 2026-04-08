"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { COUNTRY_CODES } from "@/config/country-code";
import { Input } from "@/components/ui/input";
import { Search, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountryCodeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function CountryCodeSelector({
  value,
  onValueChange,
  placeholder = "Code",
  disabled = false,
  className = "w-32",
  required = false,
}: CountryCodeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Deduplicate country codes - keep first occurrence of each dial code
  const uniqueCountries = useMemo(() => {
    const seenDialCodes = new Set<string>();
    return COUNTRY_CODES.filter((country) => {
      if (seenDialCodes.has(country.dial_code)) {
        return false;
      }
      seenDialCodes.add(country.dial_code);
      return true;
    });
  }, []);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return uniqueCountries;
    }

    const query = searchQuery.toLowerCase();
    return uniqueCountries.filter((country) => {
      return (
        country.name.toLowerCase().includes(query) ||
        country.dial_code.includes(query) ||
        country.code.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, uniqueCountries]);

  // Get display value for selected country
  const selectedCountry = useMemo(() => {
    return uniqueCountries.find((c) => c.dial_code === value);
  }, [value, uniqueCountries]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  const handleSelect = (dialCode: string) => {
    onValueChange(dialCode);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedCountry && "text-muted-foreground",
        )}
        aria-required={required}
      >
        <span className="truncate">
          {selectedCountry ? selectedCountry.dial_code : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-[280px] rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          {/* Search Box */}
          <div className="p-2 border-b bg-background">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.dial_code}`}
                  type="button"
                  onClick={() => handleSelect(country.dial_code)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground",
                    country.dial_code === value && "bg-accent",
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium">{country.dial_code}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-sm text-muted-foreground">
                      {country.name}
                    </span>
                  </div>
                  {country.dial_code === value && (
                    <Check className="h-4 w-4 ml-2 shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
