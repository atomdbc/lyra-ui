"use client";

export function ProfileToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full border transition",
        checked ? "border-black bg-black" : "border-black/14 bg-white",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-4.5 w-4.5 rounded-full transition-transform",
          checked ? "translate-x-[21px] bg-white" : "translate-x-[3px] bg-black/32",
        ].join(" ")}
      />
    </button>
  );
}
