const ROOT = '/';
const DASHBOARD = '/overview';
const AUTH = '/auth';
const LOGIN = '/auth/login';
const USER = '/users';
const EMPLOYEE = '/employees';
const RECIPE = '/recipe';
const FRANCHISE = '/franchise';
const BRANCH = '/branches';
const PAYROLL = '/payroll';
const ADVANCE = '/advances';
const LOT = '/lot-master';
const SPONSOR_COMPANY = '/sponsor-company';

const APP_ROUTE = {
    ROOT: {
        LABEL: 'Home',
        PATH: ROOT,
    },
    DASHBOARD: {
        LABEL: 'Dashboard',
        PATH: DASHBOARD,
    },
    AUTH: {
        LOGIN: {
            ID: 'login',
            LABEL: 'Login',
            PATH: LOGIN,
        },
    },

    USER: {
        ALL: {
            ID: 'allUser',
            LABEL: 'All Users',
            PATH: `${USER}`,
        },
        VIEW: {
            ID: 'viewUser',
            LABEL: 'View User',
            PATH: (id: string) => `${USER}/view/${id}`,
        },
        EDIT: {
            ID: 'editUser',
            LABEL: 'Edit User',
            PATH: (id: string) => `${USER}/edit/${id}`,
        },
        BRANCH_SWITCH_LOGS: {
            ID: 'userBranchSwitchLogs',
            LABEL: 'Branch Switch Logs',
            PATH: (id: string) => `${USER}/${id}/branch-switch-logs`,
        },
    },

    EMPLOYEE: {
        ALL: {
            ID: 'allEmployee',
            LABEL: 'All Employees',
            PATH: `${EMPLOYEE}`,
        },
        VIEW: {
            ID: 'viewEmployee',
            LABEL: 'View Employee',
            PATH: (id: string) => `${EMPLOYEE}/view/${id}`,
        },
        EDIT: {
            ID: 'editEmployee',
            LABEL: 'Edit Employee',
            PATH: (id: string) => `${EMPLOYEE}/edit/${id}`,
        },
    },


    LOT: {
        ALL: {
            ID: 'allLot',
            LABEL: 'All LOTs',
            PATH: `${LOT}`,
        },
        VIEW: {
            ID: 'viewLot',
            LABEL: 'View LOT',
            PATH: (id: string) => `${LOT}/view/${id}`,
        },
        EDIT: {
            ID: 'editLot',
            LABEL: 'Edit Employee',
            PATH: (id: string) => `${LOT}/edit/${id}`,
        },
        CREATE: {
            ID: 'createLot',
            LABEL: 'Create LOT',
            PATH: `${LOT}/new`,
        },
    },
    SPONSOR_COMPANY: {
        ALL: {
            ID: 'allSponsorCompany',
            LABEL: 'All Sponsor Companies',
            PATH: `${SPONSOR_COMPANY}`,
        },
        CREATE: {
            ID: 'createSponsorCompany',
            LABEL: 'Create Sponsor Company',
            PATH: `${SPONSOR_COMPANY}/new`,
        },
        EDIT: {
            ID: 'editSponsorCompany',
            LABEL: 'Edit Sponsor Company',
            PATH: (id: string) => `${SPONSOR_COMPANY}/${id}/edit`,
        },
    },
    RECIPE: {
        ALL: {
            ID: 'allRecipe',
            LABEL: 'All Recipes',
            PATH: `${RECIPE}`,
        },
        VIEW: {
            ID: 'viewRecipe',
            LABEL: 'View Recipe',
            PATH: (id: string) => `${RECIPE}/view/${id}`,
        },
        EDIT: {
            ID: 'editRecipe',
            LABEL: 'Edit Recipe',
            PATH: (id: string) => `${RECIPE}/edit/${id}`,
        },
    },

    FRANCHISE: {
        ALL: {
            ID: 'allFranchise',
            LABEL: 'All Franchises',
            PATH: `${FRANCHISE}`,
        },
        VIEW: {
            ID: 'viewFranchise',
            LABEL: 'View Franchise',
            PATH: (id: string) => `${FRANCHISE}/view/${id}`,
        },
        EDIT: {
            ID: 'editFranchise',
            LABEL: 'Edit Franchise',
            PATH: (id: string) => `${FRANCHISE}/edit/${id}`,
        },
    },
    RAW_MATERIALS: {
        ALL: {
            ID: 'allRawMaterials',
            LABEL: 'All Raw Materials',
            PATH: `/raw-materials`,
        },
        VIEW: {
            ID: 'viewRawMaterial',
            LABEL: 'View Raw Material',
            PATH: (id: string) => `/raw-materials/view/${id}`,
        },
        EDIT: {
            ID: 'editRawMaterial',
            LABEL: 'Edit Raw Material',
            PATH: (id: string) => `/raw-materials/edit/${id}`,
        },
    },
    ROLE: {
        ALL: {
            ID: 'allRole',
            LABEL: 'All Roles',
            PATH: `/roles`,
        },
        VIEW: {
            ID: 'viewRole',
            LABEL: 'View Role',
            PATH: (id: string) => `/role/view/${id}`,
        },
        EDIT: {
            ID: 'editRole',
            LABEL: 'Edit Role',
            PATH: (id: string) => `/role/edit/${id}`,
        },
    },
    BRANCH: {
        ALL: {
            ID: 'allBranches',
            LABEL: 'All Branches',
            PATH: `${BRANCH}`,
        },
        NEW: {
            ID: 'newBranch',
            LABEL: 'New Branch',
            PATH: `${BRANCH}/new`,
        },
        VIEW: {
            ID: 'viewBranch',
            LABEL: 'View Branch',
            PATH: (id: string) => `${BRANCH}/${id}`,
        },
        EDIT: {
            ID: 'editBranch',
            LABEL: 'Edit Branch',
            PATH: (id: string) => `${BRANCH}/${id}`,
        },
    },
    PAYROLL: {
        ALL: {
            ID: 'allPayrolls',
            LABEL: 'All Payrolls',
            PATH: `${PAYROLL}`,
        },
        CREATE: {
            ID: 'createPayroll',
            LABEL: 'Create Payroll',
            PATH: `${PAYROLL}/bulk-create`,
        },
        BULK_CREATE: {
            ID: 'bulkCreatePayroll',
            LABEL: 'Bulk Create Payroll',
            PATH: `${PAYROLL}/bulk-create`,
        },
        VIEW: {
            ID: 'viewPayroll',
            LABEL: 'View Payroll',
            PATH: (id: string) => `${PAYROLL}/${id}`,
        },
        EDIT: {
            ID: 'editPayroll',
            LABEL: 'Edit Payroll',
            PATH: (id: string) => `${PAYROLL}/${id}`,
        },
    },

    ADVANCE: {
        ALL: {
            ID: 'allAdvances',
            LABEL: 'Advance',
            PATH: `${ADVANCE}`,
        },
        CREATE: {
            ID: 'createAdvance',
            LABEL: 'Create Advance',
            PATH: `${ADVANCE}/new`,
        },
        VIEW: {
            ID: 'viewAdvance',
            LABEL: 'View Advance',
            PATH: (id: string) => `${ADVANCE}/${id}`,
        },
    },

    USERS: {
        LIST: '/users',
    },
};

export { APP_ROUTE };
