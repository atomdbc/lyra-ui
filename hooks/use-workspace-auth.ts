"use client";

import { useMemo } from "react";
import { usePrivy, useToken, useWallets } from "@privy-io/react-auth";

function readLinkedEmail(user: ReturnType<typeof usePrivy>["user"]) {
  const account = user?.linkedAccounts.find((item) => item.type === "email");
  return account && "address" in account ? account.address : null;
}

function readDisplayName(user: ReturnType<typeof usePrivy>["user"]) {
  const oauthAccount = user?.linkedAccounts.find((item) => "name" in item && item.name);
  return oauthAccount && "name" in oauthAccount ? oauthAccount.name : null;
}

function readLinkedWalletAddress(user: ReturnType<typeof usePrivy>["user"]) {
  const walletAccount = user?.linkedAccounts.find(
    (item) => item.type === "wallet" && "address" in item
  );
  return walletAccount && "address" in walletAccount ? walletAccount.address : null;
}

export function useWorkspaceAuth() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { getAccessToken } = useToken();
  const walletAddress = wallets[0]?.address ?? readLinkedWalletAddress(user);

  return useMemo(
    () => ({
      ready,
      authenticated,
      login,
      logout,
      userId: user?.id ?? null,
      walletAddress,
      email: readLinkedEmail(user),
      displayName: readDisplayName(user),
      getAccessToken,
    }),
    [authenticated, getAccessToken, login, logout, ready, user, walletAddress]
  );
}
