import offersDataJson from "@/data/offers.json";
import { Offer, OfferResponse, OfferFilters } from "@/types/offer.type";

const offersData = offersDataJson as { offers: Offer[] };

const normalizeOffer = (o: Offer): Offer => ({
    ...o,
    status: o.status as "Active" | "Inactive",
    type: o.type as "Flat" | "Percentage" | "Combo" | "Coupon",
    applicableScope: o.applicableScope as "Category" | "Franchise" | "Menu" | "Model",
});

class OfferService {
    async getOffers(
        page: number = 1,
        limit: number = 10,
        filters?: OfferFilters
    ): Promise<OfferResponse> {
        try {
            let filtered = [...offersData.offers];

            if (filters?.status) {
                filtered = filtered.filter((o) => o.status === filters.status);
            }

            if (filters?.type) {
                filtered = filtered.filter((o) => o.type === filters.type);
            }

            if (filters?.search) {
                filtered = filtered.filter(
                    (o) =>
                        o.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
                        o.description.toLowerCase().includes(filters.search!.toLowerCase())
                );
            }

            const start = (page - 1) * limit;
            const end = start + limit;
            const offers = filtered.slice(start, end).map(normalizeOffer);

            return {
                offers,
                total: filtered.length,
                page,
                limit,
                hasNextPage: end < filtered.length,
            };
        } catch (error) {
            console.error("Error fetching offers:", error);
            throw error;
        }
    }

    async getOfferById(id: string): Promise<Offer> {
        try {
            const offer = offersData.offers.find((o) => o.id === id);
            if (!offer) {
                throw new Error("Offer not found");
            }
            return normalizeOffer(offer);
        } catch (error) {
            console.error("Error fetching offer:", error);
            throw error;
        }
    }

    async createOffer(data: any): Promise<Offer> {
        const newOffer: Offer = normalizeOffer({
            id: `OFF${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString().split("T")[0],
        } as Offer);
        return newOffer;
    }

    async updateOffer(id: string, data: any): Promise<Offer> {
        try {
            const offer = offersData.offers.find((o) => o.id === id);
            if (!offer) {
                throw new Error("Offer not found");
            }
            return normalizeOffer({
                ...offer,
                ...data,
                updatedAt: new Date().toISOString().split("T")[0],
            } as Offer);
        } catch (error) {
            console.error("Error updating offer:", error);
            throw error;
        }
    }

    async deleteOffer(id: string): Promise<void> {
        try {
            const offer = offersData.offers.find((o) => o.id === id);
            if (!offer) {
                throw new Error("Offer not found");
            }
        } catch (error) {
            console.error("Error deleting offer:", error);
            throw error;
        }
    }
}

export const offerService = new OfferService();
