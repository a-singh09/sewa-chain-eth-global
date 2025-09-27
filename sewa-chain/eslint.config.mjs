import { FlatCompat } from "@eslint/eslintrc";
import react from "eslint-plugin-react";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Disable all ESLint rules for hackathon build
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: { react: { version: "detect" } },
    plugins: { react },
    rules: {
      // Disable all rules for hackathon
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "react/no-unescaped-entities": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
    },
  },
];

export default eslintConfig;
