import { THEME_STORAGE_KEY } from "@/core/theme/theme";
import { themeCssVariables } from "@/core/theme/theme-palette";

const serialisedCssVars = JSON.stringify(themeCssVariables);

export const themeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem("${THEME_STORAGE_KEY}");
    const hasStored = stored === "light" || stored === "dark";
    // Default to dark (pure black/white palette), unless the user explicitly picked light.
    const resolved = hasStored ? stored : "dark";
    const root = document.documentElement;
    const vars = ${serialisedCssVars}[resolved] || {};
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, String(value));
    }
  } catch (_) {}
})();`;
