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
      background: "#000000",
      text: "rgba(255,255,255,0.62)",
      grid: "rgba(255,255,255,0.06)",
      crosshair: "rgba(255,255,255,0.2)",
      border: "rgba(255,255,255,0.12)",
    };
  }

  return {
    background: "#ffffff",
    text: "rgba(10,10,10,0.58)",
    grid: "rgba(10,10,10,0.05)",
    crosshair: "rgba(10,10,10,0.22)",
    border: "rgba(10,10,10,0.1)",
  };
}
