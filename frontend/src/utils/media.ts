const rawLimit = Number.parseFloat(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB ?? "10");
export const MAX_UPLOAD_SIZE_MB = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const rawMediaBase = import.meta.env.VITE_MEDIA_BASE_URL ?? __BACKEND_URL__;

const normalizeBase = (value: string | undefined): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const normalizedBase = normalizeBase(rawMediaBase);

export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedBase) {
    return normalizedPath;
  }
  return `${normalizedBase}${normalizedPath}`;
};
