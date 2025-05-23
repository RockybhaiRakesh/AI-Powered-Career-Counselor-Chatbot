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
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // This is the object where you define your custom rules
    rules: {
      // Add this line to set the rule
      "@typescript-eslint/no-explicit-any": "warn", // Or "off"
      // Keep any other existing rules here if you have them
    },
  },
];

export default eslintConfig;