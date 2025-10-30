import type { User } from "../types";

interface Props {
  user?: User;
}

export const Header: React.FC<Props> = ({ user }) => {
  return (
    <header className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-500 text-white shadow-xl">
        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -left-14 bottom-0 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 p-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            Siz Market
          </span>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Siz Market Telegram menyusi</h1>
          <p className="mt-2 max-w-xl text-sm text-emerald-50 md:text-base">
            Mazali milliy taomlar, yarim tayyor mahsulotlar va kundalik xaridlar — barchasi bir joyda.
            Tezkor dostavka yoki o'zingiz olib ketish imkoniyati.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-50">
            <span>🚚 Yetkazib berish 30-45 daqiqa</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/90 p-4 shadow-lg ring-1 ring-white/60 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Manzil</p>
            <div className="mt-1 flex items-center gap-2 text-base font-semibold text-gray-900">
              <span>{user?.name ?? "Mijoz ma'lumotlari kiritilmagan"}</span>
            </div>
            <p className="text-xs text-gray-500">
              {user?.phone_number ? `${user.phone_number} raqamiga bog'langan profil` : "Davom etish uchun profil ma'lumotlarini kiriting"}
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-600"
            >
              📍 Manzil qo'shish
            </button>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 rounded-full bg-gray-100 p-1 text-sm font-semibold text-gray-600">
            <button
              type="button"
              className="rounded-full bg-white px-4 py-2 text-emerald-600 shadow"
            >
              Dostavka
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2"
            >
              Olib ketish
            </button>
          </div>
        </div>
      </div>

      {user ? (
        <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
          <span>👤 {user.name}</span>
          <span>📞 {user.phone_number}</span>
        </div>
      ) : null}
    </header>
  );
};
