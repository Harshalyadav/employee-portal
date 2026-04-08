import { User, UserFilters, UsersResponse } from "@/types/user.type";

class UserService {
    private baseUrl = "/api/users";

    async getUsers(filters?: UserFilters): Promise<UsersResponse> {
        const params = new URLSearchParams();

        if (filters?.search) params.append("search", filters.search);
        if (filters?.role) params.append("role", filters.role);
        // if (filters?.status) params.append("status", filters.status);
        if (filters?.page) params.append("page", filters.page.toString());
        if (filters?.limit) params.append("limit", filters.limit.toString());

        const response = await fetch(`${this.baseUrl}?${params.toString()}`);

        if (!response.ok) {
            throw new Error("Failed to fetch users");
        }

        const body = await response.json();
        const payload: any = body?.data ?? body;
        const users = payload?.data ?? payload?.users ?? payload?.items ?? payload ?? [];
        const meta = payload?.meta ?? payload?.pagination ?? body?.meta;

        return {
            success: body?.success ?? true,
            message: body?.message ?? "Users fetched successfully",
            data: Array.isArray(users) ? users : [],
            statusCode: body?.statusCode,
            pagination: meta,
        };
    }

    async getUserById(id: string): Promise<User> {
        const response = await fetch(`${this.baseUrl}/${id}`);

        if (!response.ok) {
            throw new Error("Failed to fetch user");
        }

        const body = await response.json();
        const payload: any = body?.data ?? body;
        return payload?.data ?? payload;
    }

    async createUser(userData: Partial<User>): Promise<User> {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Failed to create user");
        }

        const body = await response.json();
        const payload: any = body?.data ?? body;
        return payload?.data ?? payload;
    }

    async updateUser(id: string, userData: Partial<User>): Promise<User> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error("Failed to update user");
        }

        const body = await response.json();
        const payload: any = body?.data ?? body;
        return payload?.data ?? payload;
    }

    async deleteUser(id: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete user");
        }
    }
}

export const userService = new UserService();
