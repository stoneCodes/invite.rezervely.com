/** Logo « joyeuxevent » : variante sombre par défaut pour fonds clairs, variante claire disponible pour le loader. */
export default function Logo({ height = 24, className, onLight = true }: { height?: number; className?: string; onLight?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={onLight ? "/brand/joyeuxevent-logo-light.svg" : "/brand/joyeuxevent-logo.svg"} alt="joyeuxevent" height={height} width={Math.round(height * 4.668)} className={className} style={{ display: "block", height, width: "auto" }} />;
}
