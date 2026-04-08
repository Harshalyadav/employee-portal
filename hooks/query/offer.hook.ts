import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { offerService } from "@/service/offer.service";
import { OfferFilters } from "@/types/offer.type";

export const useInfiniteOffers = (
    filters?: OfferFilters & { limit?: number }
) => {
    return useInfiniteQuery({
        queryKey: ["offers", filters],
        queryFn: async ({ pageParam = 1 }) => {
            return await offerService.getOffers(
                pageParam,
                filters?.limit || 10,
                filters
            );
        },
        getNextPageParam: (lastPage) =>
            lastPage.hasNextPage ? lastPage.page + 1 : undefined,
        initialPageParam: 1,
    });
};

export const useOffer = (id: string) => {
    return useQuery({
        queryKey: ["offer", id],
        queryFn: () => offerService.getOfferById(id),
        enabled: !!id,
    });
};

export const useCreateOffer = () => {
    return useMutation({
        mutationFn: (data) => offerService.createOffer(data),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};

export const useUpdateOffer = () => {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            offerService.updateOffer(id, data),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};

export const useDeleteOffer = () => {
    return useMutation({
        mutationFn: (id: string) => offerService.deleteOffer(id),
        onSuccess: () => {
            // Invalidate cache if needed
        },
    });
};
