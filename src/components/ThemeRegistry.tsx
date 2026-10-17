"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Toaster } from "react-hot-toast";
import { getMuiTheme, type ThemeMode } from "@/theme";

/**
 * Provides the MUI theme matching the document's [data-theme] attribute.
 * A MutationObserver keeps MUI in sync whenever the toggle in AppShell
 * flips dark ↔ light, so both layers (MUI + CSS-variable utilities)
 * always render the same mode.
 */
export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const html = document.documentElement;
    const read = () =>
      setMode(html.getAttribute("data-theme") === "light" ? "light" : "dark");
    read();
    const observer = new MutationObserver(read);
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const muiTheme = useMemo(() => getMuiTheme(mode), [mode]);

  return (
    <AppRouterCacheProvider options={{ key: "mui", enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
        <Toaster
          position="bottom-right"
          gutter={10}
          toastOptions={{
            className: "leadnex-toast",
            success: {
              iconTheme: { primary: "#10b981", secondary: "#0a1f16" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#220c0c" },
            },
          }}
        />
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
