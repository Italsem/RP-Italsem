import { guardAdmin, listAll, upsertRow, deleteRow } from "./list_generic";

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const g = await guardAdmin(ctx); if (!g.ok) return g.res;
  return listAll(ctx, "dipendenti");
};
export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const g = await guardAdmin(ctx); if (!g.ok) return g.res;
  return upsertRow(ctx, "dipendenti");
};
export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const g = await guardAdmin(ctx); if (!g.ok) return g.res;
  return deleteRow(ctx, "dipendenti");
};
