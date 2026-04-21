export type TerminalOnboardingStepId = "welcome" | "purpose" | "workflow" | "profile" | "connect";

export type TerminalOnboardingStep = {
  id: TerminalOnboardingStepId;
  title: string;
  body: string;
  note?: string;
  imageSrc: string;
};

export const TERMINAL_ONBOARDING_STEPS: TerminalOnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Lyra Terminal",
    body: "A clean trading workspace built for focus, speed, and precise execution.",
    imageSrc: "/onboarding/welcome.svg",
  },
  {
    id: "purpose",
    title: "Paper trade. Track. Learn.",
    body: "Test your setups on live markets, review outcomes, and improve with clear data.",
    imageSrc: "/onboarding/purpose.svg",
  },
  {
    id: "workflow",
    title: "Simple flow, serious output",
    body: "Pick a market, define the position, execute, and keep every action recorded.",
    imageSrc: "/onboarding/workflow.svg",
  },
  {
    id: "profile",
    title: "Set up your profile",
    body: "Configure your username and visibility in one dedicated page.",
    note: "Why: a profile gives your trading history a clean identity and shareable track record.",
    imageSrc: "/onboarding/profile.svg",
  },
  {
    id: "connect",
    title: "Connect and start trading",
    body: "Link wallet or Gmail to open your paper account and enter the workspace.",
    imageSrc: "/onboarding/connect.svg",
  },
];
