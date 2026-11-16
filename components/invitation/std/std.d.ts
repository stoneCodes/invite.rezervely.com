import type { InvitationData } from "@/lib/types";
import type { MountOptions } from "../engine";
export function mountStd(root: HTMLElement, data: InvitationData, opts?: MountOptions, variant?: "nuit" | "domaine"): { replay(): void; destroy(): void };
