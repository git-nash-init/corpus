import { markRects, MARK_SIZE } from "@/lib/brand/mark";

const rects = markRects();

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`}
      className={className}
      role="img"
      aria-label="Crorpus"
      fill="currentColor"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.width} height={r.height} />
      ))}
    </svg>
  );
}

export function Logo({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} className="text-brass" />
      <span className="font-display text-[26px] leading-none tracking-tight text-ink" style={{ marginTop: -2 }}>
        Crorpus
      </span>
    </span>
  );
}
