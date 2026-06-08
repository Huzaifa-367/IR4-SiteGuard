export type Permission = {
    name: string;
    label: string;
};

export type PermissionGroup = {
    key: string;
    label: string;
    description: string;
    permissions: Permission[];
};

export type RoleUserPreview = {
    id: number;
    name: string;
};

export type Role = {
    id: number;
    name: string;
    description: string | null;
    permissions: string[];
    users_count: number;
    permissions_count: number;
    is_system: boolean;
    users_preview: RoleUserPreview[];
};

export type RoleSummary = {
    id: number;
    name: string;
    description: string | null;
};

export type UserWithRoles = {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
};
