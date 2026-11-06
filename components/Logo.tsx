/** Logo « joyeuxevent » (piste Étincelle), pour fond sombre. Fichiers sources dans public/brand. */
export default function Logo({ height = 24, className }: { height?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/joyeuxevent-logo.svg" alt="joyeuxevent" height={height} width={Math.round(height * 4.668)} className={className} style={{ display: "block", height, width: "auto" }} />;
}
