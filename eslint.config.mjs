import tslint from "typescript-eslint";
import jslint from "@eslint/js";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: ["**/node_modules", "**/tsbuild", "src/**/parser.ts", "src/meta.ts"],
    },
    jslint.configs.recommended,
    tslint.configs.strict,
    {
        rules: {
            eqeqeq: ["error", "always"],
            "no-promise-executor-return": "error",
            "no-template-curly-in-string": "error",

            "no-else-return": ["error", {
                allowElseIf: false,
            }],

            "no-eval": "error",
            "no-implied-eval": "error",
            "no-loop-func": "error",
            "no-useless-concat": "error",
            "no-shadow": "error",

            "brace-style": ["warn", "1tbs", {
                allowSingleLine: true,
            }],

            "comma-spacing": "warn",
            "key-spacing": "warn",
            semi: ["error", "always"],
            "space-infix-ops": "warn",

            "sort-imports": ["warn", {
                ignoreCase: false,
                ignoreMemberSort: false,
                ignoreDeclarationSort: true,
                memberSyntaxSortOrder: ["none", "single", "multiple", "all"],
                allowSeparatedGroups: false,
            }],

            "arrow-spacing": "warn",
            "comma-dangle": ["warn", "always-multiline"],
            "no-var": "error",
            "prefer-const": "warn",
        },
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
]);
