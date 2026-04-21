import {
  PublicLiveRead,
  PublicProfileSummary,
  PublicSocialProof,
  PublicTradeFeedItem,
  ShareCardTheme,
  ShareCardType,
  WeeklyLeaderboardEntry,
} from "@/core/paper/types";

type WorkspaceRequestIdentity = {
  walletAddress?: string | null;
  email?: string | null;
  displayName?: string | null;
};

function buildWorkspaceHeaders(accessToken: string, identity?: WorkspaceRequestIdentity) {
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (identity?.walletAddress) headers.set("x-wallet-address", identity.walletAddress);
  if (identity?.email) headers.set("x-user-email", identity.email);
  if (identity?.displayName) headers.set("x-user-name", identity.displayName);
  return headers;
}

async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchPublicLiveRead(productId?: string) {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  return requestJson<{ read: PublicLiveRead }>(`/api/public/live-read${query}`);
}

export function fetchPublicLiveTrades() {
  return requestJson<{ trades: PublicTradeFeedItem[] }>("/api/public/live-trades");
}

export function fetchPublicSocialProof() {
  return requestJson<PublicSocialProof>("/api/public/social-proof");
}

export function submitWaitlistSignup(input: { email: string; source?: string }) {
  return requestJson<{ ok: true }>("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function dismissTerminalOnboarding(
  accessToken: string,
  identity: WorkspaceRequestIdentity
) {
  return requestJson<{ ok: true }>("/api/workspace/onboarding/terminal", {
    method: "PATCH",
    headers: buildWorkspaceHeaders(accessToken, identity),
  });
}

export function createShareCard(
  accessToken: string,
  identity: WorkspaceRequestIdentity,
  input: {
    type: ShareCardType;
    theme: ShareCardTheme;
    payload: Record<string, unknown>;
  }
) {
  return requestJson<{
    token: string;
    shareUrl: string;
    imageUrl: string;
    xIntentUrl: string;
  }>("/api/share-cards", {
    method: "POST",
    headers: buildWorkspaceHeaders(accessToken, identity),
    body: JSON.stringify(input),
  });
}

export function fetchWeeklyLeaderboard() {
  return requestJson<{ entries: WeeklyLeaderboardEntry[] }>("/api/leaderboard/weekly");
}

export function fetchPublicProfile(username: string) {
  return requestJson<{
    profile: PublicProfileSummary;
    trades: PublicTradeFeedItem[];
  }>(`/api/profile/${encodeURIComponent(username)}`);
}

export function updateMyProfile(
  accessToken: string,
  identity: WorkspaceRequestIdentity,
  input: {
    username?: string | null;
    avatarUrl?: string | null;
    profileVisibility?: "public" | "private";
    publicTradeFeedOptIn?: boolean;
  }
) {
  return requestJson<{ ok: true }>("/api/profile/me", {
    method: "PATCH",
    headers: buildWorkspaceHeaders(accessToken, identity),
    body: JSON.stringify(input),
  });
}

export function fetchUsernameAvailability(
  accessToken: string,
  identity: WorkspaceRequestIdentity,
  username: string
) {
  return requestJson<{ username: string; available: boolean; reason: string | null }>(
    `/api/profile/username-availability?username=${encodeURIComponent(username)}`,
    {
      method: "GET",
      headers: buildWorkspaceHeaders(accessToken, identity),
    }
  );
}
