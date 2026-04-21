"use client";

import { useMutation } from "@tanstack/react-query";
import { submitWaitlistSignup } from "@/core/services/growth-api";

export function useWaitlistSignup() {
  return useMutation({
    mutationFn: (input: { email: string; source?: string }) => submitWaitlistSignup(input),
  });
}
