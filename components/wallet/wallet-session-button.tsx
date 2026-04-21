"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { WalletSessionMenu } from "@/components/wallet/wallet-session-menu";
import { usePrivyStatus } from "@/providers/privy-provider";
import { useUIStore } from "@/stores/ui-store";

function readLinkedWalletAddress(user: ReturnType<typeof usePrivy>["user"]) {
  const account = user?.linkedAccounts.find((item) => item.type === "wallet" && "address" in item);
  return account && "address" in account ? account.address : null;
}

function WalletSessionButtonUnavailable() {
  return (
    <div className="border-l border-black/8">
      <button
        type="button"
        disabled
        className="h-7 px-2 text-[10px] font-medium text-black/28"
        title="Set PRIVY_APP_ID to enable wallet connection"
      >
        Connect wallet
      </button>
    </div>
  );
}

function PrivyWalletSessionButton() {
  const router = useRouter();
  const { ready, authenticated, login, linkWallet, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const walletAction = useUIStore((state) => state.walletAction);
  const walletActionRequestId = useUIStore((state) => state.walletActionRequestId);
  const clearWalletAction = useUIStore((state) => state.clearWalletAction);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const primaryWalletAddress = wallets[0]?.address ?? readLinkedWalletAddress(user);
  const hasWalletConnection = Boolean(primaryWalletAddress) || authenticated;
  const buttonLabel = !ready
    ? "Connect wallet"
    : !hasWalletConnection
      ? "Connect wallet"
      : primaryWalletAddress
        ? `${primaryWalletAddress.slice(0, 6)}…${primaryWalletAddress.slice(-4)}`
        : "Disconnect wallet";

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!walletAction || walletActionRequestId === 0 || !ready) return;

    if (walletAction === "logout") {
      if (authenticated) {
        void logout();
      }
    } else if (authenticated) {
      linkWallet({ walletChainType: "ethereum-only" });
    } else {
      login();
    }

    clearWalletAction();
  }, [
    authenticated,
    clearWalletAction,
    linkWallet,
    login,
    logout,
    ready,
    walletAction,
    walletActionRequestId,
  ]);

  return (
    <div ref={containerRef} className="relative border-l border-black/8">
      <button
        type="button"
        onClick={() => {
          if (!ready) return;
          if (!hasWalletConnection) {
            login();
            return;
          }
          setMenuOpen((open) => !open);
        }}
        className="h-7 px-2 text-[10px] font-medium text-black/72 transition hover:bg-black/[0.02] hover:text-black"
      >
        {buttonLabel}
      </button>
      <WalletSessionMenu
        open={menuOpen}
        anchorRef={containerRef}
        menuRef={menuRef}
        connected={hasWalletConnection}
        walletAddress={primaryWalletAddress}
        walletCount={wallets.length}
        onOpenProfile={() => {
          router.push("/profile");
          setMenuOpen(false);
        }}
        onConnectWallet={() => {
          linkWallet({ walletChainType: "ethereum-only" });
          setMenuOpen(false);
        }}
        onDisconnect={() => {
          void logout();
          setMenuOpen(false);
        }}
      />
    </div>
  );
}

export function WalletSessionButton() {
  const { appIdConfigured } = usePrivyStatus();

  if (!appIdConfigured) {
    return <WalletSessionButtonUnavailable />;
  }

  return <PrivyWalletSessionButton />;
}
