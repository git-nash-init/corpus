import { writeFileSync, mkdirSync } from "node:fs";
import { markRects, MARK_SIZE } from "../lib/brand/mark.ts";

const rects = markRects();
const body = (fill) => rects.map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" fill="${fill}"/>`).join("");
const svg = (inner, w = MARK_SIZE, h = MARK_SIZE, bg = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${bg}${inner}</svg>\n`;

mkdirSync("public/brand", { recursive: true });
writeFileSync("public/brand/crorpus-mark.svg", svg(body("#C9A45C")));
writeFileSync("public/brand/crorpus-mark-ink.svg", svg(body("#16201B")));
// Favicon and app icon: mark on the ink tile.
writeFileSync("app/icon.svg", svg(`<g transform="translate(6 6) scale(0.8125)">${body("#C9A45C")}</g>`, 64, 64, `<rect width="64" height="64" rx="0" fill="#0E1311"/>`));
console.log(rects.length, "bars");
