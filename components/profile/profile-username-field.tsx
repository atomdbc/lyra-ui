"use client";

type AvailabilityState = {
  isPending: boolean;
  available: boolean;
  reason: string | null;
};

export function ProfileUsernameField({
  username,
  onUsernameChange,
  availability,
}: {
  username: string;
  onUsernameChange: (next: string) => void;
  availability: AvailabilityState;
}) {
  const usernameLength = username.length;
  const showAvailability = usernameLength >= 3;

  return (
    <label className="mt-3 block">
      <p className="text-[11px] font-medium text-black/72">Username</p>
      <input
        value={username}
        onChange={(event) => onUsernameChange(event.target.value)}
        placeholder="username"
        className="mt-1 h-10 w-full border border-black/10 px-3 text-[12px] text-black/84 outline-none"
      />
      <p className="mt-1 text-[10px] text-black/46">3–24 chars. Spaces are removed automatically.</p>
      {usernameLength > 0 && usernameLength < 3 ? (
        <p className="mt-1 text-[10px] text-red-700">Username must be at least 3 characters.</p>
      ) : null}
      {usernameLength > 24 ? (
        <p className="mt-1 text-[10px] text-red-700">Username must be 24 characters or fewer.</p>
      ) : null}
      {showAvailability ? (
        <p
          className={[
            "mt-1 text-[10px]",
            availability.available ? "text-emerald-700" : "text-red-700",
          ].join(" ")}
        >
          {availability.isPending
            ? "Checking availability…"
            : (availability.reason ?? "Username is available.")}
        </p>
      ) : null}
    </label>
  );
}
