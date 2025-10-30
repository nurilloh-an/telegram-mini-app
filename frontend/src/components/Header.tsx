import type { User } from "../types";

interface Props {
  user?: User;
}

export const Header: React.FC<Props> = ({ user }) => {
  return (
    <header className="mb-6 flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-gray-900">Market do'kon</h1>
      <p className="text-sm text-gray-500">
        Yangi va sifatli mahsulotlar. Telegram orqali buyurtma bering.
      </p>
      {user ? (
        <div className="mt-1 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-gray-700 shadow">
          <span className="font-semibold">{user.name}</span>
          <span>{user.phone_number}</span>
        </div>
      ) : null}
    </header>
  );
};
