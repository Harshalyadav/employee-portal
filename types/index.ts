import { SidebarPosition } from "./layout.type";

export * from "./layout.type";
export * from "./sidebar.type";
export * from "./table.type";
export * from "./builder.type";
export { createBuilderSchema, type CreateBuilderSchema } from "./builder.type";
export * from "./common.type";
export * from "./property.type";
export { createPropertySchema, type CreatePropertySchema } from "./property.type";
export * from "./project.type";
export * from "./agent.type";
export { createAgentSchema, type CreateAgentSchema } from "./agent.type";
export * from "./bounty.type";
export * from "./auth.type";
export { loginSchema, type LoginSchema } from "./auth.type";
export * from "./inquiry.type";
export * from "./amenity.type";
export { createAmenitySchema, type CreateAmenitySchema } from "./amenity.type";
export * from "./upload.type";
export * from "./store.type";
export * from "./user.type";
export * from "./user-document.type";
export * from "./warehouse.type";
export * from "./raw-material.type";
export * from './permission.type';
export * from "./role.type";
export * from "./model.type";
export * from "./recipe.type";
export * from "./franchise.type"
export * from "./company.type";
export * from "./branch.type";
export * from "./payroll.type";
export * from "./advance-payroll.type";
export * from "./lot-master.type";
export * from "./branch-switch.type";
export * from "./dashboard.type";
export * from "./admin-head.type";
export * from "./sponsor-company.type";
export { createPermissionSchema, type CreatePermissionDto, type Permission, type PermissionFilters, type CreatePermissionError, type CreatePermissionResponse } from './permission.type';


export interface DashboardLayoutProps {
    sidebar: React.ReactNode;
    children: React.ReactNode;
    sidebarPosition?: SidebarPosition;
    className?: string;
    headerTitle?: string;
    headerChildren?: React.ReactNode;
    sidebarHeader?: React.ReactNode;
    showSearch?: boolean;
    userName?: string;
    userEmail?: string;
    userAvatar?: string;
}


export * from "./menu.type";