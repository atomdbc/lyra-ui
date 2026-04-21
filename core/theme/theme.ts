export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

export const THEME_STORAGE_KEY = "lyra_theme_preference";

export function resolveThemeMode(
  preference: ThemePreference,
  prefersDark: boolean
): ThemeMode {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }
  return preference;
}

