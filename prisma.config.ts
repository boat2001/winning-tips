import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Match Next.js local environment precedence so Prisma commands and the app
// cannot silently connect to different databases during development.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // A non-secret local fallback keeps generation and CI builds deterministic.
    // Runtime database access still validates DATABASE_URL before connecting.
    url: process.env.DATABASE_URL ?? "postgresql://smarttips:smarttips@localhost:5432/smarttips",
  },
});
