import { requireAdmin, json } from "../_auth";

type AnyRow = Record<string, any>;
const TABLES = ["users", "cantieri", "mezzi", "dipendenti", "rapportini"] as const;

function bytesOf(value: unknown) {
  return new TextEncoder().encode(JSON.stringify(value ?? null)).length;
}

export const onRequestGet: PagesFunction<{ DB: D1Database; DB_QUOTA_BYTES?: string }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const breakdown: { table: string; rows: number; bytes: number }[] = [];

  for (const table of TABLES) {
    const r = await ctx.env.DB.prepare(`SELECT * FROM ${table}`).all<AnyRow>();
    const rows = r.results ?? [];
    breakdown.push({ table, rows: rows.length, bytes: bytesOf(rows) });
  }

  const used = breakdown.reduce((acc, x) => acc + x.bytes, 0);
  const quota = Number(ctx.env.DB_QUOTA_BYTES || 5 * 1024 * 1024 * 1024);
  const free = Math.max(quota - used, 0);
  const rapportini = breakdown.find((x) => x.table === "rapportini")?.bytes ?? 0;

  return json({
    ok: true,
    quota_bytes: quota,
    used_bytes: used,
    free_bytes: free,
    used_percent: quota > 0 ? Math.min(100, (used / quota) * 100) : 0,
    rapportini_bytes: rapportini,
    breakdown,
    approx: true,
  });
};
