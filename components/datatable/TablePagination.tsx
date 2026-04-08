export const TablePagination = ({
  page,
  rowsPerPage,
  total,
  totalPages: providedTotalPages,
  onPageChange,
  onRowsPerPageChange,
  disabled = false,
}: {
  page: number;
  rowsPerPage: number;
  total: number;
  totalPages?: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
  disabled?: boolean;
}) => {
  const totalPages = providedTotalPages ?? Math.ceil(total / rowsPerPage);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3 sm:gap-4 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-200">
          Rows per page:
        </span>
        <select
          value={rowsPerPage}
          onChange={(e) => {
            onRowsPerPageChange(Number(e.target.value));
            onPageChange(1);
          }}
          disabled={disabled}
          className="border p-2 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || disabled}
          className="px-3 py-1 rounded-lg border bg-white dark:bg-gray-900 hover:bg-muted dark:hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
        >
          Prev
        </button>

        <span className="text-sm text-gray-700 dark:text-gray-200">
          Page <span className="font-semibold">{page}</span> of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || disabled}
          className="px-3 py-1 rounded-lg border bg-white dark:bg-gray-900 hover:bg-muted dark:hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
};
