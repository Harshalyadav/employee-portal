export interface Warehouse {
    id: string;
    name: string;
    code: string;
    location: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    manager: string;
    contact: string;
    email: string;
    phone: string;
    capacity: string;
    utilization: string;
    status: "Active" | "Inactive";
    createdAt: string;
    updatedAt?: string;
}

export interface WarehouseFormData {
    name: string;
    code: string;
    location: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    manager: string;
    contact: string;
    email: string;
    phone: string;
    capacity: string;
    utilization: string;
    status: "Active" | "Inactive";
}
