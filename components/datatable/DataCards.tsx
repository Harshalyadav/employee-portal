"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Column } from "@/types";
import { TableFilter } from "./TableFilter";
import { TablePagination } from "./TablePagination";
import { Avatar, Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  BedDouble,
  Bath,
  Expand,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { isValidSrc } from "@/lib";

interface DataCardsProps {
  columns: Column[];
  rows: any[];
  primaryColumnId?: string;
  emptyMessage?: string;
  className?: string;
  basePath?: string;
}

const statusVariant = (s?: string) => {
  if (!s) return "secondary";
  if (["active", "available", "completed"].includes(s)) return "success";
  if (["sold", "closed"].includes(s)) return "destructive";
  if (s === "ongoing") return "info";
  return "warning";
};

const DataCards: React.FC<DataCardsProps> = ({
  columns,
  rows,
  primaryColumnId,
  emptyMessage = "No records found",
  className = "",
  basePath,
}) => {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const rowsPerBatch = 10;
  const [visibleCount, setVisibleCount] = useState(rowsPerBatch);

  const filteredRows = useMemo(() => {
    if (!filter) return rows;
    return rows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [filter, rows]);

  // Reset visible items when filter changes
  useEffect(() => {
    setVisibleCount(rowsPerBatch);
  }, [filter]);

  const slicedRows = useMemo(
    () => filteredRows.slice(0, visibleCount),
    [filteredRows, visibleCount]
  );

  const titleColumn = primaryColumnId
    ? columns.find((c) => c.id === primaryColumnId) || columns[0]
    : columns[0];

  return (
    <div className={`md:hidden ${className}`}>
      <TableFilter value={filter} onChange={setFilter} />
      {!slicedRows.length && (
        <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      )}
      <div className="space-y-5">
        {slicedRows.map((row, idx) => {
          const hasThumbnail = !!row.thumbnail;
          const hasLogo = !!row.logo || !!row.avatar;
          const status = row.status as string | undefined;
          const titleValue = row[titleColumn.id];
          const bodyCols = columns.filter(
            (c) =>
              c.id !== titleColumn.id &&
              c.id !== "thumbnail" &&
              c.id !== "logo" &&
              c.id !== "avatar" &&
              c.id !== "action"
          );

          const isProperty =
            hasThumbnail && ("price" in row || "propertyType" in row);
          const isAgent = !!row.avatar && !hasThumbnail;
          const isBuilderOrProject = !!row.logo && !hasThumbnail && !isAgent;

          const ringClass = isProperty
            ? "ring-primary/30 dark:ring-primary/40"
            : isAgent
            ? "ring-accent/30 dark:ring-accent/40"
            : isBuilderOrProject
            ? "ring-secondary/30 dark:ring-secondary/40"
            : "ring-border dark:ring-border";

          const renderPropertySpecs = () => {
            const area = row.area ? `${row.area.toLocaleString()} sq ft` : null;
            const beds =
              typeof row.bedrooms === "number" ? `${row.bedrooms} beds` : null;
            const baths =
              typeof row.bathrooms === "number"
                ? `${row.bathrooms} baths`
                : null;
            if (!area && !beds && !baths) return null;
            return (
              <div className="flex items-center flex-wrap gap-4 text-xs font-medium text-gray-700 dark:text-gray-300 mt-3">
                {area && (
                  <span className="flex items-center gap-1">
                    <Expand className="h-3 w-3" /> {area}
                  </span>
                )}
                {beds && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" /> {beds}
                  </span>
                )}
                {baths && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3 w-3" /> {baths}
                  </span>
                )}
              </div>
            );
          };

          const overlayBadges = hasThumbnail && (
            <div className="absolute top-3 left-3 flex gap-2 z-10">
              {status && (
                <Badge variant={statusVariant(status)} className="shadow-sm">
                  {status.toUpperCase()}
                </Badge>
              )}
              {row.propertyType && (
                <Badge variant="secondary" className="shadow-sm">
                  {String(row.propertyType).toUpperCase()}
                </Badge>
              )}
            </div>
          );

          const agentMeta = isAgent && (
            <div className="flex flex-col gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
              {row.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {row.email}
                </span>
              )}
              {row.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {row.phone}
                </span>
              )}
              {row.agency && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {row.agency}
                </span>
              )}
            </div>
          );

          const builderProjectMeta = isBuilderOrProject && (
            <div className="flex flex-col gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
              {row.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {row.address}
                </span>
              )}
              {row.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {row.phone}
                </span>
              )}
              {row.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {row.email}
                </span>
              )}
            </div>
          );

          return (
            <div
              key={idx}
              onClick={() => {
                if (basePath && row.id) {
                  router.push(`${basePath}/${row.id}`);
                }
              }}
              className={`border rounded-2xl bg-white dark:bg-gray-800 overflow-hidden shadow-sm ring-1 ${ringClass} ${
                basePath && row.id
                  ? "cursor-pointer hover:shadow-md transition-shadow"
                  : ""
              }`}
            >
              {hasThumbnail && (
                <div
                  className="relative w-full bg-gray-100 dark:bg-gray-700"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  {overlayBadges}
                  <Image
                    src={
                      isValidSrc(row.thumbnail)
                        ? row.thumbnail
                        : "/images/placeholder.png"
                    }
                    alt={String(titleValue || "Thumbnail")}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={idx < 4}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder.png";
                    }}
                  />
                </div>
              )}
              <div className="p-4">
                {!hasThumbnail && hasLogo && (
                  <div className="flex items-center gap-4 mb-3">
                    <Avatar
                      src={row.logo || row.avatar || "/images/placeholder.png"}
                      alt={String(titleValue || "Logo")}
                      size={56}
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 text-base">
                        {titleColumn.renderCell
                          ? titleColumn.renderCell(titleValue, row)
                          : String(titleValue ?? "-")}
                      </span>
                      {status && (
                        <div className="mt-1">
                          <Badge variant={statusVariant(status)}>
                            {status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {hasThumbnail && (
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 block text-base line-clamp-1">
                      {titleColumn.renderCell
                        ? titleColumn.renderCell(titleValue, row)
                        : String(titleValue ?? "-")}
                    </span>
                    {row.location && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                        <MapPin className="h-3 w-3" /> {row.location}
                      </span>
                    )}
                    {row.price && (
                      <div className="mt-2 text-lg font-semibold text-primary dark:text-primary">
                        ${Number(row.price).toLocaleString()}
                      </div>
                    )}
                    {renderPropertySpecs()}
                  </div>
                )}
                {!hasThumbnail && !hasLogo && (
                  <div className="mb-3">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 block line-clamp-1 text-base">
                      {titleColumn.renderCell
                        ? titleColumn.renderCell(titleValue, row)
                        : String(titleValue ?? "-")}
                    </span>
                    {status && (
                      <div className="mt-1">
                        <Badge variant={statusVariant(status)}>{status}</Badge>
                      </div>
                    )}
                  </div>
                )}
                {agentMeta}
                {builderProjectMeta}
                {bodyCols.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bodyCols.map((col) => {
                      const rawValue = row[col.id];
                      if (
                        rawValue === undefined ||
                        rawValue === null ||
                        rawValue === ""
                      )
                        return null;
                      const content = col.renderCell
                        ? col.renderCell(rawValue, row)
                        : String(rawValue ?? "-");
                      return (
                        <div
                          key={col.id}
                          className="flex flex-col text-xs bg-gray-100/70 dark:bg-gray-700/40 rounded-md p-2"
                        >
                          <span className="text-[10px] font-semibold tracking-wide text-gray-600 dark:text-gray-300 uppercase">
                            {col.label}
                          </span>
                          <span className="mt-1 text-gray-800 dark:text-gray-100 leading-tight">
                            {content}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {visibleCount < filteredRows.length && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((c) => c + rowsPerBatch)}
            className="min-w-40"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default DataCards;
