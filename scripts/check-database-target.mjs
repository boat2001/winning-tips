import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function readEnvironment(directory) {
  const env = {};
  for (const file of [".env", ".env.local"]) {
    const target = path.join(directory, file);
    if (fs.existsSync(target)) Object.assign(env, parseEnv(fs.readFileSync(target, "utf8")));
  }
  return env;
}
const env = { ...readEnvironment(root), ...process.env };
const current = [env.DATABASE_URL, env.DIRECT_URL].filter(Boolean);
if (!env.DATABASE_URL) throw new Error("Configure Winning Tips' isolated DATABASE_URL before changing its schema.");
for (const sibling of ["tips-deck", "smart-tips"]) {
  const other = readEnvironment(path.join(root, "..", sibling));
  const urls = [other.DATABASE_URL, other.DIRECT_URL].filter(Boolean);
  const identity = (value) => {
    const url = new URL(value);
    // Prisma's shared proxy uses credentials to identify databases. Neon uses
    // the endpoint and database; normalize pooled/direct endpoint aliases.
    return url.hostname.includes("prisma") ? value : `${url.hostname.replace("-pooler", "")}:${url.port || "5432"}${url.pathname}`;
  };
  if (current.some((url) => urls.some((otherUrl) => identity(url) === identity(otherUrl)))) throw new Error(`Refusing to modify ${sibling}'s database. Configure a separate Winning Tips database first.`);
}
if (env.SEED_DEMO_DATA === "true" && env.APP_ENV !== "development") throw new Error("Demo seeding is only allowed with APP_ENV=development.");
console.log("Database target is configured and does not match either local client project.");
