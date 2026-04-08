import { useState, useEffect, useCallback } from "react";
import { userService } from "@/services/userService";
import { User, UserFilters, UsersResponse } from "@/types/user.type";

export function useUsers(initialFilters?: UserFilters) {
    const [data, setData] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [filters, setFilters] = useState<UserFilters>(initialFilters || {});

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await userService.getUsers(filters);
            setData(response);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const refetch = () => {
        fetchUsers();
    };

    const updateFilters = (newFilters: Partial<UserFilters>) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    return {
        users: data?.data || [],
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

export function useUser(id: string) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUser = useCallback(async () => {
        if (id === "new") {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await userService.getUserById(id);
            setUser(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const refetch = () => {
        fetchUser();
    };

    return { user, loading, error, refetch };
}

export function useCreateUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createUser = async (userData: Partial<User>) => {
        try {
            setLoading(true);
            setError(null);
            const newUser = await userService.createUser(userData);
            return newUser;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { createUser, loading, error };
}

export function useUpdateUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const updateUser = async (id: string, userData: Partial<User>) => {
        try {
            setLoading(true);
            setError(null);
            const updatedUser = await userService.updateUser(id, userData);
            return updatedUser;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { updateUser, loading, error };
}

export function useDeleteUser() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const deleteUser = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await userService.deleteUser(id);
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { deleteUser, loading, error };
}
