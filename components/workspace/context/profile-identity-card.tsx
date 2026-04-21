"use client";

import { FormEvent, useMemo, useState } from "react";
import { usePaperWorkspace } from "@/hooks/use-paper-workspace";
import { useProfileSettings } from "@/hooks/use-profile-settings";
import { useWorkspaceAuth } from "@/hooks/use-workspace-auth";

function fallbackInitials(value: string | null) {
  if (!value) {
    return "LY";
  }
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileIdentityCard() {
  const auth = useWorkspaceAuth();
  const workspace = usePaperWorkspace();
  const updateProfile = useProfileSettings();
  const identity = workspace.data?.identity ?? null;
  const [username, setUsername] = useState(identity?.username ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    identity?.profileVisibility ?? "public"
  );
  const [feedOptIn, setFeedOptIn] = useState(identity?.publicTradeFeedOptIn ?? true);

  const initials = useMemo(
    () => fallbackInitials(identity?.displayName ?? identity?.email ?? identity?.username ?? null),
    [identity?.displayName, identity?.email, identity?.username]
  );

  if (!auth.authenticated || !identity) {
    return null;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate({
      username: username.trim() || null,
      profileVisibility: visibility,
      publicTradeFeedOptIn: feedOptIn,
    });
  };

  return (
    <section className="border-b border-black/8 px-2 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center border border-black/10 text-[10px] font-medium text-black/70">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-black/84">
            {identity.displayName ?? identity.email ?? "Workspace account"}
          </p>
          <p className="text-[9px] uppercase tracking-[0.12em] text-black/34">Profile</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-2 space-y-1.5">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase())}
          placeholder="username"
          className="h-7 w-full border border-black/10 px-2 text-[10px] text-black/82 outline-none"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={[
              "h-7 border text-[10px] font-medium",
              visibility === "public" ? "border-black bg-black text-white" : "border-black/10 text-black/64",
            ].join(" ")}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={[
              "h-7 border text-[10px] font-medium",
              visibility === "private" ? "border-black bg-black text-white" : "border-black/10 text-black/64",
            ].join(" ")}
          >
            Private
          </button>
        </div>
        <label className="flex items-center justify-between text-[10px] text-black/64">
          <span>Show my trades in public feed</span>
          <input
            type="checkbox"
            checked={feedOptIn}
            onChange={(event) => setFeedOptIn(event.target.checked)}
          />
        </label>
        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="h-7 border border-black/10 px-2 text-[10px] font-medium text-black/76 transition hover:bg-black/[0.02] disabled:cursor-not-allowed disabled:text-black/28"
        >
          {updateProfile.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
      {updateProfile.error instanceof Error ? (
        <p className="mt-1 text-[10px] text-red-700">{updateProfile.error.message}</p>
      ) : null}
    </section>
  );
}
