import { Column } from "@/types";

export const TableHeader = ({ columns }: { columns: Column[] }) => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
      <tr>
        {columns.map((col) => (
          <th
            key={col.id}
            className={`px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm text-gray-700 dark:text-gray-200 border-b-2 border-gray-200 dark:border-gray-700 text-${
              col.align ?? "left"
            } whitespace-nowrap`}
            style={{ width: col.width }}
          >
            {col.renderHeader ? col.renderHeader(col.label) : col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
};
