"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib";

export type ComboItem = {
  value: string;
  label: string;
};

interface ComboboxProps {
  items: ComboItem[];
  value?: string | string[];
  onChange: (value: string | string[] | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  emptyLabel?: string;
  multiple?: boolean;
}

export function Combobox({
  items,
  value,
  onChange,
  placeholder = "Select...",
  disabled,
  className,
  emptyLabel = "Clear selection",
  multiple = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasSelection = multiple
    ? Array.isArray(value) && value.length > 0
    : typeof value === "string" && value.length > 0;

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filteredItems = items;
    if (multiple && Array.isArray(value)) {
      filteredItems = filteredItems.filter((i) => !value.includes(i.value));
    }
    if (!q) return filteredItems;
    return filteredItems.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, value, multiple]);

  // For multi-select, value is string[]; for single, string
  const selectedLabels = useMemo(() => {
    if (multiple && Array.isArray(value)) {
      return items
        .filter((i) => value.includes(i.value))
        .map((i) => i.label)
        .join(", ");
    }
    return items.find((i) => i.value === value)?.label ?? "";
  }, [items, value, multiple]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Chips for selected items in multi-select mode */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((val) => {
            const item = items.find((i) => i.value === val);
            if (!item) return null;
            return (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 rounded-full bg-accent text-sm text-accent-foreground border"
              >
                {item.label}
                <button
                  type="button"
                  className="ml-2 text-xs text-destructive hover:text-destructive/80"
                  onClick={() => {
                    const newValue = value.filter((v) => v !== val);
                    onChange(newValue);
                  }}
                  aria-label={`Remove ${item.label}`}
                  tabIndex={0}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-foreground shadow-sm transition-colors",
          !hasSelection && "text-muted-foreground",
          open && "ring-2 ring-ring ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {hasSelection ? selectedLabels : placeholder}
        </span>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
          <div className="p-2">
            <input
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              disabled={disabled}
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1" role="listbox">
            {/* Clear selection for single, or clear all for multi */}
            {((!multiple && value) ||
              (multiple && Array.isArray(value) && value.length > 0)) && (
              <li>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                  onClick={() => {
                    onChange(multiple ? [] : undefined);
                    setOpen(false);
                  }}
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent",
                    multiple
                      ? Array.isArray(value) &&
                          value.includes(item.value) &&
                          "bg-accent"
                      : item.value === value && "bg-accent"
                  )}
                  onClick={() => {
                    if (multiple) {
                      let newValue: string[] = Array.isArray(value)
                        ? [...value]
                        : [];
                      if (newValue.includes(item.value)) {
                        newValue = newValue.filter((v) => v !== item.value);
                      } else {
                        newValue.push(item.value);
                      }
                      onChange(newValue);
                    } else {
                      onChange(item.value);
                      setOpen(false);
                    }
                    setQuery("");
                  }}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(value) && value.includes(item.value)
                      }
                      readOnly
                      className="mr-2"
                    />
                  )}
                  {item.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No results
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
