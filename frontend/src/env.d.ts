/// <reference types="vite/client" />

declare const __APP_ENV__: string;
declare const __BACKEND_URL__: string;
declare const __BACKEND_API_PREFIX__: string;

interface ImportMetaEnv {
  readonly VITE_ADMIN_PHONE_NUMBERS?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
  readonly VITE_MAX_UPLOAD_SIZE_MB?: string;
}
