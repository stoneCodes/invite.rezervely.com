import type { InvitationData, TemplateId } from "@/lib/types";
export type RsvpPayload = { name: string; attending: boolean; guests: number; message: string };
export type MountOptions = { onRsvp?: (r: RsvpPayload) => Promise<void>; skipIntro?: boolean; noGate?: boolean };
export function mountInvitation(data: InvitationData, template: TemplateId, opts?: MountOptions): { replay(): void; destroy(): void };
export function dateParts(iso: string, lang?: "fr" | "en", tz?: string): { day: string; month: string; year: string; label: string; full: string } | null;
export function esc(s: unknown): string;
