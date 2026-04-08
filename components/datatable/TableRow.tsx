"use client";

import { Column } from "@/types";

export const TableRow = ({
  row,
  columns,
  onRowClick,
}: {
  row: any;
  columns: Column[];
  onRowClick?: (row: any) => void;
}) => {
  return (
    <tr
      className={`hover:bg-gray-50 dark:hover:bg-gray-900 transition ${
        onRowClick ? "cursor-pointer" : ""
      }`}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
    >
      {columns.map((col) => (
        <td
          key={col.id}
          className={`px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200 dark:border-gray-700 text-${
            col.align ?? "left"
          } text-sm sm:text-base text-gray-800 dark:text-gray-100`}
        >
          {col.renderCell ? col.renderCell(row[col.id], row) : row[col.id]}
        </td>
      ))}
    </tr>
  );
};
