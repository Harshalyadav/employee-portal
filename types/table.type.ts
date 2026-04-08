export interface Column {
    id: string;
    label: string;
    type?: string;
    align?: "left" | "center" | "right";
    sortable?: boolean;
    width?: string | number;
    renderCell?: (value: any, row: any) => React.ReactNode;
    renderHeader?: (label: string) => React.ReactNode;
}