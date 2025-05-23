// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import flatcompat from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new flatcompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }),
]

export default eslintConfig;