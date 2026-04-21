import { ThemeMode } from "@/core/theme/theme";

type ChartTheme = {
  background: string;
  text: string;
  grid: string;
  crosshair: string;
  border: string;
};

export function getLiveChartTheme(theme: ThemeMode): ChartTheme {
  if (theme === "dark") {
    return {
      background: "#0f1012",
      text: "rgba(245,245,243,0.62)",
      grid: "rgba(245,245,243,0.07)",
      crosshair: "rgba(245,245,243,0.18)",
      border: "rgba(245,245,243,0.12)",
    };
  }

  return {
    background: "#f5f5f3",
    text: "rgba(10,10,10,0.58)",
    grid: "rgba(10,10,10,0.035)",
    crosshair: "rgba(10,10,10,0.12)",
    border: "rgba(10,10,10,0.08)",
  };
}

