"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { ProfileConnectPrompt } from "@/components/profile/profile-connect-prompt";
import { ProfileSegmentedControl } from "@/components/profile/profile-segmented-control";
import { ProfileToggleSwitch } from "@/components/profile/profile-toggle-switch";
import { ProfileUsernameField } from "@/components/profile/profile-username-field";
import { usePaperWorkspace } from "@/hooks/use-paper-workspace";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { useUsernameAvailability } from "@/hooks/use-username-availability";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";
import { useThemeMode } from "@/providers/theme-provider";

function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

export function ProfileSettingsPage() {
  const auth = useWorkspaceAuth();
  const workspace = usePaperWorkspace();
  const updateProfile = useProfileSettings();
  const { resolvedTheme, toggleTheme } = useThemeMode();
  const identity = workspace.data?.identity ?? null;
  const [usernameInput, setUsernameInput] = useState<string | null>(null);
  const [visibilityInput, setVisibilityInput] = useState<"public" | "private" | null>(null);
  const [feedOptInInput, setFeedOptInInput] = useState<boolean | null>(null);

  const username = usernameInput ?? identity?.username ?? "";
  const visibility = visibilityInput ?? identity?.profileVisibility ?? "public";
  const feedOptIn = feedOptInInput ?? identity?.publicTradeFeedOptIn ?? true;
  const displayName = identity?.displayName ?? identity?.email ?? "Lyra trader";
  const publicProfileHref = identity?.username ? `/u/${identity.username}` : null;
  const publicProfileLabel = publicProfileHref ? `lyrabuild.xyz${publicProfileHref}` : "Set a username to enable";
  const usernameAvailability = useUsernameAvailability(username);
  const usernameAvailabilityState = {
    isPending: usernameAvailability.isPending,
    available: usernameAvailability.data?.available ?? false,
    reason: usernameAvailability.data?.reason ?? null,
  };
  const usernameValid =
    username.length === 0 || (username.length >= 3 && username.length <= 24 && usernameAvailabilityState.available);
  const canSave = usernameValid && !updateProfile.isPending;

  if (!auth.authenticated) return <ProfileConnectPrompt onConnect={auth.login} />;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      username: username.trim() || null,
      profileVisibility: visibility,
      publicTradeFeedOptIn: feedOptIn,
    });
  };

  return (
    <main className="min-h-screen bg-[var(--background)] p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-black/36">Profile setup</p>
            <h1 className="mt-2 text-[34px] font-semibold tracking-tight text-black">Identity & visibility</h1>
            <p className="mt-2 text-[13px] leading-6 text-black/58">Keep terminal trade-only. Configure profile controls here.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center border border-black/10 text-black/74 transition hover:bg-black/[0.02]"
            >
              {resolvedTheme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
            <Link href="/terminal" className="inline-flex h-9 items-center border border-black/10 px-3 text-[11px] font-medium text-black/74">
              Back to terminal
            </Link>
          </div>
        </header>

        <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <aside className="border border-black/10 bg-white p-4 shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-black/34">Preview</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center border border-black/12 bg-white p-2.5">
                <Image src="/lyra.svg" alt="Lyra" width={30} height={30} className={["h-7.5 w-7.5 object-contain", resolvedTheme === "dark" ? "invert" : ""].join(" ")} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-black/86">{displayName}</p>
                <p className="truncate text-[11px] text-black/52">@{username || "username"}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-black/8 pt-3">
              <p className="text-[9px] uppercase tracking-[0.14em] text-black/34">Public profile</p>
              <p className="mt-1 truncate text-[11px] text-black/66">{publicProfileLabel}</p>
            </div>
            {publicProfileHref ? (
              <Link href={publicProfileHref} target="_blank" className="mt-3 inline-flex h-8 items-center border border-black/10 px-3 text-[10px] font-medium text-black/72">
                Open public page
              </Link>
            ) : null}
          </aside>

          <section className="space-y-4">
            <div className="border border-black/10 bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-black/34">Public identity</p>
              <ProfileUsernameField
                username={username}
                onUsernameChange={(next) => setUsernameInput(normalizeUsername(next))}
                availability={usernameAvailabilityState}
              />
            </div>

            <div className="border border-black/10 bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-black/34">Privacy controls</p>
              <div className="mt-3">
                <p className="text-[11px] font-medium text-black/72">Profile visibility</p>
                <p className="mt-1 text-[10px] text-black/52">Public profiles can be visited directly via your username link.</p>
                <div className="mt-2">
                  <ProfileSegmentedControl
                    value={visibility}
                    onChange={(next) => setVisibilityInput(next)}
                    options={[
                      { value: "public", label: "Public", description: "Visible on /u/username" },
                      { value: "private", label: "Private", description: "Only visible to you" },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-3 border border-black/8 bg-black/[0.01] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-black/72">Public trade feed</p>
                    <p className="mt-1 text-[10px] leading-5 text-black/52">Controls trade visibility in the public feed and PnL visibility on your public profile.</p>
                  </div>
                  <ProfileToggleSwitch checked={feedOptIn} onChange={setFeedOptInInput} ariaLabel="Toggle public trade feed" />
                </div>
                <p className={["mt-2 text-[10px] font-medium", feedOptIn ? "text-emerald-700" : "text-black/44"].join(" ")}>
                  {feedOptIn ? "Trades + PnL visible publicly" : "Trades + PnL hidden publicly"}
                </p>
              </div>
            </div>

            <div className="sticky bottom-4 border border-black/10 bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={!canSave}
                  className="h-10 border border-black bg-black px-4 text-[12px] font-medium text-white transition hover:bg-black/88 disabled:cursor-not-allowed disabled:bg-black/30"
                >
                  {updateProfile.isPending ? "Saving…" : "Save profile"}
                </button>
                {publicProfileHref ? (
                  <Link href={publicProfileHref} target="_blank" className="inline-flex h-10 items-center border border-black/10 px-4 text-[12px] font-medium text-black/74">
                    View public profile
                  </Link>
                ) : null}
              </div>
              {updateProfile.error instanceof Error ? <p className="mt-2 text-[11px] text-red-700">{updateProfile.error.message}</p> : null}
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}

