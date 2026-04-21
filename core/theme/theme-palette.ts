import { ThemeMode } from "@/core/theme/theme";

export const themeCssVariables: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--background": "#ffffff",
    "--foreground": "#0a0a0a",
    "--panel": "#ffffff",
    "--panel-2": "#f6f6f6",
    "--line": "rgba(10, 10, 10, 0.08)",
    "--line-strong": "rgba(10, 10, 10, 0.14)",
    "--positive": "#0f9d58",
    "--negative": "#e13f39",
    "--placeholder": "rgba(10, 10, 10, 0.36)",
    "--color-black": "#0a0a0a",
    "--color-white": "#ffffff",
    "--radius": "10px",
  },
  dark: {
    "--background": "#000000",
    "--foreground": "#ffffff",
    "--panel": "#0b0b0b",
    "--panel-2": "#141414",
    "--line": "rgba(255, 255, 255, 0.09)",
    "--line-strong": "rgba(255, 255, 255, 0.18)",
    "--positive": "#22c55e",
    "--negative": "#ef4444",
    "--placeholder": "rgba(255, 255, 255, 0.4)",
    "--color-black": "#ffffff",
    "--color-white": "#0b0b0b",
    "--radius": "10px",
  },
};
