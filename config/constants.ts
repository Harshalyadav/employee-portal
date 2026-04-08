export const APP_NAME = "PP ";
export const APP_VERSION = "1.0.0";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

export const UPLOAD_MAX_FILE_SIZE_MB = 50; // Maximum file size for uploads in MB
export const UPLOAD_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
];
export const UPLOAD_ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/avi",
  "video/mov",
];
export const UPLOAD_ALLOWED_PDF_TYPES = ["application/pdf"];
export const UPLOAD_MAX_FILES = 10; // Maximum number of files for multiple uploads
export const PAGINATION_DEFAULT_PAGE_SIZE = 20;
export const PAGINATION_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATETIME_FORMAT = "YYYY-MM-DD HH:mm:ss";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIRE_SPECIAL_CHAR = true;
export const PASSWORD_REQUIRE_NUMBER = true;
export const PASSWORD_REQUIRE_UPPERCASE = true;
export const PASSWORD_REQUIRE_LOWERCASE = true;

export const SESSION_TIMEOUT_MINUTES = 30;
export const REFRESH_TOKEN_INTERVAL_MINUTES = 25;

export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";
export const THEME_SYSTEM = "system";

export const NOTIFICATION_DEFAULT_DURATION_MS = 5000;
export const NOTIFICATION_MAX_STACK = 5;
export const MODAL_DEFAULT_WIDTH_PX = 600;
export const MODAL_DEFAULT_HEIGHT_PX = 400;

export const SIDEBAR_COLLAPSED_WIDTH_PX = 80;
export const SIDEBAR_EXPANDED_WIDTH_PX = 250;

export const HEADER_HEIGHT_PX = 60;
export const FOOTER_HEIGHT_PX = 40;

export const DATE_PICKER_START_OF_WEEK = 0;

export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export const MAX_UPLOAD_RETRIES = 3;
export const UPLOAD_RETRY_DELAY_MS = 2000;
export const UPLOAD_CHUNK_SIZE_MB = 5; // Chunk size for multipart uploads in MB
export const UPLOAD_CONCURRENCY = 3; // Number of concurrent uploads
export const WINDOWS_EVENTS = {
  USER: {
    CREATE: {
      ID: "userCreated",
      LABEL: "User Created",
    },
    UPDATE: {
      ID: "userUpdated",
      LABEL: "User Updated",
    },
    DELETE: {
      ID: "userDeleted",
      LABEL: "User Deleted",
    },
  },
  MODEL: {
    CREATE: {
      ID: "modelCreated",
      LABEL: "Model Created",
    },
    UPDATE: {
      ID: "modelUpdated",
      LABEL: "Model Updated",
    },
    DELETE: {
      ID: "modelDeleted",
      LABEL: "Model Deleted",
    },
  },
  RAW_MATERIAL: {
    CREATE: {
      ID: "rawMaterialCreated",
      LABEL: "Raw Material Created",
    },
    UPDATE: {
      ID: "rawMaterialUpdated",
      LABEL: "Raw Material Updated",
    },
    DELETE: {
      ID: "rawMaterialDeleted",
      LABEL: "Raw Material Deleted",
    },
  },
  COMPANY: {
    CREATE: {
      ID: "companyCreated",
      LABEL: "Company Created",
    },
    UPDATE: {
      ID: "companyUpdated",
      LABEL: "Company Updated",
    },
    DELETE: {
      ID: "companyDeleted",
      LABEL: "Company Deleted",
    },
  },
};
