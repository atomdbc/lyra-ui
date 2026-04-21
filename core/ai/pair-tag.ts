const PAIR_RE_GLOBAL = /<pair\s*>([\s\S]*?)<\/pair>/gi;
const PAIR_RE_SINGLE = /<pair\s*>([\s\S]*?)<\/pair>/i;

export function stripPairTagsForDisplay(content: string): string {
  return content.replace(PAIR_RE_GLOBAL, "$1").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractPairTags(content: string): string[] {
  const pairs: string[] = [];
  for (const match of content.matchAll(PAIR_RE_GLOBAL)) {
    const inner = match[1]?.trim();
    if (inner) pairs.push(inner);
  }
  // de-dupe, keep order
  return pairs.filter((p, i) => pairs.indexOf(p) === i).slice(0, 6);
}

export function extractFirstPairTag(content: string): string | null {
  const m = content.match(PAIR_RE_SINGLE);
  const inner = m?.[1]?.trim();
  return inner && inner.length > 0 ? inner : null;
}

