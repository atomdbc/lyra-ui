import { MobileHoldingPage } from "@/components/mobile/mobile-holding-page";
import { BulkTerminalShell } from "@/components/workspace/bulk/bulk-terminal-shell";

export default function TerminalPage() {
  return (
    <>
      <MobileHoldingPage />
      <div className="hidden h-[100dvh] md:block">
        <BulkTerminalShell />
      </div>
    </>
  );
}
