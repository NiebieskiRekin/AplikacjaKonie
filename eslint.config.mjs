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
        { allowConstantExport: true },
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
    // --- WYŁĄCZENIE REGUŁY DLA KALOGU LOGS ---
    files: ["apps/backend/logs/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  }
);
