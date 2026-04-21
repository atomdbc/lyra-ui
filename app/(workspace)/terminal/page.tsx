import { MobileHoldingPage } from "@/components/mobile/mobile-holding-page";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

export default function TerminalPage() {
  return (
    <>
      <MobileHoldingPage />
      <div className="hidden md:block">
        <WorkspaceShell />
      </div>
    </>
  );
}
