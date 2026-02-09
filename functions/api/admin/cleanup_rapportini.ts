import { requireAdmin, json } from "../_auth";

async function countSafe(ctx: any, table: string) {
  try {
    const row = await ctx.env.DB.prepare(`SELECT COUNT(*) AS c FROM ${table}`).first<{ c: number }>();
    return Number(row?.c || 0);
  } catch {
    return 0;
  }
}

async function deleteSafe(ctx: any, table: string) {
  try {
    await ctx.env.DB.prepare(`DELETE FROM ${table}`).run();
  } catch {
    // tabella non presente
  }
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const beforeRapportini = await countSafe(ctx, "rapportini");
  const beforeDaySheets = await countSafe(ctx, "day_sheets");

  await deleteSafe(ctx, "rapportini");
  await deleteSafe(ctx, "day_sheets");

  const afterRapportini = await countSafe(ctx, "rapportini");
  const afterDaySheets = await countSafe(ctx, "day_sheets");

  return json({
    ok: true,
    deleted_rapportini: Math.max(0, beforeRapportini - afterRapportini),
    deleted_day_sheets: Math.max(0, beforeDaySheets - afterDaySheets),
    deleted: Math.max(0, beforeRapportini - afterRapportini) + Math.max(0, beforeDaySheets - afterDaySheets),
    remaining: afterRapportini + afterDaySheets,
  });
};
