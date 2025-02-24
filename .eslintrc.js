const allowedNonStrictAbbreviations = "HTML|BRDF|GUI|LOD|XR|PBR|IBL|HDR|SSR|SSAO|SMAA|MSAA|FXAA|GPU|FPS|CSS|MP3|OGG|HRTF|JSON|ZOffset|IK|UV|[XYZ]Axis|VR|axis[XYZ]";

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
                "@typescript-eslint/naming-convention": [
                    "error",
                    {
                        selector: "variable",
                        types: ["boolean"],
                        format: ["PascalCase"],
                        prefix: ["is", "should", "has", "can"],
                    },
                ],
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
                        format: ["strictCamelCase"],
                    },
                    {
                        selector: "import",
                        format: ["strictCamelCase", "StrictPascalCase"],
                    },
                    {
                        selector: "variable",
                        format: ["strictCamelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "parameter",
                        format: ["strictCamelCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "objectLiteralProperty",
                        format: ["strictCamelCase", "snake_case", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "enumMember",
                        format: ["StrictPascalCase", "UPPER_CASE"],
                    },
                    // public static members of classes, including constants
                    {
                        selector: "memberLike",
                        modifiers: ["public", "static"],
                        format: ["StrictPascalCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    // private static members of classes
                    {
                        selector: "memberLike",
                        modifiers: ["private", "static"],
                        format: ["StrictPascalCase", "UPPER_CASE"],
                        leadingUnderscore: "require",
                    },
                    // protected static members of classes
                    {
                        selector: "memberLike",
                        modifiers: ["protected", "static"],
                        format: ["StrictPascalCase", "UPPER_CASE"],
                        leadingUnderscore: "require",
                    },
                    // public instance members of classes, including constants
                    {
                        selector: "memberLike",
                        modifiers: ["public"],
                        format: ["strictCamelCase", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                    },
                    // private instance members of classes
                    {
                        selector: "memberLike",
                        modifiers: ["private"],
                        format: ["strictCamelCase"],
                        leadingUnderscore: "require",
                    },
                    // protected instance members of classes
                    {
                        selector: "memberLike",
                        modifiers: ["protected"],
                        format: ["strictCamelCase"],
                        leadingUnderscore: "require",
                    },
                    // async suffix
                    {
                        selector: "memberLike",
                        modifiers: ["async"],
                        suffix: ["Async"],
                        format: ["strictCamelCase", "StrictPascalCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "typeLike", // class, interface, enum, type alias
                        format: ["StrictPascalCase"],
                    },
                    // exported variables and functions, module-level
                    {
                        selector: "variable",
                        modifiers: ["const", "global", "exported"],
                        format: ["StrictPascalCase" /*, "strictCamelCase"*/],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "function",
                        format: ["StrictPascalCase" /*, "strictCamelCase"*/],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "function",
                        modifiers: ["exported", "global"],
                        format: ["StrictPascalCase" /*, "strictCamelCase"*/],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "interface",
                        format: ["StrictPascalCase"],
                        leadingUnderscore: "allow",
                        prefix: ["I"],
                        filter: {
                            regex: "Window",
                            match: false,
                        },
                    },
                    {
                        selector: "class",
                        format: ["StrictPascalCase"],
                        leadingUnderscore: "allow",
                    },
                    // Remove the strictCamelCase (move to simple camelCase) requirement for abbreviations like HTML, GUI, BRDF, etc.
                    {
                        selector: ["memberLike", "variable", "property", "parameter"],
                        format: ["camelCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: ["memberLike", "variable", "property", "class"],
                        format: ["PascalCase"],
                        modifiers: ["static"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: ["class"],
                        format: ["PascalCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
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
        "prettier",
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
        "plugin:prettier/recommended",
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
    },
};

module.exports = rules;
