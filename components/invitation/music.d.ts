/** volume / fx = volumes généraux de l'admin (0 à 1) pour la musique et les petits effets sonores. */
export type TrackRef = { src: string | null; start: number; volume?: number; fx?: number; ready?: Promise<void> };
/** Multiplicateur des effets sonores (volume « effets » de l'admin), 1 par défaut. */
export function fxLevel(track?: TrackRef | null): number;
export function createMusic(track?: TrackRef | null): { readonly on: boolean; unlock(): void; play(): void; pause(): void; destroy(): void };
