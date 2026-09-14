/**
 * Captures each screen at the three reference viewports for the visual
 * validation loop in development guide §13.5.
 *
 *   node scripts/capture-screens.mjs [--base http://localhost:3311] [screen...]
 *
 * Screens default to every route in design-reference/manifest.json that has a
 * mock. Output goes to .screenshots/{viewport}/{screen}.png, which is
 * git-ignored — these are review artefacts, not source.
 *
 * Each capture also fails loudly on two things the eye misses: a horizontal
 * page overflow at any viewport (guide §12 forbids it), and any console error
 * raised while the page rendered.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const baseIndex = args.indexOf("--base");
const BASE = baseIndex >= 0 ? args[baseIndex + 1] : "http://localhost:3311";
const requested = args.filter((arg, index) => !arg.startsWith("--") && index !== baseIndex + 1);

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 1024 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "mobile", width: 390, height: 844 },
];

const OUT_DIR = ".screenshots";

const manifest = JSON.parse(await readFile("design-reference/manifest.json", "utf8"));
const screens = Object.entries(manifest.screens)
  .filter(([name, screen]) => screen.desktop !== null && (requested.length === 0 || requested.includes(name)))
  .map(([name, screen]) => ({ name, route: screen.route }));

if (screens.length === 0) {
  console.error("No screens matched.");
  process.exit(1);
}

const browser = await chromium.launch();
const problems = [];

for (const viewport of VIEWPORTS) {
  await mkdir(path.join(OUT_DIR, viewport.name), { recursive: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });

  for (const screen of screens) {
    const page = await context.newPage();
    const consoleErrors = [];
    page.on("pageerror", (error) => consoleErrors.push(String(error)));

    // Report the failing URL rather than the browser's generic
    // "Failed to load resource", which names nothing and is unactionable.
    page.on("response", (response) => {
      if (response.status() < 400) return;
      const url = response.url();
      // Vercel Analytics has no local endpoint; its 404 is expected off-platform.
      if (url.includes("/_vercel/insights/")) return;
      consoleErrors.push(`${response.status()} ${url.replace(BASE, "")}`);
    });

    const url = `${BASE}${screen.route}`;
    // "load" rather than "networkidle": the analytics beacon keeps a request in
    // flight indefinitely, so networkidle never settles on a healthy page.
    const response = await page.goto(url, { waitUntil: "load", timeout: 45_000 });

    if (!response || response.status() >= 400) {
      problems.push(`${viewport.name}/${screen.name}: HTTP ${response ? response.status() : "no response"}`);
    }

    // next/font settles after first paint; without this the capture can catch a
    // fallback face and every measurement is off.
    await page.evaluate(() => document.fonts.ready);

    // fullPage captures the whole document, but below-the-fold images are
    // lazy-loaded and only start fetching once they approach the viewport. Walk
    // the page first so they are decoded by the time the shutter opens.
    //
    // Not done by awaiting image.decode(): a lazy image that has not begun
    // loading never resolves, which hangs the run rather than failing it.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(600);

    // `html { overflow-x: clip }` in the legacy stylesheet means a too-wide row
    // is silently cut instead of producing page scroll, so comparing
    // scrollWidth to clientWidth reports nothing. Measure the elements
    // themselves: anything whose box extends past the viewport is content the
    // user cannot see.
    const overflow = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth;
      let worst = null;
      for (const element of document.body.querySelectorAll("*")) {
        const style = getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") continue;
        // Elements deliberately parked off-canvas (screen-reader text, the
        // sidebar's own transforms) are not overflow.
        if (style.position === "fixed" || style.position === "absolute") continue;
        // Content inside a deliberately scrollable region (the filter rails) is
        // reachable, not clipped — the whole point of `.rail` is that it runs
        // past the edge and scrolls.
        let scrollable = false;
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const overflowX = getComputedStyle(parent).overflowX;
          if (overflowX === "auto" || overflowX === "scroll") {
            scrollable = true;
            break;
          }
        }
        if (scrollable) continue;
        const rect = element.getBoundingClientRect();
        if (rect.width === 0) continue;
        const past = Math.round(rect.right - limit);
        if (past > 1 && (worst === null || past > worst.past)) {
          worst = { past, tag: element.tagName.toLowerCase(), cls: element.className?.toString?.().slice(0, 60) ?? "" };
        }
      }
      return worst;
    });
    if (overflow) {
      problems.push(
        `${viewport.name}/${screen.name}: content clipped — <${overflow.tag}> extends ${overflow.past}px past the viewport (${overflow.cls})`,
      );
    }

    for (const error of consoleErrors) {
      problems.push(`${viewport.name}/${screen.name}: ${error}`);
    }

    const file = path.join(OUT_DIR, viewport.name, `${screen.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`  ${file}`);
    await page.close();
  }

  await context.close();
}

await browser.close();

await writeFile(
  path.join(OUT_DIR, "report.txt"),
  problems.length === 0 ? "No problems detected.\n" : `${problems.join("\n")}\n`,
);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log("\nNo overflow or console errors at any viewport.");
