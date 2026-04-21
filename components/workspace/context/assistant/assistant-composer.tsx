"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  streaming?: boolean;
  placeholder: string;
  size?: "panel" | "modal";
};

function resizeTextarea(element: HTMLTextAreaElement | null, maxHeight: number) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
}

export function AssistantComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  streaming = false,
  placeholder,
  size = "panel",
}: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const maxHeight = size === "modal" ? 200 : 120;

  useEffect(() => {
    resizeTextarea(inputRef.current, maxHeight);
  }, [maxHeight, value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={cn(
          "mx-auto flex items-end gap-2 border border-[var(--line-strong)] bg-[var(--panel)]",
          size === "modal"
            ? "max-w-[720px] rounded-[14px] px-4 py-2.5 shadow-[0_2px_0_rgba(0,0,0,0.08)]"
            : "max-w-[760px] px-3 py-2"
        )}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 resize-none overflow-y-auto bg-transparent text-foreground outline-none placeholder:text-[var(--placeholder)] disabled:cursor-not-allowed",
            size === "modal"
              ? "max-h-[200px] min-h-[28px] text-[14px] leading-[1.55]"
              : "max-h-[120px] min-h-[22px] text-[12px] leading-5"
          )}
        />
        <button
          type="submit"
          disabled={!value.trim() || disabled || streaming}
          className={cn(
            "inline-flex shrink-0 items-center justify-center bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35",
            size === "modal" ? "h-9 w-9 rounded-full" : "h-7 w-7"
          )}
          aria-label="Send"
        >
          <ArrowUp className={size === "modal" ? "h-4 w-4" : "h-3.5 w-3.5"} />
        </button>
      </div>
    </form>
  );
}
