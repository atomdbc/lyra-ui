import { THEME_STORAGE_KEY } from "@/core/theme/theme";
import { themeCssVariables } from "@/core/theme/theme-palette";

const serialisedCssVars = JSON.stringify(themeCssVariables);

export const themeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const hasStored = stored === "light" || stored === "dark";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = hasStored ? stored : (systemDark ? "dark" : "light");
    const root = document.documentElement;
    const vars = ${serialisedCssVars}[resolved] || {};
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, String(value));
    }
  } catch (_) {}
})();`;
