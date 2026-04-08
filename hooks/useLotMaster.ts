import { useState, useEffect, useCallback } from "react";
import {
    getAllLotMasters,
    getActiveLotMasters,
    getLotMasterById,
    createLotMaster,
    updateLotMaster,
    deleteLotMaster,
} from "@/service/lot-master.service";
import {
    LotMaster,
    LotMasterFilters,
    LotMastersResponse,
    CreateLotMasterDto,
    UpdateLotMasterDto,
} from "@/types/lot-master.type";

export function useLotMasters(initialFilters?: LotMasterFilters) {
    const [data, setData] = useState<LotMastersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [filters, setFilters] = useState<LotMasterFilters>(
        initialFilters || {}
    );

    const fetchLotMasters = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllLotMasters(filters);
            setData(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLotMasters();
    }, [fetchLotMasters]);

    const refetch = () => {
        fetchLotMasters();
    };

    const updateFilters = (newFilters: Partial<LotMasterFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    return {
        lotMasters: data?.data || [],
        total: data?.pagination?.total || 0,
        page: data?.pagination?.page || 1,
        limit: data?.pagination?.limit || 10,
        totalPages: data?.pagination?.pages || 1,
        loading,
        error,
        refetch,
        updateFilters,
        filters,
    };
}

export function useLotMaster(id: string) {
    const [lotMaster, setLotMaster] = useState<LotMaster | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchLotMaster = useCallback(async () => {
        if (id === "new") {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getLotMasterById(id);
            setLotMaster(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLotMaster();
    }, [fetchLotMaster]);

    const refetch = () => {
        fetchLotMaster();
    };

    return {
        lotMaster,
        loading,
        error,
        refetch,
    };
}

export function useActiveLotMasters() {
    const [activeLotMasters, setActiveLotMasters] = useState<LotMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchActiveLotMasters = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getActiveLotMasters();
            setActiveLotMasters(response.data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveLotMasters();
    }, [fetchActiveLotMasters]);

    const refetch = () => {
        fetchActiveLotMasters();
    };

    return {
        activeLotMasters,
        loading,
        error,
        refetch,
    };
}

export function useLotMasterMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const create = useCallback(
        async (data: CreateLotMasterDto) => {
            try {
                setLoading(true);
                setError(null);
                const result = await createLotMaster(data);
                return result;
            } catch (err) {
                const error = err as Error;
                setError(error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const update = useCallback(
        async (id: string, data: UpdateLotMasterDto) => {
            try {
                setLoading(true);
                setError(null);
                const result = await updateLotMaster(id, data);
                return result;
            } catch (err) {
                const error = err as Error;
                setError(error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const remove = useCallback(
        async (id: string) => {
            try {
                setLoading(true);
                setError(null);
                await deleteLotMaster(id);
            } catch (err) {
                const error = err as Error;
                setError(error);
                throw error;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return {
        create,
        update,
        remove,
        loading,
        error,
    };
}
