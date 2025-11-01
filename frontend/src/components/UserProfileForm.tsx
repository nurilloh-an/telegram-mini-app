import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Language, User } from "../types";
import { fetchUserByTelegramId, upsertUser } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";
import {
  assignGuestTelegramIdForPhone,
  getGuestTelegramIdForPhone,
} from "../utils/guestTelegramId";

interface Props {
  onReady: (user: User) => void;
}

const languages: Array<{ value: Language; label: string }> = [
  { value: "uz", label: "O'zbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

const STORAGE_KEY = "telegram-market-user";

export const UserProfileForm: React.FC<Props> = ({ onReady }) => {
  const { user: tgUser } = useTelegram();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<Language>("uz");
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSavedRef = useRef<string | null>(null);
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const isTelegramSession = Boolean(tgUser);

  useEffect(() => {
    let isActive = true;
    const applyUser = (existing: User) => {
      if (!isActive) {
        return;
      }
      setName(existing.name);
      setPhone(existing.phone_number);
      setLanguage(existing.language);
      setTelegramId(existing.telegram_id);
      setBootstrapError(null);
      const snapshot = JSON.stringify({
        telegram_id: existing.telegram_id,
        name: existing.name,
        phone_number: existing.phone_number,
        language: existing.language,
      });
      lastSavedRef.current = snapshot;
      setHasSaved(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      onReady(existing);
    };

    const bootstrap = async () => {
      if (!isActive) {
        return;
      }
      setBootstrapError(null);
      setBootstrapLoading(true);

      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        try {
          const saved = JSON.parse(raw) as User;
          if (!isActive) {
            return;
          }
          setName(saved.name);
          setPhone(saved.phone_number);
          setLanguage(saved.language);
          setTelegramId(saved.telegram_id);
          lastSavedRef.current = null;
          setHasSaved(false);

          try {
            const existing = await fetchUserByTelegramId(saved.telegram_id);
            if (!isActive) {
              return;
            }
            applyUser(existing);
            setBootstrapLoading(false);
            return;
          } catch (err: unknown) {
            if (!isActive) {
              return;
            }
            const status = (err as { response?: { status?: number } })?.response?.status;
            if (status === 404) {
              localStorage.removeItem(STORAGE_KEY);
              setHasSaved(false);
            } else {
              console.error(err);
              setBootstrapError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
            }
          }
        } catch (err) {
          console.error(err);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      if (!isActive) {
        return;
      }

      if (tgUser) {
        const defaultName = [tgUser.first_name, tgUser.last_name]
          .filter(Boolean)
          .join(" ");
        setName(defaultName || "");
        if (tgUser.language_code && ["uz", "ru", "en"].includes(tgUser.language_code)) {
          setLanguage(tgUser.language_code as Language);
        }
        setTelegramId(tgUser.id);

        try {
          const existing = await fetchUserByTelegramId(tgUser.id);
          if (!isActive) {
            return;
          }
          applyUser(existing);
          setBootstrapLoading(false);
          return;
        } catch (err: unknown) {
          if (!isActive) {
            return;
          }
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            setBootstrapError(
              "Telefon raqamingiz topilmadi. Iltimos, botda telefon raqamingizni ulashing.",
            );
            setHasSaved(false);
          } else {
            console.error(err);
            setBootstrapError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
          }
          setBootstrapLoading(false);
          return;
        }
      }

      if (!isActive) {
        return;
      }

      if (typeof window !== "undefined") {
        setTelegramId(null);
      }
      setBootstrapLoading(false);
    };

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, [tgUser, onReady]);

  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [name, phone, language, error]);

  useEffect(() => {
    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    if (!trimmedName || normalizedPhone.length < 7) {
      setHasSaved(false);
      return;
    }

    const activeTelegramId = tgUser?.id ?? telegramId;
    if (activeTelegramId == null) {
      setHasSaved(false);
      return;
    }

    const snapshot = JSON.stringify({
      telegram_id: activeTelegramId,
      name: trimmedName,
      phone_number: normalizedPhone,
      language,
    });

    if (snapshot !== lastSavedRef.current) {
      setHasSaved(false);
    }
  }, [language, name, phone, telegramId, tgUser?.id]);

  const persistProfile = useCallback(
    async (
      snapshot: string,
      payload: {
        telegram_id: number;
        name: string;
        phone_number: string;
        language: Language;
      },
    ) => {
      setSaving(true);
      setError(null);
      try {
        const response = await upsertUser(payload);
        lastSavedRef.current = snapshot;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
        setHasSaved(true);
        onReady(response);
      } catch (err) {
        console.error(err);
        setError("Ma'lumotlarni saqlab bo'lmadi. Qaytadan urinib ko'ring.");
      } finally {
        setSaving(false);
      }
    },
    [onReady],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");

    if (!trimmedName || normalizedPhone.length < 7) {
      setError("Iltimos, to'liq ism va telefon raqamini kiriting.");
      return;
    }

    let activeTelegramId = tgUser?.id ?? telegramId;

    if (!tgUser?.id) {
      const normalizedDigits = normalizedPhone.replace(/\D/g, "");
      const existingGuestId = getGuestTelegramIdForPhone(normalizedDigits);
      if (existingGuestId !== null) {
        activeTelegramId = existingGuestId;
      } else {
        activeTelegramId = assignGuestTelegramIdForPhone(normalizedDigits);
      }
      setTelegramId(activeTelegramId);
    }

    if (activeTelegramId == null) {
      setError("Texnik xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
      return;
    }

    const snapshot = JSON.stringify({
      telegram_id: activeTelegramId,
      name: trimmedName,
      phone_number: normalizedPhone,
      language,
    });

    await persistProfile(snapshot, {
      telegram_id: activeTelegramId,
      name: trimmedName,
      phone_number: normalizedPhone,
      language,
    });
  };

  const canSubmit = useMemo(() => {
    const trimmedName = name.trim();
    const normalizedPhone = phone.replace(/\s+/g, "");
    return Boolean(trimmedName) && normalizedPhone.length >= 7;
  }, [name, phone]);

  if (isTelegramSession) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-inner shadow-emerald-100/40">
        {bootstrapError ? (
          <>
            <p className="text-sm font-semibold text-red-500">{bootstrapError}</p>
            <p className="mt-2 text-xs text-gray-500">
              Telefon raqamingizni botga jo'natganingizga ishonch hosil qiling va qaytadan urinib ko'ring.
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            {bootstrapLoading ? "Profil ma'lumotlari yuklanmoqda..." : "Profil ma'lumotlari tayyorlanmoqda."}
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {bootstrapError ? (
        <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600">{bootstrapError}</p>
      ) : null}
      <div>
        <label className="block text-sm font-medium text-gray-600">Ismingiz</label>
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ism"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Telefon raqam</label>
        <input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="998901234567"
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Til</label>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {languages.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setLanguage(item.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                language === item.value
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Telefon raqamingizni kiriting va pastdagi tugma orqali ma'lumotlarni saqlang.
      </p>
      <button
        type="submit"
        disabled={!canSubmit || saving}
        className={`w-full rounded-full px-4 py-3 text-base font-semibold text-white transition ${
          !canSubmit || saving ? "bg-emerald-300" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {saving ? "Saqlanmoqda..." : "Kirish"}
      </button>
      {saving ? (
        <p className="text-sm text-emerald-600">Ma'lumotlar saqlanmoqda...</p>
      ) : hasSaved ? (
        <p className="text-sm text-emerald-600">Ma'lumotlar saqlandi. Mini ilovadan foydalanishingiz mumkin.</p>
      ) : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </form>
  );
};
