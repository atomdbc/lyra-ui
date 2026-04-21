"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperWorkspaceContext } from "@/core/paper/types";
import { workspaceContextQueryKey } from "@/core/services/query-keys";
import { dismissTerminalOnboarding } from "@/core/services/growth-api";
import { usePaperWorkspace } from "@/hooks/use-paper-workspace";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

const STORAGE_KEY = "lyra_terminal_onboarding_seen";

function readLocalSeen() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function markLocalSeen() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, "1");
}

function subscribeLocalSeen(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export function useTerminalOnboarding() {
  const auth = useWorkspaceAuth();
  const workspace = usePaperWorkspace();
  const queryClient = useQueryClient();
  const [localSeenOverride, setLocalSeenOverride] = useState(false);
  const localSeenSnapshot = useSyncExternalStore(subscribeLocalSeen, readLocalSeen, () => false);
  const localSeen = localSeenSnapshot || localSeenOverride;
  const queryKey = [...workspaceContextQueryKey, auth.userId];

  const dismissMutation = useMutation({
    mutationFn: async () => {
      markLocalSeen();
      setLocalSeenOverride(true);
      if (!auth.authenticated) {
        return { ok: true };
      }
      const accessToken = await auth.getAccessToken();
      if (!accessToken) {
        throw new Error("Unable to verify the current session.");
      }
      return dismissTerminalOnboarding(accessToken, {
        walletAddress: auth.walletAddress,
        email: auth.email,
        displayName: auth.displayName,
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<PaperWorkspaceContext | undefined>(queryKey, (current) =>
        current
          ? {
              ...current,
              identity: {
                ...current.identity,
                hasSeenTerminalOnboarding: true,
              },
            }
          : current
      );
    },
  });

  useEffect(() => {
    if (!localSeen || !auth.authenticated || !workspace.data) {
      return;
    }
    if (workspace.data.identity.hasSeenTerminalOnboarding || dismissMutation.isPending) {
      return;
    }
    dismissMutation.mutate();
  }, [
    auth.authenticated,
    dismissMutation,
    dismissMutation.isPending,
    localSeen,
    workspace.data,
  ]);

  const shouldShow = useMemo(() => {
    if (dismissMutation.isPending || localSeen) {
      return false;
    }
    if (!auth.authenticated) {
      return true;
    }
    if (!workspace.data) {
      return false;
    }
    return workspace.data.identity.hasSeenTerminalOnboarding === false;
  }, [auth.authenticated, dismissMutation.isPending, localSeen, workspace.data]);

  return {
    shouldShow,
    dismiss: () => dismissMutation.mutate(),
    isPending: dismissMutation.isPending,
  } as const;
}
