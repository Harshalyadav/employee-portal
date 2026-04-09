const API_BASE = '/api';
const USER = `${API_BASE}/user`;
const USER_DOCUMENT = `${API_BASE}/user-documents`;
const UPLOAD = `${API_BASE}/upload`;
const PERMISSION = `${API_BASE}/permissions`;
const ROLE = `${API_BASE}/roles`;
const ADMIN_ROLE = `${API_BASE}/admin-roles`;
const ADMIN_HEAD = `${ADMIN_ROLE}/heads`;
const ADMIN_MANAGER = `${ADMIN_ROLE}/managers`;
const RAW_MATERIAL = `${API_BASE}/raw-materials`;
const RECIPE = `${API_BASE}/recipes`;
const RECIPE_SCALING_DRIVER = `${API_BASE}/recipe-scaling-drivers`;
const RECIPE_CATEGORY = `${API_BASE}/recipe-categories`;
const MENU = `${API_BASE}/menus`;
const MODEL = `${API_BASE}/models`;
const FRANCHISE = `${API_BASE}/franchises`;
const COMPANY = `${API_BASE}/companies`;
const COMPANY_DOCUMENT = `${API_BASE}/company-documents`;
const BRANCH = `${API_BASE}/branches`;
const PAYROLL = `${API_BASE}/payrolls`;
const LOT = `${API_BASE}/lots`;
const ADVANCE = `${API_BASE}/advance-payrolls`;
const LOT_MASTER = `${API_BASE}/lot-master`;
const SPONSOR_COMPANY = `${API_BASE}/sponsor-company`;
const BRANCH_SWITCH_LOG = `${API_BASE}/branch-switch-log`;
const BRANCH_TRANSFER_REQUEST = `${API_BASE}/branch-transfer-request`;
const EMAIL_CAMPAIGN = `${API_BASE}/email-campaigns`;
const DASHBOARD = `${API_BASE}/dashboard`;

const API_ROUTE: any = {


    USER: {
        ALL: {
            ID: 'getAllUsers',
            LABEL: 'Get All Users',
            METHOD: 'GET',
            PATH: `${USER}`,
        },
        BY_COMPANY: {
            ID: 'getUsersByCompany',
            LABEL: 'Get Users by Company',
            METHOD: 'GET',
            PATH: (companyId: string) => `${USER}/company/${companyId}`,
        },
        BY_BRANCH: {
            ID: 'getUsersByBranch',
            LABEL: 'Get Users by Branch',
            METHOD: 'GET',
            PATH: (branchId: string) => `${USER}/branch/${branchId}`,
        },
        VIEW: {
            ID: 'getUserById',
            LABEL: 'Get User Details',
            METHOD: 'GET',
            PATH: (id: string) => `${USER}/${id}`,
        },
        CREATE: {
            ID: 'createUser',
            LABEL: 'Create User',
            METHOD: 'POST',
            PATH: `${USER}`,
        },
        UPDATE: {
            ID: 'updateUser',
            LABEL: 'Update User',
            METHOD: 'PATCH',
            PATH: (id: string) => `${USER}/${id}`,
        },
        DELETE: {
            ID: 'deleteUser',
            LABEL: 'Delete User',
            METHOD: 'DELETE',
            PATH: (id: string) => `${USER}/${id}`,
        },
        BULK_IMPORT: {
            ID: 'bulkImportUsers',
            LABEL: 'Bulk Import Users',
            METHOD: 'POST',
            PATH: `${USER}/bulk-import`,
        },
        PROFILE: {
            ID: 'getUserProfile',
            LABEL: 'Get User Profile',
            METHOD: 'GET',
            PATH: `/api/auth/profile`,
        },
        // Multi-step user creation
        STEP1_PERSONAL: {
            CREATE: {
                ID: 'createPersonalInfo',
                LABEL: 'Create Personal Info (Step 1)',
                METHOD: 'POST',
                PATH: `${USER}/step1/personal-info`,
            },
            GET: {
                ID: 'getPersonalInfo',
                LABEL: 'Get Personal Info (Step 1)',
                METHOD: 'GET',
                PATH: (id: string) => `${USER}/step1/personal-info/${id}`,
            },
            UPDATE: {
                ID: 'updatePersonalInfo',
                LABEL: 'Update Personal Info (Step 1)',
                METHOD: 'PATCH',
                PATH: (id: string) => `${USER}/step1/personal-info/${id}`,
            },
        },
        STEP2_CONTACT: {
            GET: {
                ID: 'getContactInfo',
                LABEL: 'Get Contact Info (Step 2)',
                METHOD: 'GET',
                PATH: (id: string) => `${USER}/step2/contact-info/${id}`,
            },
            UPDATE: {
                ID: 'updateContactInfo',
                LABEL: 'Update Contact Info (Step 2)',
                METHOD: 'PATCH',
                PATH: `${USER}/step2/contact-info`,
            },
        },
        STEP3_EMPLOYMENT: {
            GET: {
                ID: 'getEmploymentInfo',
                LABEL: 'Get Employment Info (Step 3)',
                METHOD: 'GET',
                PATH: (id: string) => `${USER}/step3/employment-info/${id}`,
            },
            UPDATE: {
                ID: 'updateEmploymentInfo',
                LABEL: 'Update Employment Info (Step 3)',
                METHOD: 'PATCH',
                PATH: `${USER}/step3/employment-info`,
            },
        },
        STEP4_DOCUMENT: {
            GET: {
                ID: 'getDocumentInfo',
                LABEL: 'Get Document Info (Step 4)',
                METHOD: 'GET',
                PATH: (id: string) => `${USER}/step4/document-info/${id}`,
            },
            UPDATE: {
                ID: 'updateDocumentUpload',
                LABEL: 'Update Document Upload (Step 4)',
                METHOD: 'PATCH',
                PATH: `${USER}/step4/document-upload`,
            },
        },
        STEP5_REVIEW: {
            GET: {
                ID: 'getCompleteInfo',
                LABEL: 'Get Complete User Info (Step 5)',
                METHOD: 'GET',
                PATH: (id: string) => `${USER}/step5/complete-info/${id}`,
            },
            UPDATE: {
                ID: 'updateReviewSubmit',
                LABEL: 'Update Review Submit (Step 5)',
                METHOD: 'PATCH',
                PATH: `${USER}/step5/review-submit`,
            },
        },
        PERMISSIONS: {
            UPDATE: {
                ID: 'updatePermissions',
                LABEL: 'Update User Permissions (Step 6)',
                METHOD: 'PATCH',
                PATH: `${USER}/step6/permissions`,
            },
        },
    },

    ADMIN_HEAD: {
        ALL: {
            ID: 'getAllAdminHeads',
            LABEL: 'Get All Admin Heads',
            METHOD: 'GET',
            PATH: `${ADMIN_HEAD}`,
        },
        VIEW: {
            ID: 'getAdminHeadById',
            LABEL: 'Get Admin Head Details',
            METHOD: 'GET',
            PATH: (id: string) => `${ADMIN_HEAD}/${id}`,
        },
        CREATE: {
            ID: 'createAdminHead',
            LABEL: 'Create Admin Head',
            METHOD: 'POST',
            PATH: (headRole: string) => `${ADMIN_HEAD}/${headRole}`,
        },
        UPDATE: {
            ID: 'updateAdminHead',
            LABEL: 'Update Admin Head',
            METHOD: 'PATCH',
            PATH: (id: string) => `${ADMIN_HEAD}/${id}`,
        },
        DELETE: {
            ID: 'deleteAdminHead',
            LABEL: 'Delete Admin Head',
            METHOD: 'DELETE',
            PATH: (id: string) => `${ADMIN_HEAD}/${id}`,
        },
        MANAGERS: {
            ID: 'getAllAdminManagers',
            LABEL: 'Get All Admin Managers',
            METHOD: 'GET',
            PATH: `${ADMIN_MANAGER}`,
        },
        MY_CREATED_MANAGERS: {
            ID: 'getMyCreatedManagers',
            LABEL: 'Get Managers Created By Current Head',
            METHOD: 'GET',
            PATH: `${ADMIN_ROLE}/my-created/managers`,
        },
        CREATE_MANAGER: {
            ID: 'createManagerByHead',
            LABEL: 'Create Manager By Head',
            METHOD: 'POST',
            PATH: (managerRole: string) => `${ADMIN_MANAGER}/${managerRole}`,
        },
        UPDATE_MANAGER: {
            ID: 'updateAdminManager',
            LABEL: 'Update Admin Manager',
            METHOD: 'PATCH',
            PATH: (id: string) => `${ADMIN_MANAGER}/${id}`,
        },
        DELETE_MANAGER: {
            ID: 'deleteAdminManager',
            LABEL: 'Delete Admin Manager',
            METHOD: 'DELETE',
            PATH: (id: string) => `${ADMIN_MANAGER}/${id}`,
        },
    },

    USER_DOCUMENT: {
        ALL: {
            ID: 'getAllUserDocuments',
            LABEL: 'Get All User Documents',
            METHOD: 'GET',
            PATH: (userId: string) => `${USER_DOCUMENT}/user/${userId}`,
        },
        ALL_DOCUMENTS: {
            ID: 'getAllDocuments',
            LABEL: 'Get All Documents (Visa Manager)',
            METHOD: 'GET',
            PATH: `${USER_DOCUMENT}`,
        },
        VIEW: {
            ID: 'getUserDocumentById',
            LABEL: 'Get User Document Details',
            METHOD: 'GET',
            PATH: (id: string) => `${USER_DOCUMENT}/${id}`,
        },
        CREATE: {
            ID: 'createUserDocument',
            LABEL: 'Create User Document',
            METHOD: 'POST',
            PATH: `${USER_DOCUMENT}`,
        },
        UPDATE: {
            ID: 'updateUserDocument',
            LABEL: 'Update User Document',
            METHOD: 'PUT',
            PATH: (id: string) => `${USER_DOCUMENT}/${id}`,
        },
        VERIFY: {
            ID: 'verifyUserDocument',
            LABEL: 'Verify User Document',
            METHOD: 'PATCH',
            PATH: (id: string) => `${USER_DOCUMENT}/${id}/verify`,
        },
        REJECT: {
            ID: 'rejectUserDocument',
            LABEL: 'Reject User Document',
            METHOD: 'PATCH',
            PATH: (id: string) => `${USER_DOCUMENT}/${id}/reject`,
        },
        DELETE: {
            ID: 'deleteUserDocument',
            LABEL: 'Delete User Document',
            METHOD: 'DELETE',
            PATH: (id: string) => `${USER_DOCUMENT}/${id}`,
        },
    },


    S3: {
        UPLOAD_SINGLE_IMG: {
            ID: 'uploadSingleImage',
            LABEL: 'Upload Single Image',
            METHOD: 'POST',
            PATH: `${UPLOAD}/single`,
        },
        UPLOAD_SINGLE_VIDEO: {
            ID: 'uploadSingleVideo',
            LABEL: 'Upload Single Video',
            METHOD: 'POST',
            PATH: `${UPLOAD}/single`,
        },

        UPLOAD_SINGLE_DOCUMENT: {
            ID: 'uploadSingleDocument',
            LABEL: 'Upload Single Document',
            METHOD: 'POST',
            PATH: `${UPLOAD}/single`,
        },

        UPLOAD_MULTIPLE: {
            ID: 'uploadMultipleFiles',
            LABEL: 'Upload Multiple Files',
            METHOD: 'POST',
            PATH: `${UPLOAD}/multiple`,
        },

        LIST_FILES: {
            ID: 'listFiles',
            LABEL: 'List Files',
            METHOD: 'GET',
            PATH: `${UPLOAD}/list`,
        },

        GET_FILE_URL: {
            ID: 'getFileUrl',
            LABEL: 'Get File URL',
            METHOD: 'GET',
            PATH: (filename: string) => `${UPLOAD}/${encodeURIComponent(filename)}/url`,
        },

        GET_FILE_METADATA: {
            ID: 'getFileMetadata',
            LABEL: 'Get File Metadata',
            METHOD: 'GET',
            PATH: (filename: string) => `${UPLOAD}/${encodeURIComponent(filename)}/metadata`,
        },

        DELETE_FILE: {
            ID: 'deleteFile',
            LABEL: 'Delete File',
            METHOD: 'DELETE',
            PATH: (filename: string) => `${UPLOAD}/${encodeURIComponent(filename)}`,
        },
    },

    PERMISSION: {
        ALL: {
            ID: 'getAllPermissions',
            LABEL: 'Get All Permissions',
            METHOD: 'GET',
            PATH: `${PERMISSION}`,
        },
        VIEW: {
            ID: 'getPermissionById',
            LABEL: 'Get Permission Details',
            METHOD: 'GET',
            PATH: (id: string) => `${PERMISSION}/${id}`,
        },
        CREATE: {
            ID: 'createPermission',
            LABEL: 'Create Permission',
            METHOD: 'POST',
            PATH: `${PERMISSION}`,
        },
        UPDATE: {
            ID: 'updatePermission',
            LABEL: 'Update Permission',
            METHOD: 'PUT',
            PATH: (id: string) => `${PERMISSION}/${id}`,
        },
        DELETE: {
            ID: 'deletePermission',
            LABEL: 'Delete Permission',
            METHOD: 'DELETE',
            PATH: (id: string) => `${PERMISSION}/${id}`,
        },
    },

    ROLE: {
        ALL: {
            ID: 'getAllRoles',
            LABEL: 'Get All Roles',
            METHOD: 'GET',
            PATH: `${ROLE}`,
        },
        ASSIGNABLE: {
            ID: 'getAssignableRoles',
            LABEL: 'Get Assignable Roles (for Permission tab)',
            METHOD: 'GET',
            PATH: `${ROLE}/assignable`,
        },
        VIEW: {
            ID: 'getRoleById',
            LABEL: 'Get Role Details',
            METHOD: 'GET',
            PATH: (id: string) => `${ROLE}/${id}`,
        },
        BY_NAME: {
            ID: 'getRoleByName',
            LABEL: 'Get Role by Name',
            METHOD: 'GET',
            PATH: (roleName: string) => `${ROLE}/name/${roleName}`,
        },
        BY_TYPE: {
            ID: 'getRolesByType',
            LABEL: 'Get Roles by Type',
            METHOD: 'GET',
            PATH: (roleType: string) => `${ROLE}/role-type/${roleType}`,
        },
        MODULE_PERMISSIONS: {
            ID: 'getModulePermissions',
            LABEL: 'Get Module Permissions',
            METHOD: 'GET',
            PATH: (id: string, moduleName: string) => `${ROLE}/${id}/permissions/${moduleName}`,
        },
        CREATE: {
            ID: 'createRole',
            LABEL: 'Create Role',
            METHOD: 'POST',
            PATH: `${ROLE}`,
        },
        UPDATE: {
            ID: 'updateRole',
            LABEL: 'Update Role',
            METHOD: 'PUT',
            PATH: (id: string) => `${ROLE}/${id}`,
        },
        UPDATE_MODULE_PERMISSIONS: {
            ID: 'updateModulePermissions',
            LABEL: 'Update Module Permissions',
            METHOD: 'PUT',
            PATH: (id: string, moduleName: string) => `${ROLE}/${id}/permissions/${moduleName}`,
        },
        DELETE: {
            ID: 'deleteRole',
            LABEL: 'Delete Role',
            METHOD: 'DELETE',
            PATH: (id: string) => `${ROLE}/${id}`,
        },
    },
    RECIPE: {
        ALL: {
            ID: 'getAllRecipes',
            LABEL: 'Get All Recipes',
            METHOD: 'GET',
            PATH: `${RECIPE}`,
        },
        VIEW: {
            ID: 'getRecipeById',
            LABEL: 'Get Recipe Details',
            METHOD: 'GET',
            PATH: (id: string) => `${RECIPE}/${id}`,
        },
        CREATE: {
            ID: 'createRecipe',
            LABEL: 'Create Recipe',
            METHOD: 'POST',
            PATH: `${RECIPE}`,
        },
        UPDATE: {
            ID: 'updateRecipe',
            LABEL: 'Update Recipe',
            METHOD: 'PUT',
            PATH: (id: string) => `${RECIPE}/${id}`,
        },
        DELETE: {
            ID: 'deleteRecipe',
            LABEL: 'Delete Recipe',
            METHOD: 'DELETE',
            PATH: (id: string) => `${RECIPE}/${id}`,
        },
    },
    RECIPE_SCALING_DRIVER: {
        ALL: {
            ID: 'getAllRecipeScalingDrivers',
            LABEL: 'Get All Recipe Scaling Drivers',
            METHOD: 'GET',
            PATH: `${RECIPE_SCALING_DRIVER}`,
        },
        VIEW: {
            ID: 'getRecipeScalingDriverById',
            LABEL: 'Get Recipe Scaling Driver Details',
            METHOD: 'GET',
            PATH: (id: string) => `${RECIPE_SCALING_DRIVER}/${id}`,
        },
        CREATE: {
            ID: 'createRecipeScalingDriver',
            LABEL: 'Create Recipe Scaling Driver',
            METHOD: 'POST',
            PATH: `${RECIPE_SCALING_DRIVER}`,
        },
        UPDATE: {
            ID: 'updateRecipeScalingDriver',
            LABEL: 'Update Recipe Scaling Driver',
            METHOD: 'PUT',
            PATH: (id: string) => `${RECIPE_SCALING_DRIVER}/${id}`,
        },
        DELETE: {
            ID: 'deleteRecipeScalingDriver',
            LABEL: 'Delete Recipe Scaling Driver',
            METHOD: 'DELETE',
            PATH: (id: string) => `${RECIPE_SCALING_DRIVER}/${id}`,
        },
    },
    RECIPE_CATEGORY: {
        ALL: {
            ID: 'getAllRecipeCategories',
            LABEL: 'Get All Recipe Categories',
            METHOD: 'GET',
            PATH: `${RECIPE_CATEGORY}`,
        },
        VIEW: {
            ID: 'getRecipeCategoryById',
            LABEL: 'Get Recipe Category Details',
            METHOD: 'GET',
            PATH: (id: string) => `${RECIPE_CATEGORY}/${id}`,
        },
        CREATE: {
            ID: 'createRecipeCategory',
            LABEL: 'Create Recipe Category',
            METHOD: 'POST',
            PATH: `${RECIPE_CATEGORY}`,
        },
        UPDATE: {
            ID: 'updateRecipeCategory',
            LABEL: 'Update Recipe Category',
            METHOD: 'PUT',
            PATH: (id: string) => `${RECIPE_CATEGORY}/${id}`,
        },
        DELETE: {
            ID: 'deleteRecipeCategory',
            LABEL: 'Delete Recipe Category',
            METHOD: 'DELETE',
            PATH: (id: string) => `${RECIPE_CATEGORY}/${id}`,
        },
    },
    RAW_MATERIAL: {
        ALL: {
            ID: 'getAllRawMaterials',
            LABEL: 'Get All Raw Materials',
            METHOD: 'GET',
            PATH: `${RAW_MATERIAL}`,
        },
        VIEW: {
            ID: 'getRawMaterialById',
            LABEL: 'Get Raw Material Details',
            METHOD: 'GET',
            PATH: (id: string) => `${RAW_MATERIAL}/${id}`,
        },
        CREATE: {
            ID: 'createRawMaterial',
            LABEL: 'Create Raw Material',
            METHOD: 'POST',
            PATH: `${RAW_MATERIAL}`,
        },
        UPDATE: {
            ID: 'updateRawMaterial',
            LABEL: 'Update Raw Material',
            METHOD: 'PUT',
            PATH: (id: string) => `${RAW_MATERIAL}/${id}`,
        },
        DELETE: {
            ID: 'deleteRawMaterial',
            LABEL: 'Delete Raw Material',
            METHOD: 'DELETE',
            PATH: (id: string) => `${RAW_MATERIAL}/${id}`,
        },
    },
    FRANCHISE: {
        ALL: {
            ID: 'getAllFranchises',
            LABEL: 'Get All Franchises',
            METHOD: 'GET',
            PATH: `${FRANCHISE}`,
        },
        VIEW: {
            ID: 'getFranchiseById',
            LABEL: 'Get Franchise Details',
            METHOD: 'GET',
            PATH: (id: string) => `${FRANCHISE}/${id}`,
        },
        CREATE: {
            ID: 'createFranchise',
            LABEL: 'Create Franchise',
            METHOD: 'POST',
            PATH: `${FRANCHISE}`,
        },
        UPDATE: {
            ID: 'updateFranchise',
            LABEL: 'Update Franchise',
            METHOD: 'PUT',
            PATH: (id: string) => `${FRANCHISE}/${id}`,
        },
        DELETE: {
            ID: 'deleteFranchise',
            LABEL: 'Delete Franchise',
            METHOD: 'DELETE',
            PATH: (id: string) => `${FRANCHISE}/${id}`,
        },
    },
    COMPANY: {
        ALL: {
            ID: 'getAllCompanies',
            LABEL: 'Get All Companies',
            METHOD: 'GET',
            PATH: `${COMPANY}`,
        },
        BY_STATUS: {
            ID: 'getCompaniesByStatus',
            LABEL: 'Get Companies By Status',
            METHOD: 'GET',
            PATH: (status: string) => `${COMPANY}/by-status/${status}`,
        },
        BY_NAME: {
            ID: 'getCompanyByName',
            LABEL: 'Get Company By Name',
            METHOD: 'GET',
            PATH: (legalName: string) => `${COMPANY}/by-name/${legalName}`,
        },
        VIEW: {
            ID: 'getCompanyById',
            LABEL: 'Get Company Details',
            METHOD: 'GET',
            PATH: (id: string) => `${COMPANY}/${id}`,
        },
        CREATE: {
            ID: 'createCompany',
            LABEL: 'Create Company',
            METHOD: 'POST',
            PATH: `${COMPANY}`,
        },
        UPDATE: {
            ID: 'updateCompany',
            LABEL: 'Update Company',
            METHOD: 'PUT',
            PATH: (id: string) => `${COMPANY}/${id}`,
        },
        DELETE: {
            ID: 'deleteCompany',
            LABEL: 'Delete Company',
            METHOD: 'DELETE',
            PATH: (id: string) => `${COMPANY}/${id}`,
        },
    },
    COMPANY_DOCUMENT: {
        ALL: {
            ID: 'getAllCompanyDocuments',
            LABEL: 'Get All Company Documents',
            METHOD: 'GET',
            PATH: `${COMPANY_DOCUMENT}`,
        },
        BY_COMPANY: {
            ID: 'getDocumentsByCompanyId',
            LABEL: 'Get Documents By Company',
            METHOD: 'GET',
            PATH: (companyId: string) => `${COMPANY_DOCUMENT}/company/${companyId}`,
        },
        LATEST_BY_TYPE: {
            ID: 'getLatestDocument',
            LABEL: 'Get Latest Document By Type',
            METHOD: 'GET',
            PATH: (companyId: string, documentType: string) => `${COMPANY_DOCUMENT}/company/${companyId}/latest/${documentType}`,
        },
        ALL_BY_TYPE: {
            ID: 'getAllDocumentsByType',
            LABEL: 'Get All Documents By Type',
            METHOD: 'GET',
            PATH: (companyId: string, documentType: string) => `${COMPANY_DOCUMENT}/company/${companyId}/type/${documentType}`,
        },
        BY_TYPE: {
            ID: 'getDocumentsByType',
            LABEL: 'Get Documents By Type',
            METHOD: 'GET',
            PATH: (documentType: string) => `${COMPANY_DOCUMENT}/type/${documentType}`,
        },
        BY_STATUS: {
            ID: 'getDocumentsByStatus',
            LABEL: 'Get Documents By Status',
            METHOD: 'GET',
            PATH: (status: string) => `${COMPANY_DOCUMENT}/status/${status}`,
        },
        EXPIRING: {
            ID: 'getExpiringDocuments',
            LABEL: 'Get Expiring Documents',
            METHOD: 'GET',
            PATH: `${COMPANY_DOCUMENT}/expiring/list`,
        },
        EXPIRED: {
            ID: 'getExpiredDocuments',
            LABEL: 'Get Expired Documents',
            METHOD: 'GET',
            PATH: `${COMPANY_DOCUMENT}/expired/list`,
        },
        VIEW: {
            ID: 'getDocumentById',
            LABEL: 'Get Document By ID',
            METHOD: 'GET',
            PATH: (id: string) => `${COMPANY_DOCUMENT}/${id}`,
        },
        CREATE: {
            ID: 'createCompanyDocument',
            LABEL: 'Create Company Document',
            METHOD: 'POST',
            PATH: `${COMPANY_DOCUMENT}`,
        },
        UPDATE: {
            ID: 'updateCompanyDocument',
            LABEL: 'Update Company Document',
            METHOD: 'PUT',
            PATH: (id: string) => `${COMPANY_DOCUMENT}/${id}`,
        },
        VERIFY: {
            ID: 'verifyCompanyDocument',
            LABEL: 'Verify Company Document',
            METHOD: 'POST',
            PATH: (id: string) => `${COMPANY_DOCUMENT}/${id}/verify`,
        },
        REJECT: {
            ID: 'rejectCompanyDocument',
            LABEL: 'Reject Company Document',
            METHOD: 'POST',
            PATH: (id: string) => `${COMPANY_DOCUMENT}/${id}/reject`,
        },
        DELETE: {
            ID: 'deleteCompanyDocument',
            LABEL: 'Delete Company Document',
            METHOD: 'DELETE',
            PATH: (id: string) => `${COMPANY_DOCUMENT}/${id}`,
        },
    },
    BRANCH: {
        ALL: {
            ID: 'getAllBranches',
            LABEL: 'Get All Branches',
            METHOD: 'GET',
            PATH: `${BRANCH}`,
        },
        BY_COMPANY: {
            ID: 'getBranchesByCompany',
            LABEL: 'Get Branches By Company',
            METHOD: 'GET',
            PATH: (companyId: string) => `${BRANCH}/company/${companyId}`,
        },
        BY_CODE: {
            ID: 'getBranchByCode',
            LABEL: 'Get Branch By Code',
            METHOD: 'GET',
            PATH: (branchCode: string) => `${BRANCH}/code/${branchCode}`,
        },
        BY_STATUS: {
            ID: 'getBranchesByStatus',
            LABEL: 'Get Branches By Status',
            METHOD: 'GET',
            PATH: (status: string) => `${BRANCH}/status/${status}`,
        },
        VIEW: {
            ID: 'getBranchById',
            LABEL: 'Get Branch Details',
            METHOD: 'GET',
            PATH: (id: string) => `${BRANCH}/${id}`,
        },
        CREATE: {
            ID: 'createBranch',
            LABEL: 'Create Branch',
            METHOD: 'POST',
            PATH: `${BRANCH}`,
        },
        UPDATE: {
            ID: 'updateBranch',
            LABEL: 'Update Branch',
            METHOD: 'PUT',
            PATH: (id: string) => `${BRANCH}/${id}`,
        },
        CLOSE: {
            ID: 'closeBranch',
            LABEL: 'Close Branch',
            METHOD: 'POST',
            PATH: (id: string) => `${BRANCH}/${id}/close`,
        },
        ACTIVATE: {
            ID: 'activateBranch',
            LABEL: 'Activate Branch',
            METHOD: 'POST',
            PATH: (id: string) => `${BRANCH}/${id}/activate`,
        },
        DELETE: {
            ID: 'deleteBranch',
            LABEL: 'Delete Branch',
            METHOD: 'DELETE',
            PATH: (id: string) => `${BRANCH}/${id}`,
        },
    },
    PAYROLL: {
        ALL: {
            ID: 'getAllPayrolls',
            LABEL: 'Get All Payrolls',
            METHOD: 'GET',
            PATH: `${PAYROLL}`,
        },
        BY_USER: {
            ID: 'getPayrollsByUser',
            LABEL: 'Get Payrolls by User',
            METHOD: 'GET',
            PATH: (userId: string) => `${PAYROLL}/user/${userId}`,
        },
        VIEW: {
            ID: 'getPayrollById',
            LABEL: 'Get Payroll Details',
            METHOD: 'GET',
            PATH: (id: string) => `${PAYROLL}/${id}`,
        },
        EXPORT: {
            ID: 'exportPayrollById',
            LABEL: 'Export Payroll Details',
            METHOD: 'GET',
            PATH: (id: string, format: 'pdf' | 'excel') => `${PAYROLL}/${id}/export?format=${format}`,
        },
        CREATE: {
            ID: 'createPayroll',
            LABEL: 'Create Payroll',
            METHOD: 'POST',
            PATH: `${PAYROLL}`,
        },
        BULK_CREATE: {
            ID: 'bulkCreatePayrolls',
            LABEL: 'Bulk Create Payrolls',
            METHOD: 'POST',
            PATH: `${PAYROLL}/bulk/lock`,
        },
        ADD_ITEMS: {
            ID: 'addItemsToPayroll',
            LABEL: 'Add items to existing payroll',
            METHOD: 'POST',
            PATH: (id: string) => `${PAYROLL}/${id}/items`,
        },
        LOCK_SELECTED_ITEMS: {
            ID: 'lockSelectedPayrollItems',
            LABEL: 'Lock selected payroll items',
            METHOD: 'PATCH',
            PATH: (id: string) => `${PAYROLL}/${id}/items/lock`,
        },

        BULK_MARK_AS_PAID: {
            ID: 'markAsPaidBulkPayrolls',
            LABEL: 'Mark As Paid Bulk Payrolls',
            METHOD: 'POST',
            PATH: `${PAYROLL}/bulk/paid`,
        },
        UPDATE_STATUS: {
            ID: 'updatePayrollStatus',
            LABEL: 'Update Payroll Status',
            METHOD: 'PATCH',
            PATH: (id: string) => `${PAYROLL}/${id}/status`,
        },
        UPDATE: {
            ID: 'updatePayrollMaster',
            LABEL: 'Update Payroll Master',
            METHOD: 'PATCH',
            PATH: (id: string) => `${PAYROLL}/${id}`,
        },
        DELETE: {
            ID: 'deletePayroll',
            LABEL: 'Delete Payroll',
            METHOD: 'DELETE',
            PATH: (id: string) => `${PAYROLL}/${id}`,
        },
        CREATE_LOT: {
            ID: 'createPayrollLot',
            LABEL: 'Create Payroll LOT',
            METHOD: 'POST',
            PATH: `${PAYROLL}/lots`,
        },
        AUTO_GENERATE_LOTS: {
            ID: 'autoGeneratePayrollLots',
            LABEL: 'Auto-Generate Payroll LOTs',
            METHOD: 'POST',
            PATH: `${LOT}/generate`,
        },
        ADD_TO_LOT: {
            ID: 'addPayrollToLot',
            LABEL: 'Add Payroll to LOT',
            METHOD: 'POST',
            PATH: `${PAYROLL}/lots/add-payroll`,
        },
        LOTS_ALL: {
            ID: 'getAllPayrollLots',
            LABEL: 'Get All Payroll LOTs',
            METHOD: 'GET',
            PATH: `${PAYROLL}/lots`,
        },
        LOT_DETAILS: {
            ID: 'getPayrollLotDetails',
            LABEL: 'Get Payroll LOT Details',
            METHOD: 'GET',
            PATH: (lotId: string) => `${PAYROLL}/lots/${lotId}`,
        },
        LOT_DETAILS_V2: {
            ID: 'getPayrollLotDetailsV2',
            LABEL: 'Get Payroll LOT Details (V2)',
            METHOD: 'GET',
            PATH: (lotId: string) => `${LOT}/${lotId}`,
        },
        DISBURSE_LOT: {
            ID: 'disbursePayrollLot',
            LABEL: 'Disburse Payroll LOT',
            METHOD: 'POST',
            PATH: (lotId: string) => `${PAYROLL}/lots/${lotId}/disburse`,
        },
        MARK_LOT_PAID: {
            ID: 'markPayrollLotPaid',
            LABEL: 'Mark Payroll LOT Paid',
            METHOD: 'PATCH',
            PATH: (lotId: string) => `${LOT}/${lotId}/mark-paid`,
        },
        MARK_LOT_EMPLOYEE_PAID: {
            ID: 'markPayrollLotEmployeePaid',
            LABEL: 'Mark Payroll LOT Employee Paid',
            METHOD: 'PATCH',
            PATH: (lotId: string, employeeId: string) => `${LOT}/${lotId}/employee/${employeeId}/mark-paid`,
        },
        ADD_EMPLOYEE_TO_LOT: {
            ID: 'addEmployeeToExistingLot',
            LABEL: 'Add Employee To Existing LOT',
            METHOD: 'POST',
            PATH: (lotId: string) => `${LOT}/${lotId}/employees`,
        },
        ADD_EMPLOYEE_TO_LOT_ALIAS: {
            ID: 'addEmployeeToExistingLotAlias',
            LABEL: 'Add Employee To Existing LOT Alias',
            METHOD: 'POST',
            PATH: (lotId: string) => `${LOT}/${lotId}/add-employee`,
        },
        ITEMS_BY_BRANCH: {
            ID: 'getPayrollItemsByBranch',
            LABEL: 'Get Payroll Items by Branch',
            METHOD: 'GET',
            PATH: (month: number, year: number, branchId: string) =>
                `${PAYROLL}/items/by-month-year-branch/${month}/${year}/${branchId}`,
        },
    },
    ADVANCE_PAYROLL: {
        ALL: {
            ID: 'getAllAdvances',
            LABEL: 'Get All Advances',
            METHOD: 'GET',
            PATH: `${ADVANCE}`,
        },
        BY_USER: {
            ID: 'getAdvancesByUser',
            LABEL: 'Get Advances by User',
            METHOD: 'GET',
            PATH: (userId: string) => `${ADVANCE}/user/${userId}`,
        },
        VIEW: {
            ID: 'getAdvanceById',
            LABEL: 'Get Advance Details',
            METHOD: 'GET',
            PATH: (id: string) => `${ADVANCE}/${id}`,
        },
        CREATE: {
            ID: 'createAdvance',
            LABEL: 'Create Advance',
            METHOD: 'POST',
            PATH: `${ADVANCE}`,
        },
        UPDATE_STATUS: {
            ID: 'updateAdvanceStatus',
            LABEL: 'Update Advance Status',
            METHOD: 'PATCH',
            PATH: (id: string) => `${ADVANCE}/${id}/status`,
        },
        UPDATE: {
            ID: 'updateAdvance',
            LABEL: 'Update Advance',
            METHOD: 'PATCH',
            PATH: (id: string) => `${ADVANCE}/${id}`,
        },
        DELETE: {
            ID: 'deleteAdvance',
            LABEL: 'Delete Advance',
            METHOD: 'DELETE',
            PATH: (id: string) => `${ADVANCE}/${id}`,
        },
    },
    MENU: {
        ALL: {
            ID: 'getAllMenus',
            LABEL: 'Get All Menus',
            METHOD: 'GET',
            PATH: `${MENU}`,
        },
        VIEW: {
            ID: 'getMenuById',
            LABEL: 'Get Menu Details',
            METHOD: 'GET',
            PATH: (id: string) => `${MENU}/${id}`,
        },
        CREATE: {
            ID: 'createMenu',
            LABEL: 'Create Menu',
            METHOD: 'POST',
            PATH: `${MENU}`,
        },
        UPDATE: {
            ID: 'updateMenu',
            LABEL: 'Update Menu',
            METHOD: 'PUT',
            PATH: (id: string) => `${MENU}/${id}`,
        },
        DELETE: {
            ID: 'deleteMenu',
            LABEL: 'Delete Menu',
            METHOD: 'DELETE',
            PATH: (id: string) => `${MENU}/${id}`,
        },
        BY_MODEL: {
            ID: 'getMenusByModel',
            LABEL: 'Get Menus by Model',
            METHOD: 'GET',
            PATH: (modelId: string) => `${MENU}/model/${modelId}`,
        },
        BY_FRANCHISE: {
            ID: 'getMenusByFranchise',
            LABEL: 'Get Menus by Franchise',
            METHOD: 'GET',
            PATH: (franchiseId: string) => `${MENU}/franchise/${franchiseId}`,
        },
    },
    MODEL: {
        ALL: {
            ID: 'getAllModels',
            LABEL: 'Get All Models',
            METHOD: 'GET',
            PATH: `${MODEL}`,
        },
        VIEW: {
            ID: 'getModelById',
            LABEL: 'Get Model Details',
            METHOD: 'GET',
            PATH: (id: string) => `${MODEL}/${id}`,
        },
        CREATE: {
            ID: 'createModel',
            LABEL: 'Create Model',
            METHOD: 'POST',
            PATH: `${MODEL}`,
        },
        UPDATE: {
            ID: 'updateModel',
            LABEL: 'Update Model',
            METHOD: 'PUT',
            PATH: (id: string) => `${MODEL}/${id}`,
        },
        DELETE: {
            ID: 'deleteModel',
            LABEL: 'Delete Model',
            METHOD: 'DELETE',
            PATH: (id: string) => `${MODEL}/${id}`,
        },
        BY_MODEL: {
            ID: 'getMenusByModel',
            LABEL: 'Get Menus by Model',
            METHOD: 'GET',
            PATH: (modelId: string) => `${MENU}/model/${modelId}`,
        },
        BY_FRANCHISE: {
            ID: 'getMenusByFranchise',
            LABEL: 'Get Menus by Franchise',
            METHOD: 'GET',
            PATH: (franchiseId: string) => `${MENU}/franchise/${franchiseId}`,
        },
    },
    LOT_MASTER: {
        ALL: {
            ID: 'getAllLotMasters',
            LABEL: 'Get All LOT Masters',
            METHOD: 'GET',
            PATH: `${LOT_MASTER}`,
        },
        ACTIVE: {
            ID: 'getActiveLotMasters',
            LABEL: 'Get Active LOT Masters',
            METHOD: 'GET',
            PATH: `${LOT_MASTER}/active`,
        },
        VIEW: {
            ID: 'getLotMasterById',
            LABEL: 'Get LOT Master Details',
            METHOD: 'GET',
            PATH: (id: string) => `${LOT_MASTER}/${id}`,
        },
        CREATE: {
            ID: 'createLotMaster',
            LABEL: 'Create LOT Master',
            METHOD: 'POST',
            PATH: `${LOT_MASTER}`,
        },
        UPDATE: {
            ID: 'updateLotMaster',
            LABEL: 'Update LOT Master',
            METHOD: 'PATCH',
            PATH: (id: string) => `${LOT_MASTER}/${id}`,
        },
        DELETE: {
            ID: 'deleteLotMaster',
            LABEL: 'Delete LOT Master',
            METHOD: 'DELETE',
            PATH: (id: string) => `${LOT_MASTER}/${id}`,
        },
    },
    SPONSOR_COMPANY: {
        ALL: {
            ID: 'getAllSponsorCompanies',
            LABEL: 'Get All Sponsor Companies',
            METHOD: 'GET',
            PATH: `${SPONSOR_COMPANY}`,
        },
        VIEW: {
            ID: 'getSponsorCompanyById',
            LABEL: 'Get Sponsor Company Details',
            METHOD: 'GET',
            PATH: (id: string) => `${SPONSOR_COMPANY}/${id}`,
        },
        CREATE: {
            ID: 'createSponsorCompany',
            LABEL: 'Create Sponsor Company',
            METHOD: 'POST',
            PATH: `${SPONSOR_COMPANY}`,
        },
        UPDATE: {
            ID: 'updateSponsorCompany',
            LABEL: 'Update Sponsor Company',
            METHOD: 'PATCH',
            PATH: (id: string) => `${SPONSOR_COMPANY}/${id}`,
        },
        DELETE: {
            ID: 'deleteSponsorCompany',
            LABEL: 'Delete Sponsor Company',
            METHOD: 'DELETE',
            PATH: (id: string) => `${SPONSOR_COMPANY}/${id}`,
        },
    },
    BRANCH_SWITCH: {
        SWITCH_USER_BRANCH: {
            ID: 'switchUserBranch',
            LABEL: 'Switch User Branch',
            METHOD: 'PATCH',
            PATH: (userId: string) => `${USER}/${userId}/switch-branch`,
        },
        GET_USER_LOGS: {
            ID: 'getUserBranchSwitchLogs',
            LABEL: 'Get User Branch Switch Logs',
            METHOD: 'GET',
            PATH: (userId: string) => `${BRANCH_SWITCH_LOG}/user/${userId}`,
        },
        GET_BRANCH_LOGS: {
            ID: 'getBranchSwitchLogs',
            LABEL: 'Get Branch Switch Logs',
            METHOD: 'GET',
            PATH: (branchId: string) => `${BRANCH_SWITCH_LOG}/branch/${branchId}`,
        },
        GET_COMPANY_LOGS: {
            ID: 'getCompanyBranchSwitchLogs',
            LABEL: 'Get Company Branch Switch Logs',
            METHOD: 'GET',
            PATH: (companyId: string) => `${BRANCH_SWITCH_LOG}/company/${companyId}`,
        },
        GET_DATE_RANGE_LOGS: {
            ID: 'getDateRangeBranchSwitchLogs',
            LABEL: 'Get Date Range Branch Switch Logs',
            METHOD: 'GET',
            PATH: `${BRANCH_SWITCH_LOG}/date-range`,
        },
    },
    BRANCH_TRANSFER_REQUEST: {
        CREATE: {
            ID: 'createBranchTransferRequest',
            LABEL: 'Create Transfer Request',
            METHOD: 'POST',
            PATH: BRANCH_TRANSFER_REQUEST,
        },
        PENDING: {
            ID: 'getPendingTransferRequests',
            LABEL: 'Get Pending Transfer Requests',
            METHOD: 'GET',
            PATH: `${BRANCH_TRANSFER_REQUEST}/pending`,
        },
        ACCEPT: {
            ID: 'acceptTransferRequest',
            LABEL: 'Accept Transfer Request',
            METHOD: 'PATCH',
            PATH: (id: string) => `${BRANCH_TRANSFER_REQUEST}/${id}/accept`,
        },
        REJECT: {
            ID: 'rejectTransferRequest',
            LABEL: 'Reject Transfer Request',
            METHOD: 'PATCH',
            PATH: (id: string) => `${BRANCH_TRANSFER_REQUEST}/${id}/reject`,
        },
    },
    EMAIL_CAMPAIGN: {
        CREATE: {
            ID: 'createEmailCampaign',
            LABEL: 'Create Email Campaign',
            METHOD: 'POST',
            PATH: EMAIL_CAMPAIGN,
        },
    },
    DASHBOARD: {
        METRICS: {
            ID: 'getDashboardMetrics',
            LABEL: 'Get Dashboard Metrics',
            METHOD: 'GET',
            PATH: `${DASHBOARD}/metrics`,
        },
        STATS: {
            ID: 'getDashboardStats',
            LABEL: 'Get Dashboard Stats',
            METHOD: 'GET',
            PATH: `${DASHBOARD}/stats`,
        },
    },
};

export { API_ROUTE };
// --- Payment Modes & Bank Accounts (User Payment) ---
API_ROUTE.USER_PAYMENT = {
    PAYMENT_MODE_HISTORY: {
        ID: 'getUserPaymentModeHistory',
        LABEL: 'Get User Payment Mode History',
        METHOD: 'GET',
        PATH: (userId: string) => `/api/payment-modes/${userId}/history`,
    },
    BANK_ACCOUNT_HISTORY: {
        ID: 'getUserBankAccountHistory',
        LABEL: 'Get User Bank Account History',
        METHOD: 'GET',
        PATH: (userId: string) => `/api/payment-modes/${userId}/bank-accounts/history`,
    },
    CHANGE_PAYMENT_MODE: {
        ID: 'changeUserPaymentMode',
        LABEL: 'Change User Payment Mode',
        METHOD: 'POST',
        PATH: `/api/payment-modes/change`,
    },
};
