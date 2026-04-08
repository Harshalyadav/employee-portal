"use client";

import { useEffect, useMemo } from "react";
import { offerColumns } from "@/config/datatable-config";
import { DataTable } from "../Datable";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingState } from "@/components/LoadingState";
import { useInfiniteOffers, useDeleteOffer } from "@/hooks/query/offer.hook";
import { Offer, OfferFilters } from "@/types/offer.type";

interface OfferTableProps {
  filters?: OfferFilters;
}

const OfferTable = ({ filters }: OfferTableProps) => {
  const {
    data: offersPages,
    isLoading,
    isError,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteOffers({ limit: 10, ...filters });

  const { mutate: deleteOffer } = useDeleteOffer();

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const offers = useMemo(() => {
    const raw = (offersPages?.pages || []).flatMap((p) => p?.offers ?? []);
    const map = new Map<string, Offer>();
    for (const o of raw) {
      const key = o?.id;
      if (key && !map.has(key)) {
        map.set(key, o);
      }
    }
    return Array.from(map.values());
  }, [offersPages]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      deleteOffer(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading offers..." />;
  }

  return (
    <>
      <ErrorAlert
        isOpen={isError}
        title="Error Loading Offers"
        message={error?.message || "Failed to load offers. Please try again."}
      />
      <div className="w-full max-w-full space-y-4">
        <div className="overflow-x-auto">
          <DataTable columns={offerColumns} rows={offers} />
        </div>

        {isFetchingNextPage && (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading more...
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default OfferTable;
