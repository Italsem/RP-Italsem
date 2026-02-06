export const onRequestPost: PagesFunction = async () => {
  // Auth disabilitata: logout non deve fare nulla
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
