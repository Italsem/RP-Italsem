import { onRequestPost as __api_admin_import__type__ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\import\\[type].ts"
import { onRequestDelete as __api_admin_cantieri_ts_onRequestDelete } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\cantieri.ts"
import { onRequestGet as __api_admin_cantieri_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\cantieri.ts"
import { onRequestPost as __api_admin_cantieri_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\cantieri.ts"
import { onRequestDelete as __api_admin_dipendenti_ts_onRequestDelete } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\dipendenti.ts"
import { onRequestGet as __api_admin_dipendenti_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\dipendenti.ts"
import { onRequestPost as __api_admin_dipendenti_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\dipendenti.ts"
import { onRequestDelete as __api_admin_mezzi_ts_onRequestDelete } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\mezzi.ts"
import { onRequestGet as __api_admin_mezzi_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\mezzi.ts"
import { onRequestPost as __api_admin_mezzi_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\mezzi.ts"
import { onRequestGet as __api_admin_users_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\users.ts"
import { onRequestPost as __api_admin_users_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\users.ts"
import { onRequestPut as __api_admin_users_ts_onRequestPut } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\users.ts"
import { onRequestPost as __api_admin_users_reset_password_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\admin\\users_reset_password.ts"
import { onRequestPost as __api_auth_login_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\auth\\login.ts"
import { onRequestPost as __api_auth_logout_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\auth\\logout.ts"
import { onRequestGet as __api_auth_me_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\auth\\me.ts"
import { onRequestGet as __api_day_active_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\day\\active.ts"
import { onRequestGet as __api_day_sheet_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\day\\sheet.ts"
import { onRequestPost as __api_day_sheet_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\day\\sheet.ts"
import { onRequestGet as __api_lists__type__ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\lists\\[type].ts"
import { onRequestGet as __api_export_cantiere_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\export_cantiere.ts"
import { onRequestGet as __api_export_cpm_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\export_cpm.ts"
import { onRequestGet as __api_export_presenze_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\export_presenze.ts"
import { onRequestGet as __api_liste_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\liste.ts"
import { onRequestPost as __api_movimenti_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\movimenti.ts"
import { onRequestGet as __api_rapportini_ts_onRequestGet } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\rapportini.ts"
import { onRequestPost as __api_rapportini_ts_onRequestPost } from "C:\\Users\\Contabilita\\RP-Italsem\\functions\\api\\rapportini.ts"

export const routes = [
    {
      routePath: "/api/admin/import/:type",
      mountPath: "/api/admin/import",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_import__type__ts_onRequestPost],
    },
  {
      routePath: "/api/admin/cantieri",
      mountPath: "/api/admin",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_cantieri_ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/cantieri",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_cantieri_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/cantieri",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_cantieri_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/dipendenti",
      mountPath: "/api/admin",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_dipendenti_ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/dipendenti",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_dipendenti_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/dipendenti",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_dipendenti_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/mezzi",
      mountPath: "/api/admin",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_mezzi_ts_onRequestDelete],
    },
  {
      routePath: "/api/admin/mezzi",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_mezzi_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/mezzi",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_mezzi_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users_ts_onRequestGet],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users_ts_onRequestPost],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "PUT",
      middlewares: [],
      modules: [__api_admin_users_ts_onRequestPut],
    },
  {
      routePath: "/api/admin/users_reset_password",
      mountPath: "/api/admin",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_users_reset_password_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_ts_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_ts_onRequestGet],
    },
  {
      routePath: "/api/day/active",
      mountPath: "/api/day",
      method: "GET",
      middlewares: [],
      modules: [__api_day_active_ts_onRequestGet],
    },
  {
      routePath: "/api/day/sheet",
      mountPath: "/api/day",
      method: "GET",
      middlewares: [],
      modules: [__api_day_sheet_ts_onRequestGet],
    },
  {
      routePath: "/api/day/sheet",
      mountPath: "/api/day",
      method: "POST",
      middlewares: [],
      modules: [__api_day_sheet_ts_onRequestPost],
    },
  {
      routePath: "/api/lists/:type",
      mountPath: "/api/lists",
      method: "GET",
      middlewares: [],
      modules: [__api_lists__type__ts_onRequestGet],
    },
  {
      routePath: "/api/export_cantiere",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_export_cantiere_ts_onRequestGet],
    },
  {
      routePath: "/api/export_cpm",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_export_cpm_ts_onRequestGet],
    },
  {
      routePath: "/api/export_presenze",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_export_presenze_ts_onRequestGet],
    },
  {
      routePath: "/api/liste",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_liste_ts_onRequestGet],
    },
  {
      routePath: "/api/movimenti",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_movimenti_ts_onRequestPost],
    },
  {
      routePath: "/api/rapportini",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_rapportini_ts_onRequestGet],
    },
  {
      routePath: "/api/rapportini",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_rapportini_ts_onRequestPost],
    },
  ]