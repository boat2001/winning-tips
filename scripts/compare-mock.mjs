/**
 * Stacks a band of the approved mock directly above the same band of our
 * screenshot, both at the reference viewport's scale.
 *
 *   node scripts/compare-mock.mjs <screen> <topPx> <heightPx>
 *   node scripts/compare-mock.mjs home 0 420
 *
 * Offsets are absolute pixels measured from the top of the page at the
 * reference width. Percentages would not line up: our screenshots are full-page
 * captures and the mock is a single viewport, so the same percentage lands on
 * different content.
 *
 * Side-by-side comparison makes differences in *layout* obvious but hides
 * differences in *size* — the eye cannot judge two type scales separated by
 * 1400px of horizontal distance. Stacking the same band, at the same width,
 * puts the two baselines within a few pixels of each other, which is the only
 * arrangement where a 2px difference in a heading is visible.
 *
 * Desktop only: the tablet and mobile references are rendered inside device
 * frames, so their pixels do not map 1:1 onto a viewport screenshot.
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const [screen = "home", topPx = "0", heightPx = "420"] = process.argv.slice(2);

const REFERENCE_WIDTH = 1440;
const OUT_DIR = ".screenshots/compare";
const LABEL_HEIGHT = 26;

const mockPath = `design-reference/desktop/${screen}.png`;
const shotPath = `.screenshots/desktop/${screen}.png`;

/** Scales a source to the reference width and cuts the requested band. */
async function band(file, top, height) {
  const scaled = await sharp(file).resize({ width: REFERENCE_WIDTH }).png().toBuffer();
  const meta = await sharp(scaled).metadata();
  const y = Math.min(Number(top), meta.height - 1);
  const h = Math.min(Number(height), meta.height - y);
  return { buffer: await sharp(scaled).extract({ left: 0, top: y, width: REFERENCE_WIDTH, height: h }).png().toBuffer(), height: h };
}

function label(text, width) {
  const svg = `<svg width="${width}" height="${LABEL_HEIGHT}">
    <rect width="${width}" height="${LABEL_HEIGHT}" fill="#111"/>
    <text x="10" y="18" font-family="monospace" font-size="13" fill="#0f0">${text}</text>
  </svg>`;
  return Buffer.from(svg);
}

const mock = await band(mockPath, topPx, heightPx);
const shot = await band(shotPath, topPx, heightPx);

const totalHeight = LABEL_HEIGHT + mock.height + LABEL_HEIGHT + shot.height;

await mkdir(OUT_DIR, { recursive: true });
const out = `${OUT_DIR}/${screen}-${topPx}-${heightPx}.png`;

await sharp({
  create: { width: REFERENCE_WIDTH, height: totalHeight, channels: 3, background: { r: 17, g: 17, b: 17 } },
})
  .composite([
    { input: label(`MOCK  design-reference/desktop/${screen}.png`, REFERENCE_WIDTH), top: 0, left: 0 },
    { input: mock.buffer, top: LABEL_HEIGHT, left: 0 },
    { input: label(`OURS  ${shotPath}`, REFERENCE_WIDTH), top: LABEL_HEIGHT + mock.height, left: 0 },
    { input: shot.buffer, top: LABEL_HEIGHT * 2 + mock.height, left: 0 },
  ])
  .png()
  .toFile(out);

console.log(out);
