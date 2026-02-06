import type { PagesFunction } from "@cloudflare/workers-types";

export const onRequest: PagesFunction = async (ctx) => {
  return await ctx.next();
};
