const STORAGE_KEY = "telegram-market-guest-id-map";

const parseMap = (): Record<string, number> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.entries(parsed).reduce<Record<string, number>>((acc, [key, value]) => {
      if (typeof value === "number" && !Number.isNaN(value)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to parse guest telegram id map", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return {};
  }
};

const persistMap = (map: Record<string, number>) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
};

const normalizePhone = (phone: string): string => phone.replace(/\D/g, "");

const generateCandidate = (existing: Record<string, number>): number => {
  const usedValues = new Set(Object.values(existing));
  const envRaw = import.meta.env.VITE_FAKE_TELEGRAM_ID;
  if (envRaw) {
    const parsed = Number(envRaw);
    if (!Number.isNaN(parsed) && !usedValues.has(parsed)) {
      return parsed;
    }
  }

  let candidate = 0;
  do {
    candidate = 100000000 + Math.floor(Math.random() * 900000000);
  } while (usedValues.has(candidate));

  return candidate;
};

export const getGuestTelegramIdForPhone = (phone: string): number | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return null;
  }
  const map = parseMap();
  return map[normalized] ?? null;
};

export const assignGuestTelegramIdForPhone = (phone: string): number => {
  if (typeof window === "undefined") {
    const envRaw = import.meta.env.VITE_FAKE_TELEGRAM_ID;
    const parsed = envRaw ? Number(envRaw) : NaN;
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error("Telefon raqami topilmadi");
  }
  const map = parseMap();
  if (map[normalized]) {
    return map[normalized];
  }
  const candidate = generateCandidate(map);
  map[normalized] = candidate;
  persistMap(map);
  return candidate;
};
