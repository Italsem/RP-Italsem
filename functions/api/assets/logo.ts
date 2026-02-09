import { json } from "../_auth";

// Se ti serve davvero un endpoint, qui puoi servire info sul logo.
// MA il logo sta già in /public/logo.png e viene servito statico da Pages.
// Quindi questo endpoint è opzionale: lo teniamo innocuo per non rompere build.

export const onRequestGet: PagesFunction = async () => {
  return json({ ok: true, path: "/logo.png" });
};
