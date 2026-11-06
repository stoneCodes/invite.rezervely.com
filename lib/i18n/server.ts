import "server-only";
import { cookies, headers } from "next/headers";
import { LANG_COOKIE, fromAcceptLanguage, isLang, type Lang } from "./index";
import { siteDict } from "./site";

/** Langue du visiteur : son choix (cookie), sinon celle de son navigateur. */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (isLang(c)) return c;
  return fromAcceptLanguage((await headers()).get("accept-language"));
}

export async function getT() {
  return siteDict(await getLang());
}
