"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { companyColumns } from "@/config/datatable-config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components";
import {
  useInfiniteCompanies,
  useDeleteCompany,
} from "@/hooks/query/company.hook";
import { Company } from "@/types/company.type";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CompanyTableProps {
  limit?: number;
}

const CompanyTable = ({ limit = 10 }: CompanyTableProps) => {
  const router = useRouter();

  const {
    data: companyPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteCompanies({ limit });

  const { mutate: deleteCompany } = useDeleteCompany();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const companies = useMemo(() => {
    const raw = (companyPages?.pages || []).flatMap((p: any) => p?.data ?? []);
    const map = new Map<string, Company>();
    for (const c of raw) {
      const key = c?._id || c?.id;
      if (key && !map.has(key)) {
        map.set(key, c);
      }
    }
    return Array.from(map.values());
  }, [companyPages]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteCompany(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Companies</h2>
        <Button size="sm" onClick={() => router.push("/companies/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </div>

      {isError && (
        <ErrorAlert
          isOpen={true}
          message={error?.message || "An error occurred"}
        />
      )}

      <div className="overflow-x-auto">
        <DataTable columns={companyColumns} rows={companies} />
      </div>

      {isFetchingNextPage && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Loading more...
        </div>
      )}
    </div>
  );
};

export default CompanyTable;
