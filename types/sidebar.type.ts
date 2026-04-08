
export enum ROLE_ENUM {
    ADMIN = "ADMIN",
    USER = "USER",
    GUEST = "GUEST",
}

export type MenuItemConfig = {
    id: string;
    label: string;
    translationKey?: string; // i18n key within 'nav' namespace
    icon?: React.ReactNode;
    path?: string;
    separator?: boolean;
    children?: MenuItemConfig[];
    roles?: ROLE_ENUM[];
    badge?: string | number;
    isMenuTitle?: boolean;
    module?: import('./role.type').ModuleNameEnum; // Module for permission checking
};

// ---- Component Props ----
export type SidebarHeaderProps = {
    children?: React.ReactNode;
    className?: string;
};

export type SidebarContentProps = {
    items: MenuItemConfig[];
    activePath?: string;
    userRoles?: ROLE_ENUM[]; // used to filter role-based items
    className?: string;
};

export type SidebarFooterProps = {
    children?: React.ReactNode;
    className?: string;
};

export type SidebarProps = {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    items?: MenuItemConfig[];
    activePath?: string;
    userRoles?: ROLE_ENUM[];
    className?: string;
    "aria-label"?: string;
};