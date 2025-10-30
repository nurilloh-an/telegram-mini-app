import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || "development"),
      __BACKEND_URL__: JSON.stringify(
        env.VITE_BACKEND_URL || "http://localhost:8000"
      ),
      __BACKEND_API_PREFIX__: JSON.stringify(
        env.VITE_BACKEND_API_PREFIX ?? "/api"
      ),
    },
    server: {
      host: true,
      port: 5173,
    },
  };
});
