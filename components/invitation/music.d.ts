export type TrackRef = { src: string | null; start: number; ready?: Promise<void> };
export function createMusic(track?: TrackRef | null): { readonly on: boolean; unlock(): void; play(): void; pause(): void; destroy(): void };
