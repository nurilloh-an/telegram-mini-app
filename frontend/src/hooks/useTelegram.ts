import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    try {
      if (WebApp.initDataUnsafe?.user) {
        setUser(WebApp.initDataUnsafe.user);
      }
      WebApp.ready();
    } catch (error) {
      console.warn("Telegram WebApp SDK not available", error);
    }
  }, []);

  return { user, WebApp };
};
