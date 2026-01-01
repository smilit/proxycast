import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", "src-tauri", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            // AddCustomProviderModal.tsx
            "validateCustomProviderForm",
            "isFormValid",
            "hasRequiredFields",
            // ApiKeyItem.tsx
            "extractApiKeyDisplayInfo",
            // ApiKeyList.tsx
            "getApiKeyListStats",
            // ApiKeyProviderSection.tsx
            "verifyProviderSelectionSync",
            "extractSelectionState",
            // ConnectionTestButton.tsx
            "getConnectionTestStatusInfo",
            // DeleteProviderDialog.tsx
            "canDeleteProvider",
            "isSystemProvider",
            // ProviderConfigForm.tsx
            "getFieldsForProviderType",
            "providerTypeRequiresField",
            // ProviderGroup.tsx
            "getGroupLabel",
            "isProviderInGroup",
            "getGroupOrder",
            // ProviderList.tsx
            "filterProviders",
            "groupProviders",
            "matchesSearchQuery",
            // ProviderListItem.tsx
            "extractListItemDisplayInfo",
            "getApiKeyCount",
            // ProviderSetting.tsx
            "extractProviderSettingInfo",
            // icons/providers/index.tsx
            "iconComponents",
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
