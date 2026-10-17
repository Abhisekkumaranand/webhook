"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Moon, PhoneCall, Radio, Send, Sun, Webhook } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/webhook",
    label: "Webhook Transmitter",
    icon: <Send size={15} />,
  },
  {
    href: "/call-analytics",
    label: "Call Analytics",
    icon: <PhoneCall size={15} />,
  },
];

type ThemeMode = "dark" | "light";

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      localStorage.getItem("hs-theme")) as ThemeMode | null;
    const initial: ThemeMode =
      stored === "light" || stored === "dark"
        ? stored
        : (document.documentElement.getAttribute("data-theme") as ThemeMode) || "dark";
    setMode(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggle = () => {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    const html = document.documentElement;
    // Flash-guarded switch, like the reference theme system.
    html.classList.add("theme-switching");
    html.setAttribute("data-theme", next);
    localStorage.setItem("hs-theme", next);
    setMode(next);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => html.classList.remove("theme-switching"));
    });
  };

  return (
    <Tooltip title={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"} arrow>
      <IconButton
        onClick={toggle}
        size="small"
        aria-label="Toggle color theme"
        sx={{
          width: 34,
          height: 34,
          border: "1px solid var(--border-secondary)",
          borderRadius: "6px",
          color: "var(--text-secondary)",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "var(--primary)",
            color: "var(--primary)",
            backgroundColor: "var(--primary-bg)",
          },
        }}
      >
        {mode === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </IconButton>
    </Tooltip>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "color-mix(in srgb, var(--bg-primary) 80%, transparent)",
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <Toolbar sx={{ gap: 2, minHeight: { xs: 60, sm: 66 }, px: { xs: 2, md: 3 } }}>
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, mr: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--avatar-gradient-1)",
                boxShadow: "0 6px 18px -4px rgba(99, 102, 241, 0.6)",
                color: "#fff",
                flexShrink: 0,
              }}
            >
              <Webhook size={20} />
            </Box>
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                variant="subtitle1"
                sx={{ lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                HookStream
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--text-tertiary)", lineHeight: 1, letterSpacing: "0.06em" }}
              >
                WEBHOOK CRM CONSOLE
              </Typography>
            </Box>
          </Box>

          {/* Nav */}
          <Box sx={{ display: "flex", gap: 0.75, flexGrow: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  size="small"
                  sx={{
                    px: 1.8,
                    py: 0.9,
                    borderRadius: "6px",
                    fontSize: "0.83rem",
                    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
                    backgroundColor: active ? "var(--primary-bg)" : "transparent",
                    border: active
                      ? "1px solid var(--primary-border)"
                      : "1px solid transparent",
                    boxShadow: active ? "inset 0 0 18px var(--primary-bg)" : "none",
                    "&:hover": {
                      backgroundColor: "var(--bg-hover)",
                      color: "var(--text-primary)",
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* Endpoint chip */}
          <Chip
            icon={<Radio size={13} />}
            label="POST /api/webhooks"
            size="small"
            variant="outlined"
            sx={{
              display: { xs: "none", md: "flex" },
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
              color: "var(--status-active)",
              borderColor: "var(--status-active-border)",
              backgroundColor: "var(--status-active-bg)",
              "& .MuiChip-icon": { color: "var(--status-active)" },
            }}
          />
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="xl"
        component="main"
        className="hs-fade-up"
        sx={{
          flexGrow: 1,
          py: { xs: 2.5, sm: 3.5, md: 4 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {children}
      </Container>

      {/* Footer strip */}
      <Box
        component="footer"
        sx={{
          borderTop: "1px solid var(--border-primary)",
          py: 2,
          textAlign: "center",
        }}
      >
        <Typography variant="caption" sx={{ color: "var(--text-tertiary)" }}>
          HookStream · Webhook ingestion → smart upsert → live call analytics ·
          Next.js + PostgreSQL + Material UI
        </Typography>
      </Box>
    </Box>
  );
}
