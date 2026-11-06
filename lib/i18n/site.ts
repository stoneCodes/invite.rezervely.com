import type { Lang } from "./index";
import { fr, type SiteDict } from "./site-fr";
import { en } from "./site-en";

export type { SiteDict };
const DICTS: Record<Lang, SiteDict> = { fr, en };
export const siteDict = (l: Lang): SiteDict => DICTS[l];
