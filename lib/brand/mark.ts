// Geometry for the Crorpus monogram: a letter C built from stacked ledger rules, like the edge of a vault door.
// Pure math with no imports so both the React component and the SVG export script can use it.

export interface MarkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MARK_SIZE = 64;

export function markRects(): MarkRect[] {
  const cx = 32;
  const cy = 32;
  const outer = 29;
  const inner = 15.5;
  const rows = 9;
  const barH = 4.2;
  const pitch = 6.4; // bar height plus gap
  const aperture = cx + 11; // where the C's terminals end on the right
  const rects: MarkRect[] = [];

  for (let i = 0; i < rows; i++) {
    const y = cy + (i - (rows - 1) / 2) * pitch; // bar centre
    const dy = Math.abs(y - cy) + barH / 2; // use the outer edge of the bar so the silhouette stays round
    const wo = Math.sqrt(Math.max(0, outer * outer - dy * dy));
    const left = cx - wo;
    const dyIn = Math.max(0, Math.abs(y - cy) - barH / 2);
    let right: number;
    if (dyIn < inner) {
      // Middle rows: only the left arm of the C.
      right = cx - Math.sqrt(Math.max(0, inner * inner - dyIn * dyIn));
    } else {
      // Top and bottom rows run across to the terminal.
      right = Math.min(cx + wo, aperture);
    }
    if (right - left > 0.5) rects.push({ x: round(left), y: round(y - barH / 2), width: round(right - left), height: barH });
  }
  return rects;
}

const round = (n: number) => Math.round(n * 100) / 100;
