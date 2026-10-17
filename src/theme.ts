import { createTheme } from "@mui/material/styles";

/**
 * HookStream MUI theme factory — every override is bound to the CSS custom
 * properties from globals.css (var(--...)), so surfaces, borders, inputs,
 * chips and alerts re-skin automatically when [data-theme] flips. Only the
 * palette values that MUI must parse/transform internally (text, action
 * hover tints, solid brand colors) are concrete per-mode values, swapped by
 * ThemeRegistry when the document's data-theme attribute changes.
 *
 * Token mapping:
 *   primary  → --primary (#6366f1 indigo)   success → --status-active
 *   info     → --status-paused              warning → --status-scheduled
 *   error    → --status-completed           paper   → --bg-card / --bg-dropdown
 */
export type ThemeMode = "dark" | "light";

export function getMuiTheme(mode: ThemeMode = "dark") {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
    primary: {
      main: "#6366f1",
      light: "#818cf8",
      dark: "#4f46e5",
      contrastText: "#ffffff",
    },
    secondary: { main: "#8b5cf6", contrastText: "#ffffff" },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#ffffff",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
      contrastText: "#ffffff",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
      contrastText: "#ffffff",
    },
      background: {
        default: dark ? "#0f0f13" : "#f4f4f8",
        paper: dark ? "#14141b" : "#ffffff",
      },
      text: {
        primary: dark ? "#ffffff" : "#0f0f13",
        secondary: dark ? "rgba(255, 255, 255, 0.65)" : "rgba(15, 15, 19, 0.65)",
      },
      divider: "var(--border-primary)",
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h4: { fontWeight: 800, letterSpacing: "-0.03em" },
    h5: { fontWeight: 800, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-primary)",
          boxShadow: "var(--shadow-card)",
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-primary)",
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--bg-dropdown)",
          border: "1px solid var(--border-primary)",
          boxShadow: "var(--shadow-lg)",
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
          fontWeight: 600,
          letterSpacing: "0.01em",
          "&.MuiButton-containedPrimary": {
            background:
              "linear-gradient(135deg, var(--primary) 0%, #4f46e5 60%, #8b5cf6 130%)",
            boxShadow: "0 6px 24px -6px rgba(99, 102, 241, 0.55)",
            "&:hover": {
              background:
                "linear-gradient(135deg, #818cf8 0%, var(--primary-hover) 60%, #a78bfa 130%)",
              boxShadow: "0 10px 32px -6px rgba(99, 102, 241, 0.7)",
            },
            "&.Mui-disabled": {
              background: "var(--primary-bg)",
              color: "var(--text-tertiary)",
            },
          },
          "&.MuiButton-outlinedPrimary": {
            borderColor: "var(--border-secondary)",
            color: "var(--text-primary)",
            "&:hover": {
              borderColor: "var(--primary)",
              backgroundColor: "var(--primary-bg)",
            },
          },
          "&.MuiButton-textPrimary": { color: "var(--text-secondary)" },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { color: "var(--text-secondary)" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundColor: "var(--bg-input)",
          color: "var(--text-primary)",
          transition: "box-shadow 0.2s ease",
          "& fieldset": { borderColor: "var(--border-input)" },
          "&:hover fieldset": { borderColor: "var(--border-hover)" },
          "&.Mui-focused fieldset": {
            borderColor: "var(--border-focus)",
            borderWidth: "1.5px",
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px var(--primary-bg)",
          },
        },
        input: {
          fontSize: "0.875rem",
          color: "var(--text-primary)",
          "&::placeholder": { color: "var(--text-placeholder)", opacity: 1 },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          color: "var(--text-tertiary)",
          "&.Mui-focused": { color: "var(--primary)" },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { color: "var(--text-tertiary)" },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: "var(--text-tertiary)" },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          color: "var(--text-primary)",
          "&.Mui-selected": {
            backgroundColor: "var(--primary-bg)",
            color: "var(--primary)",
            "&:hover": { backgroundColor: "var(--bg-selected)" },
          },
          "&:hover": { backgroundColor: "var(--bg-hover)" },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
          background: "linear-gradient(90deg, var(--primary), #8b5cf6)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.85rem",
          minHeight: 54,
          color: "var(--text-tertiary)",
          transition: "color 0.2s ease",
          "&.Mui-selected": { color: "var(--text-primary)" },
          "&:hover": { color: "var(--text-secondary)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, letterSpacing: "0.01em" },
        outlined: { borderColor: "var(--border-secondary)" },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "var(--border-primary)" },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "var(--bg-dropdown)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-secondary)",
          boxShadow: "var(--shadow-md)",
          fontSize: "0.75rem",
        },
        arrow: { color: "var(--bg-dropdown)" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          color: "var(--text-primary)",
          "&.MuiAlert-standardSuccess": {
            backgroundColor: "var(--status-active-bg)",
            border: "1px solid var(--status-active-border)",
          },
          "&.MuiAlert-standardError": {
            backgroundColor: "var(--status-completed-bg)",
            border: "1px solid var(--status-completed-border)",
          },
          "&.MuiAlert-standardInfo": {
            backgroundColor: "var(--status-paused-bg)",
            border: "1px solid var(--status-paused-border)",
          },
          "&.MuiAlert-standardWarning": {
            backgroundColor: "var(--status-scheduled-bg)",
            border: "1px solid var(--status-scheduled-border)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--bg-secondary)",
          borderRadius: 4,
        },
      },
    },
    },
  });
}

const theme = getMuiTheme("dark");

export default theme;
