# Lyra Growth Rollout — Docs Alignment Notes

This rollout followed official integration guides before implementation.

## Vercel Analytics
- Docs: https://vercel.com/docs/analytics/quickstart
- Applied pattern: installed `@vercel/analytics`, mounted `<Analytics />` in `app/layout.tsx`.

## Vercel Speed Insights
- Docs: https://vercel.com/docs/speed-insights/quickstart
- Applied pattern: installed `@vercel/speed-insights`, mounted `<SpeedInsights />` in `app/layout.tsx`.

## Next.js metadata and OG
- Docs: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Applied pattern: static `metadata` in `app/layout.tsx`, root `app/opengraph-image.tsx`, dynamic share metadata in `app/share/[token]/page.tsx`, dynamic OG image route in `app/share/[token]/opengraph-image.tsx`.

## Privy React setup/auth flow
- Docs: https://docs.privy.io/basics/react/setup
- Applied pattern: auth-gated actions continue to use Privy bearer verification on server routes and Privy session token access in client hooks before protected calls.

## Supabase Realtime (Postgres Changes)
- Docs: https://supabase.com/docs/guides/realtime/postgres-changes
- Applied pattern: client channel subscriptions for `workspace_users`, `paper_accounts`, `paper_positions`, `paper_trades`, and `workspace_activity` in `hooks/use-paper-workspace-realtime.ts`.

## Supabase RLS / policies
- Docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Applied pattern: all privileged mutations/read aggregation in server API routes via admin client, with authenticated user resolution first and constrained table updates.

## X share intent
- Docs: https://developer.x.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
- Applied pattern: generated intent URLs in share-card flows using:
  - `https://x.com/intent/tweet?text=...&url=...`
  - no `via` parameter (per product decision).
