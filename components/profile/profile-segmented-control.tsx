"use client";

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
  description?: string;
};

export function ProfileSegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div className={`grid rounded-md border border-black/10 bg-black/[0.02] p-1`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "min-h-10 rounded px-3 py-2 text-left transition",
              active
                ? "bg-black text-white shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                : "text-black/64 hover:bg-black/[0.03] hover:text-black/82",
            ].join(" ")}
          >
            <p className="text-[11px] font-medium leading-4">{option.label}</p>
            {option.description ? (
              <p className={["mt-0.5 text-[10px] leading-4", active ? "text-white/72" : "text-black/44"].join(" ")}>
                {option.description}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
