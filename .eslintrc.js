module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "eqeqeq": ["error", "always"],
        "no-promise-executor-return": "error",
        "no-template-curly-in-string": "error",
        "no-else-return": ["error", {allowElseIf: false}],
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-loop-func": "error",
        "no-useless-concat": "error",
        "no-shadow": "error",
        "brace-style": ["warn", "1tbs", {allowSingleLine: true}],
        "comma-spacing": "warn",
        "key-spacing": "warn",
        "semi": ["error", "always"],
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
        "comma-spacing": "warn",
        "no-var": "error",
        "prefer-const": "warn",
    },
    overrides: [
        {
            // Disabling non-null assertions checks in tests because we are asserting
            // them to be non-null with jest, the type system is just not aware of
            // that
            files: ["**/*.test.ts"],
            rules: {
                "@typescript-eslint/no-non-null-assertion": "off"
            }
        }
    ]
};
