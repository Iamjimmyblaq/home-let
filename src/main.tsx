import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const root = document.getElementById("root")!;

if (missingEnv) {
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:24px">
      <div style="max-width:520px">
        <h1 style="font-size:20px;font-weight:700;margin-bottom:8px">Backend configuration missing</h1>
        <p style="line-height:1.6">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
        as environment variables in your hosting provider (see <code>.env.example</code>) and redeploy.</p>
      </div>
    </div>`;
} else {
  createRoot(root).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
}
