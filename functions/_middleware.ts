// functions/_middleware.ts
export async function onRequest(context: any) {
  try {
    return await context.next();
  } catch (e: any) {
    const msg = e?.message || String(e);
    return new Response(
      JSON.stringify({ ok: false, error: "FUNCTION_RUNTIME_ERROR", message: msg }, null, 2),
      { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
    );
  }
}
