import type { InvitationData } from "@/lib/types";
import type { MountOptions } from "../engine";
export function mountGateau(root: HTMLElement, data: InvitationData, opts?: MountOptions): { replay(): void; destroy(): void };
