import { requireAdmin, json, badRequest } from "../_auth";
import * as XLSX from "xlsx";

function pick(row: Record<string, any>, names: string[]) {
  for (const n of names) {
    const k = Object.keys(row).find((x) => x.trim().toLowerCase() === n.trim().toLowerCase());
    if (k) return String(row[k] ?? "").trim();
  }
  return "";
}

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const a = await requireAdmin(ctx);
  if (!a.ok) return a.res;

  const form = await ctx.request.formData();
  const type = String(form.get("type") || "").trim();
  const file = form.get("file");
  if (!type || !file || !(file instanceof File)) return badRequest("Missing type/file");

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return badRequest("File vuoto");

  const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
  let upserted = 0;

  if (type === "cantieri") {
    for (const r of data) {
      const codice = pick(r, ["codice", "cod. progetto", "cod_progetto", "cantiere", "codice cantiere"]);
      const descrizione = pick(r, ["descrizione", "des. progetto", "des_progetto", "nome"]);
      if (!codice) continue;
      await ctx.env.DB.prepare(
        `INSERT INTO cantieri (codice, descrizione) VALUES (?, ?)
         ON CONFLICT(codice) DO UPDATE SET descrizione=excluded.descrizione`
      ).bind(codice, descrizione || codice).run();
      upserted++;
    }
  } else if (type === "mezzi") {
    for (const r of data) {
      const codice = pick(r, ["codice", "targa", "codice mezzo"]);
      const descrizione = pick(r, ["descrizione", "mezzo", "nome"]);
      if (!codice) continue;
      await ctx.env.DB.prepare(
        `INSERT INTO mezzi (codice, descrizione) VALUES (?, ?)
         ON CONFLICT(codice) DO UPDATE SET descrizione=excluded.descrizione`
      ).bind(codice, descrizione || codice).run();
      upserted++;
    }
  } else if (type === "dipendenti") {
    for (const r of data) {
      const codice = pick(r, ["codice", "matricola", "codice dipendente"]);
      const nome = pick(r, ["nome", "first name"]);
      const cognome = pick(r, ["cognome", "last name"]);
      if (!codice) continue;
      await ctx.env.DB.prepare(
        `INSERT INTO dipendenti (codice, nome, cognome, descrizione) VALUES (?, ?, ?, ?)
         ON CONFLICT(codice) DO UPDATE SET nome=excluded.nome, cognome=excluded.cognome, descrizione=excluded.descrizione`
      ).bind(codice, nome || "", cognome || "", `${cognome} ${nome}`.trim()).run();
      upserted++;
    }
  } else {
    return badRequest("Tipo non valido");
  }

  return json({ ok: true, upserted });
};
