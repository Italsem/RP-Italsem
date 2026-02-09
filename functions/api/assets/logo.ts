 functionsapiassetslogo.ts
import { json } from .._auth;

export const onRequestGet PagesFunction = async () = {
   Su Pages Functions puoi fetchare l'asset pubblico con URL assoluto ricavato dalla request
   logo.png è in public
   Nota serve che il file esista davvero in publiclogo.png
  return json({ ok false, error Use frontend fetch('logo.png') and convert to base64 client-side. }, { status 400 });
};
