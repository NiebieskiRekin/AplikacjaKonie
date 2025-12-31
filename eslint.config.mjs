import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import drizzle from "eslint-plugin-drizzle";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: [
      "./infra",
      "**/node_modules",
      "**/dist",
      "**/public",
      "**/.react-router",
      "**/build",
      "**/migrations",
    ],
  },
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      drizzle: drizzle,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowExportNames: [
            "loader",
            "clientLoader",
            "action",
            "clientAction",
            "ErrorBoundary",
            "HydrateFallback",
            "headers",
            "handle",
            "links",
            "meta",
            "shouldRevalidate",
          ],
        },
      ],
      ...drizzle.configs.recommended.rules,
    },
  },
  {
    files: ["apps/backend/**/*.{ts,tsx}"],
    rules: {
      // Wymusza ostrzeżenie dla console.log, console.info, console.debug itd.
      "no-console": ["warn"],
    },
  },
  {
    // --- WYŁĄCZENIE REGUŁY DLA KATALOGU LOGS ---
    files: ["apps/backend/src/logs/**/*.{ts,tsx}", "apps/backend/src/env.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // TEMP FIX, za dużo błędów związanych z użyciem 'any' zamiast wskazania typu
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
    },
  },
  {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
    },
  }
);
