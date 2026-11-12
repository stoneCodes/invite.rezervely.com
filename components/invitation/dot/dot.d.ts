import type { InvitationData } from "@/lib/types";
import type { MountOptions } from "../engine";
export const DOT_DEMO_FABRIC: string;
export function mountDot(root: HTMLElement, data: InvitationData, opts?: MountOptions): { replay(): void; destroy(): void };
