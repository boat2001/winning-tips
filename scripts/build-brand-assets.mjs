/**
 * Regenerates every production brand asset from the single source logo.
 *
 * Source of truth: design-reference/shared/source-assets/winning-tips-logo.png
 * Run after replacing that file:  node scripts/build-brand-assets.mjs
 *
 * Why a script rather than checked-in hand-exports: the supplied logo carries
 * ~30% transparent margin. The mark is sized by height in the UI, so that
 * margin would shrink the visible artwork in every header. Cropping to the real
 * bounding box has to happen on every artwork change, and doing it by hand is
 * how a logo ends up as a smudge in the corner of a 36px slot.
 *
 * Alpha rules (development guide §15):
 *   Everything is transparent, and every square asset is full-bleed.
 *
 *   mark   — transparent, cropped to its bounding box, sized by height.
 *   icon   — transparent, artwork edge to edge. Browser tab and PWA.
 *   logo   — transparent. schema.org organisation logo.
 *
 * Product-owner instruction: no plate behind the icon, so it fills the frame.
 * See the note on TILE_SIZE for why this mark can carry that and what iOS does
 * with a transparent apple-touch-icon.
 *
 * sharp resolves from next's install; it is not a declared dependency because
 * this script is a local authoring tool, not part of the build.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "design-reference/shared/source-assets/winning-tips-logo.png";

/**
 * The icon tile is transparent and the artwork runs edge to edge — no ground,
 * no padding.
 *
 * This is safe here only because of what the mark is: a solid circular disc
 * that carries its own blue-to-green fill. It reads on white, on navy and on
 * black without a plate behind it, so the transparent corners cost nothing. A
 * mark made of thin strokes or a single flat colour could not do this.
 *
 * One consequence to know rather than discover: iOS composites a transparent
 * apple-touch-icon onto BLACK. Transparency does not give an iOS home screen
 * "no background" — it gives a black one. That reads correctly against this
 * mark and suits the app's dark theme, which is why it is acceptable.
 */
const TILE_SIZE = 512;

/** Height the transparent mark is exported at. The UI renders it between 32 and
 *  48 CSS px, so this covers 3x device pixel ratio with room to spare. */
const MARK_HEIGHT = 512;

async function boundingBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      // Ignore near-transparent halo pixels; they are antialiasing, not artwork.
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error(`${file} has no opaque pixels`);
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function write(file, buffer) {
  await mkdir(path.dirname(file), { recursive: true });
  const { width, height } = await sharp(buffer).metadata();
  await sharp(buffer).toFile(file);
  console.log(`  ${file.padEnd(38)} ${width}x${height}`);
}

const box = await boundingBox(SOURCE);
console.log(`source ${SOURCE}`);
console.log(`cropped to ${box.width}x${box.height} from offset ${box.left},${box.top}\n`);

const cropped = await sharp(SOURCE).extract(box).png().toBuffer();

// Transparent mark, sized by height so the layout controls its width.
await write(
  "public/brand/winning-tips-mark.png",
  await sharp(cropped).resize({ height: MARK_HEIGHT, fit: "inside" }).png().toBuffer(),
);

// Transparent square tile, reused for the favicon, the apple touch icon, the
// PWA icon and the schema.org organisation logo.
//
// `contain` rather than `cover`: the artwork is 1094x1007, so filling the square
// by cropping would cut the tip off the swoosh. Contained, the wider axis runs
// the full 512px and only a few transparent pixels sit above and below — the
// mark occupies as much of the frame as it can without being distorted or
// clipped.
const tile = await sharp(cropped)
  .resize({
    width: TILE_SIZE,
    height: TILE_SIZE,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

for (const target of [
  "public/brand/winning-tips-icon.png",
  "public/brand/winning-tips-logo.png",
  "app/icon.png",
  "app/apple-icon.png",
]) {
  await write(target, tile);
}
