import { DIMENSIONS, type Dimension } from "./data";
import type { ResponseRecord } from "./store";

export function skillStats(rs: ResponseRecord[]) {
  const chron = [...rs].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const half = Math.max(1, Math.floor(chron.length / 2));
  const avg = (list: ResponseRecord[], d: Dimension) => list.length ? Math.round(list.reduce((s, r) => s + r.analysis.scores[d], 0) / list.length) : 0;
  return DIMENSIONS.map((d) => {
    const early = avg(chron.slice(0, half), d);
    const recent = avg(chron.slice(-half), d);
    const best = rs.reduce<ResponseRecord | null>((b, r) => (!b || r.analysis.scores[d] > b.analysis.scores[d] ? r : b), null);
    return { d, early, current: recent, trend: recent - early, series: chron.map((r) => r.analysis.scores[d]), evidence: best?.analysis.dimensions[d]?.happened ?? "", };
  });
}

export function currentPattern(rs: ResponseRecord[]) {
  const recent = rs.slice(0, 6);
  const count = (key: "primary_pattern" | "secondary_pattern") => {
    const c: Record<string, number> = {};
    recent.forEach((r) => { const p = r.analysis[key]; if (p !== "structured") c[p] = (c[p] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0];
  };
  const stats = skillStats(rs);
  const sorted = [...stats].sort((a, b) => b.current - a.current);
  return { primary: count("primary_pattern") ?? "scatterer", secondary: count("secondary_pattern") ?? "overexplainer", strength: sorted[0]?.d ?? "relevance", focus: sorted[sorted.length - 1]?.d ?? "structure", weakest: sorted.slice(-3).reverse().map((s) => s.d) };
}
