import { useEffect, useMemo, useState } from "react";
import type { Language, User } from "../types";
import { upsertUser } from "../api/client";
import { useTelegram } from "../hooks/useTelegram";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as User;
      setName(saved.name);
      setPhone(saved.phone_number);
      setLanguage(saved.language);
      onReady(saved);
    } else if (tgUser) {
      const defaultName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      setName(defaultName || "");
      if (tgUser.language_code && ["uz", "ru", "en"].includes(tgUser.language_code)) {
        setLanguage(tgUser.language_code as Language);
      }
    }
  }, [tgUser, onReady]);

  const telegramId = useMemo(() => tgUser?.id ?? Number(import.meta.env.VITE_FAKE_TELEGRAM_ID || 999999), [tgUser]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = await upsertUser({
        telegram_id: telegramId,
        name,
        phone_number: phone,
        language,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      onReady(payload);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-500 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        disabled={submitting || !name || !phone}
      >
        {submitting ? "Saqlanmoqda..." : "Davom etish"}
      </button>
    </form>
  );
};
