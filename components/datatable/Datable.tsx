"use client";
import { useMemo, useState } from "react";

import { Column } from "@/types";
import { TableFilter } from "./TableFilter";
import { TableHeader } from "./TableHeader";
import { TablePagination } from "./TablePagination";
import { TableRow } from "./TableRow";

interface DataTableProps {
  columns: Column[];
  rows: any[];
  // Server-side pagination props (for infinite query)
  serverSide?: boolean;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (limit: number) => void;
  onSearchChange?: (search: string) => void;
  isLoading?: boolean;
  onRowClick?: (row: any) => void;
  /** Extra content rendered to the right of the search box (e.g. filter dropdown) */
  filterSlot?: React.ReactNode;
}

export const DataTable = ({
  columns,
  rows,
  serverSide = false,
  meta,
  onPageChange,
  onRowsPerPageChange,
  onSearchChange,
  isLoading = false,
  onRowClick,
  filterSlot,
}: DataTableProps) => {
  // Local state (used only for client-side mode)
  const [localFilter, setLocalFilter] = useState("");
  const [localPage, setLocalPage] = useState(1);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10);

  // Determine which mode we're in
  const isServerSide = serverSide && meta && onPageChange;

  // Client-side filtering and pagination
  const filteredRows = useMemo(() => {
    if (isServerSide) return rows; // Server handles filtering
    if (!localFilter) return rows;

    const filterStr = localFilter.toLowerCase();

    return rows.filter((row) => {
      const visited = new Set<any>();

      const searchRecursively = (obj: any): boolean => {
        if (obj === null || obj === undefined) return false;
        if (typeof obj === "object") {
          if (visited.has(obj)) return false;
          visited.add(obj);
          return Object.values(obj).some((val) => searchRecursively(val));
        }
        return String(obj).toLowerCase().includes(filterStr);
      };

      return searchRecursively(row);
    });
  }, [localFilter, rows, isServerSide]);

  const paginated = useMemo(() => {
    if (isServerSide) return rows; // Server handles pagination
    const start = (localPage - 1) * localRowsPerPage;
    return filteredRows.slice(start, start + localRowsPerPage);
  }, [localPage, localRowsPerPage, filteredRows, rows, isServerSide]);

  const handleFilterChange = (value: string) => {
    if (isServerSide && onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalFilter(value);
      setLocalPage(1); // Reset to first page on filter change
    }
  };

  const handlePageChange = (page: number) => {
    if (isServerSide && onPageChange) {
      onPageChange(page);
    } else {
      setLocalPage(page);
    }
  };

  const handleRowsPerPageChange = (limit: number) => {
    if (isServerSide && onRowsPerPageChange) {
      onRowsPerPageChange(limit);
      onPageChange?.(1); // Reset to first page
    } else {
      setLocalRowsPerPage(limit);
      setLocalPage(1);
    }
  };

  // Pagination values
  const currentPage = isServerSide ? meta!.page : localPage;
  const currentRowsPerPage = isServerSide ? meta!.limit : localRowsPerPage;
  const totalItems = isServerSide ? meta!.total : filteredRows.length;

  return (
    <div className="w-full max-w-full overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-none p-2 sm:p-4">
      <TableFilter
        value={isServerSide ? "" : localFilter}
        onChange={handleFilterChange}
        dataCount={meta?.total}
        endSlot={filterSlot}
      // disabled={isLoading}
      />

      <table className="w-full border-collapse min-w-[600px]">
        <TableHeader columns={columns} />
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary\"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading...
                  </span>
                </div>
              </td>
            </tr>
          ) : paginated.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                No data found
              </td>
            </tr>
          ) : (
            paginated.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                row={row}
                columns={columns}
                onRowClick={onRowClick}
              />
            ))
          )}
        </tbody>
      </table>

      <TablePagination
        page={currentPage}
        rowsPerPage={currentRowsPerPage}
        total={totalItems}
        totalPages={isServerSide ? meta!.totalPages : undefined}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        disabled={isLoading}
      />
    </div>
  );
};
