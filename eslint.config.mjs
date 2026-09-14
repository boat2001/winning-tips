import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", ".next-review/**", ".next-build/**", ".next-preview/**", ".open-next/**", ".wrangler/**", ".npm-cache/**", "generated/**", "coverage/**"]),
]);
