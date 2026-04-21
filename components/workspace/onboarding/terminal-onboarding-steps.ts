export type TerminalOnboardingStepId =
  | "welcome"
  | "proof"
  | "signal"
  | "assistant"
  | "connect";

export type TerminalOnboardingStep = {
  id: TerminalOnboardingStepId;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
  cta?: string;
};

export const TERMINAL_ONBOARDING_STEPS: TerminalOnboardingStep[] = [
  {
    id: "welcome",
    eyebrow: "Lyra Terminal · testnet",
    title: "A professional trading workspace, reimagined.",
    body: "Every price, every position, every decision — consolidated into one calm, fast, keyboard-first interface. We are live on testnet today; mainnet follows once audits and infra harden.",
    bullets: [
      "Built for traders who care about execution.",
      "150+ perpetual markets, 40× leverage on majors.",
      "Designed to feel native at 1080p and 4K.",
    ],
  },
  {
    id: "proof",
    eyebrow: "On-chain proof · testnet",
    title: "Trades that anyone can verify.",
    body: "Every paper trade, position, and PnL tick is logged so your history is replayable and shareable. Mainnet settlement comes next — for now everything runs on testnet with paper balances.",
    bullets: [
      "Self-custody by default. You hold the keys.",
      "Trade histories are portable and shareable.",
      "No black-box matching engine. Everything is inspectable.",
    ],
  },
  {
    id: "signal",
    eyebrow: "Lyra Signal",
    title: "Whale alerts and early buys — streamed live.",
    body: "Our signal engine watches pump.fun, dexscreener, and DEX flow in real time, scores the opportunities, and pushes them into the terminal as actionable alerts.",
    bullets: [
      "Large-wallet spotting, early-buy index, volume acceleration.",
      "<150ms from block to dashboard.",
      "One click opens the market in the terminal.",
    ],
  },
  {
    id: "assistant",
    eyebrow: "Lyra Assistant · learning",
    title: "An AI copilot that talks like a trader.",
    body: "Ask for a read on the market, your book, or alternatives. The assistant answers in short plain sentences — no tables, no filler — and surfaces a signal only when there is a real edge. It is still learning your style, so treat early reads with extra scrutiny.",
    bullets: [
      "Understands your active market and open positions.",
      "Streams responses; stop or steer anytime.",
      "Quick actions: enter trade, counter it, open market.",
      "Still learning — feedback loop shipping soon.",
    ],
  },
  {
    id: "connect",
    eyebrow: "Get started · testnet",
    title: "Connect and own your trading history.",
    body: "Link a wallet or Gmail to spin up a testnet paper account. Trade risk-free, stress the tools, and graduate to mainnet execution once it ships.",
    bullets: [
      "Paper account funded with $10,000.",
      "Full terminal, zero configuration.",
      "Same tools will route to mainnet when live.",
    ],
    cta: "Connect wallet / Gmail",
  },
];
