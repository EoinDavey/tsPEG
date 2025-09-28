import tslint from "typescript-eslint";
import jslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
    {
        ignores: ["**/node_modules", "**/tsbuild", "src/**/parser.ts", "src/meta.ts"],
    },
    jslint.configs.recommended,
    tslint.configs.strict,
    {
        plugins: {
          '@stylistic': stylistic
        },
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

            "space-infix-ops": "warn",

            "sort-imports": ["warn", {
                ignoreCase: false,
                ignoreMemberSort: false,
                ignoreDeclarationSort: true,
                memberSyntaxSortOrder: ["none", "single", "multiple", "all"],
                allowSeparatedGroups: false,
            }],

            "no-var": "error",
            "prefer-const": "warn",

            "@stylistic/indent": ["warn", 4],
            "@stylistic/brace-style": ["warn", "1tbs"],
            "@stylistic/comma-spacing": "warn",
            "@stylistic/key-spacing": "warn",
            "@stylistic/semi": ["warn", "always"],
            "@stylistic/arrow-spacing": "warn",
            "@stylistic/comma-dangle": ["warn", "always-multiline"],
        },
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-non-null-assertion": "off",
        },
    },
]);
