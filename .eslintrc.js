const rules = {
    root: true,
    parser: "@typescript-eslint/parser",
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
        ecmaFeatures: {
            jsx: true,
        },
    },
    // Limit TypeScript linting to TS/TSX
    // https://github.com/typescript-eslint/typescript-eslint/issues/1928
    overrides: [
        {
            files: ["src/**/*.{ts,tsx}"],
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                // "plugin:eslint-plugin-tsdoc/recommended"
            ],
            rules: {
                "@typescript-eslint/ban-ts-comment": "off",
                "@typescript-eslint/explicit-function-return-type": "off",
                "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
                // All the @typescript-eslint/* rules here...
                "@typescript-eslint/no-unnecessary-type-arguments": "error",
                "@typescript-eslint/prefer-nullish-coalescing": "error",
                "@typescript-eslint/prefer-optional-chain": "error",
            },
            parser: "@typescript-eslint/parser",
            parserOptions: {
                tsconfigRootDir: "./",
                project: "./tsconfig.json",
            },
        },
        {
            files: ["packages/**/src/**/*.{ts,tsx}"],
            rules: {
                // "babylonjs/existing": "error",
                "babylonjs/available": [
                    "warn",
                    {
                        contexts: [
                            'PropertyDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                            // "FunctionExpression:not([accessibility=\"private\"]):not([accessibility=\"protected\"])",
                            // "ArrowFunctionExpression:not([accessibility=\"private\"]):not([accessibility=\"protected\"])",
                            'MethodDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                        ],
                    },
                ],
                "jsdoc/require-jsdoc": [
                    "warn",
                    {
                        contexts: [
                            "TSInterfaceDeclaration",
                            // "TSMethodSignature",
                            "TSPropertySignature",
                            'PropertyDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                            'ArrowFunctionExpression:not([accessibility="private"]):not([accessibility="protected"])',
                            "ClassDeclaration",
                            "ClassExpression",
                            "TSInterfaceDeclaration",
                            'FunctionDeclaration:not([accessibility="private"]):not([accessibility="protected"])',
                        ],
                        publicOnly: true,
                    },
                ],
                "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
                "@typescript-eslint/consistent-type-imports": ["error", { disallowTypeAnnotations: false, fixStyle: "separate-type-imports" }],
                "@typescript-eslint/no-this-alias": "error",
                "@typescript-eslint/naming-convention": [
                    "error",
                    {
                        selector: "default",
                        format: ["camelCase"],
                    },
                    {
                        selector: "import",
                        format: ["camelCase", "PascalCase"],
                    },
                    {
                        selector: "variable",
                        format: ["camelCase", "UPPER_CASE", "snake_case"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "parameter",
                        format: ["camelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "objectLiteralProperty",
                        format: ["camelCase", "snake_case", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "enumMember",
                        format: ["PascalCase", "UPPER_CASE"],
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["public", "static"],
                        format: ["PascalCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["private", "static"],
                        format: ["PascalCase", "UPPER_CASE"],
                        leadingUnderscore: "require",
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["protected", "static"],
                        format: ["PascalCase", "UPPER_CASE"],
                        leadingUnderscore: "require",
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["public"],
                        format: ["camelCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["private"],
                        format: ["camelCase"],
                        leadingUnderscore: "require",
                    },
                    {
                        selector: "memberLike",
                        modifiers: ["protected"],
                        format: ["camelCase"],
                        leadingUnderscore: "require",
                    },
                    {
                        selector: "typeLike",
                        format: ["PascalCase"],
                    },
                    {
                        selector: "variable",
                        modifiers: ["const", "global"],
                        format: ["PascalCase", "camelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "function",
                        format: ["PascalCase", "camelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "function",
                        modifiers: ["exported", "global"],
                        format: ["PascalCase", "camelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "interface",
                        format: ["PascalCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "class",
                        format: ["PascalCase"],
                        leadingUnderscore: "allow",
                    },
                ],
            },
        },
    ],
    env: {
        browser: true,
        node: true,
        jest: true,
    },
    plugins: [
        //   "react"
        // "prettier", // add this if we want to use prettier error reporting
        "jest",
        // "@typescript-eslint"
        "babylonjs",
        "jsdoc",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:jest/recommended",
        // "plugin:jsdoc/recommended",
        "prettier",
    ],
    settings: {
        react: {
            pragma: "h",
            createClass: "",
        },
        jsdoc: {
            ignorePrivate: true,
            ignoreInternal: true,
        },
    },
    rules: {
        // no console except time and timeEnd
        "no-console": [process.env.TF_BUILD ? "error" : "error", { allow: ["time", "timeEnd", "trace"] }],
        "block-spacing": "error",
        // "capitalized-comments": ["error", "always"],
        // ... All other rules (not @typescript-eslint/*)
        //   "react/no-adjacent-inline-elements": "error",
        //   "react/react-in-jsx-scope": "error",
        //   "react/self-closing-comp": "error",
        "import/no-unresolved": "off", // because of the way the repo is structured
        // todo - make this work with external modules
        "import/named": "error",
        "import/no-cycle": [1, { maxDepth: 1, ignoreExternal: true }],
        "import/no-internal-modules": [
            "error",
            {
                // {   "allow": ["**/*.ts", "**/*.tsx"]
                forbid: ["**/index", "**/"],
            },
        ],
        // Another way of implementing that:
        // "no-restricted-imports": ["error", {
        //     "patterns": [{
        //       "group": ["index"],
        //       "message": "Do not import from index"
        //     }]
        // }],
        // "no-duplicate-imports": ["error", { "includeExports": true }],
        // should be error, no?
        "no-unused-vars": "off",
        "no-empty": ["error", { allowEmptyCatch: true }],
        "space-infix-ops": "error",
        "template-curly-spacing": "error",
        "template-tag-spacing": "error",
        "jest/no-standalone-expect": ["error", { additionalTestBlockFunctions: ["afterEach"] }],
        "jest/valid-expect": "off",
        "babylonjs/syntax": "warn",
        "jsdoc/check-param-names": ["error", { checkRestProperty: false, checkDestructured: false }],
        "jsdoc/check-property-names": "error",
        "jsdoc/require-param": [
            "error",
            {
                checkDestructured: false,
                checkDestructuredRoots: false,
                checkRestProperty: false,
                enableFixer: false,
            },
        ],
        "jsdoc/require-param-name": "error",
        "jsdoc/require-returns": ["error", { checkGetters: false, checkConstructors: false }],
        "jsdoc/require-returns-check": "error",
        "import/export": "warn",
        "no-useless-escape": "warn",
        "no-case-declarations": "warn",
        "no-prototype-builtins": "warn",
        "no-loss-of-precision": "warn",
        "prefer-spread": "off",
        "prefer-rest-params": "off",
        "no-fallthrough": "warn",
        "no-async-promise-executor": "warn",
        "no-throw-literal": "error",
        // "prettier/prettier": "error" // add this if we want to use prettier error reporting.
    },
};

module.exports = rules;
