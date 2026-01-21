// @ts-check
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginJest from "eslint-plugin-jest";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";
import eslintPluginGithub from "eslint-plugin-github";
import eslintPluginImport from "eslint-plugin-import";
import babylonjsPlugin from "./packages/tools/eslintBabylonPlugin/dist/index.js";

// Allowed abbreviations for naming conventions
const abbreviations = [
    "[XYZ][A-Z][a-z]",
    "HTML",
    "UI",
    "LOD",
    "XR",
    "PBR",
    "IBL",
    "HDR",
    "FFT",
    "CB",
    "RTW",
    "SSR",
    "RHS",
    "LHS",
    "LTC",
    "CDN",
    "ARIA",
    "IES",
    "RLE",
    "SSAO",
    "NME",
    "NGE",
    "SMAA",
    "RT",
    "TAA",
    "PT",
    "PP",
    "GI",
    "GBuffer",
    "[Bb]lur[XY]",
    "upsampling[XY]",
    "RSM",
    "DoF",
    "MSAA",
    "FXAA",
    "TBN",
    "GPU",
    "CPU",
    "FPS",
    "CSS",
    "MP3",
    "OGG",
    "HRTF",
    "JSON",
    "ZOffset",
    "IK",
    "UV",
    "[XYZ]Axis",
    "VR",
    "axis[XYZ]",
    "UBO",
    "URL",
    "RGB",
    "RGBD",
    "GL",
    "[23]D",
    "MRT",
    "RTT",
    "WGSL",
    "GLSL",
    "OS",
    "NDCH",
    "CSM",
    "POT",
    "DOM",
    "WASM",
    "BRDF",
    "wheel[XYZ]",
    "PLY",
    "STL",
    "[AB]Texture",
    "CSG",
    "DoN",
    "RAW",
    "ZIP",
    "PIZ",
    "VAO",
    "JS",
    "DB",
    "XHR",
    "POV",
    "BABYLON",
    "HSV",
    "[VUW](Offset|Rotation|Scale|Ang)",
    "DDS",
    "NaN",
    "SVG",
    "MRDL",
    "MTL",
    "OBJ",
    "SPLAT",
    "PLY",
    "glTF",
    "GLTF",
    "MSFT",
    "MSC",
    "QR",
    "BGR",
    "SFE",
    "BVH",
];

// Join abbreviations into regex string for naming convention rules
const allowedNonStrictAbbreviations = abbreviations.join("|");

export default tseslint.config(
    // ===========================================
    // Global ignores (replaces .eslintignore)
    // ===========================================
    {
        ignores: [
            // Build outputs
            "dist/**",
            "**/dist/**",
            ".snapshot/**",

            // Test files (handled separately or not linted)
            "**/tests/**",

            // Generated shader files
            "**/Shaders/**/*.ts",
            "**/ShadersWGSL/**/*.ts",
            "**/*.fragment.ts",
            "**/*.vertex.ts",

            // Public/LTS packages (generated)
            "packages/public/**",
            "packages/lts/**",

            // Non-JS files
            "**/*.md",
            "**/*.fx",
            "**/*.scss",
            "**/*.css",
            "**/*.html",

            // Config files at root
            "*.config.js",
            "*.config.ts",

            // Node modules
            "node_modules/**",
            "**/node_modules/**",
        ],
    },

    // ===========================================
    // Base recommended configurations
    // ===========================================
    js.configs.recommended,
    eslintConfigPrettier,

    // ===========================================
    // Global language options
    // ===========================================
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.jest,
            },
            parser: tseslint.parser,
            parserOptions: {
                sourceType: "module",
                ecmaVersion: 2020,
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            prettier: eslintPluginPrettier,
        },
        rules: {
            "prettier/prettier": "error",
            "arrow-body-style": "off",
            "prefer-arrow-callback": "off",
        },
    },

    // ===========================================
    // Plugin registrations and settings
    // ===========================================
    {
        plugins: {
            babylonjs: babylonjsPlugin,
            jsdoc: eslintPluginJsdoc,
            github: eslintPluginGithub,
            import: eslintPluginImport,
            jest: eslintPluginJest,
        },
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
    },

    // ===========================================
    // Jest plugin config
    // ===========================================
    eslintPluginJest.configs["flat/recommended"],

    // ===========================================
    // Global rules (apply to all matched files)
    // ===========================================
    {
        rules: {
            // No console except allowed methods
            "no-console": ["error", { allow: ["time", "timeEnd", "trace"] }],
            "block-spacing": "error",

            // Import rules
            "import/no-unresolved": "off",
            "import/named": "error",
            "import/no-cycle": [1, { maxDepth: 1, ignoreExternal: true }],
            "import/no-internal-modules": [
                "error",
                {
                    forbid: ["**/index", "**/"],
                },
            ],

            // General rules
            "no-unused-vars": "off",
            "no-empty": ["error", { allowEmptyCatch: true }],
            "space-infix-ops": "error",
            "template-curly-spacing": "error",
            "template-tag-spacing": "error",

            // Jest rules
            "jest/no-standalone-expect": ["error", { additionalTestBlockFunctions: ["afterEach"] }],
            "jest/valid-expect": "off",

            // Babylon.js custom rules
            "babylonjs/syntax": "warn",
            "babylonjs/no-cross-package-relative-imports": "error",

            // JSDoc rules
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

            // Warnings
            "import/export": "warn",
            "no-useless-escape": "warn",
            "no-case-declarations": "warn",
            "no-prototype-builtins": "warn",
            "no-loss-of-precision": "warn",
            "no-fallthrough": "warn",
            "no-async-promise-executor": "warn",

            // Disabled rules
            "prefer-spread": "off",
            "prefer-rest-params": "off",

            // Errors
            "no-throw-literal": "error",
            curly: "error",
        },
    },

    // ===========================================
    // TypeScript files override
    // ===========================================
    {
        files: ["packages/**/src/**/*.ts", "packages/**/src/**/*.tsx"],
        extends: [...tseslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            // babylonjs/available rule
            "babylonjs/available": [
                "warn",
                {
                    contexts: [
                        'PropertyDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                        'MethodDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                    ],
                },
            ],

            // jsdoc/require-jsdoc rule
            "jsdoc/require-jsdoc": [
                "warn",
                {
                    contexts: [
                        "TSInterfaceDeclaration",
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

            // Disabled recommended rules
            "prefer-rest-params": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-enum-comparison": "off",
            "@typescript-eslint/unbound-method": "off",
            "@typescript-eslint/no-base-to-string": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-unsafe-function-type": "off",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-unsafe-declaration-merging": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/no-unnecessary-type-constraint": "off",
            "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-array-delete": "off",
            "@typescript-eslint/no-implied-eval": "off",
            "@typescript-eslint/no-duplicate-enum-values": "off",
            "@typescript-eslint/only-throw-error": "off",
            "@typescript-eslint/no-for-in-array": "off",
            "@typescript-eslint/no-deprecated": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",

            // Async/Promise rules
            "@typescript-eslint/promise-function-async": "error",
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksConditionals: false,
                    checksVoidReturn: {
                        arguments: false,
                        attributes: false,
                    },
                },
            ],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/return-await": ["error", "always"],
            "no-await-in-loop": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/prefer-promise-reject-errors": "error",
            "require-atomic-updates": "warn",
            "github/no-then": "error",

            // Other TypeScript rules
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": ["error", { disallowTypeAnnotations: false, fixStyle: "separate-type-imports" }],
            "@typescript-eslint/no-this-alias": "error",

            // Restricted syntax
            "no-restricted-syntax": [
                "error",
                {
                    selector: "FunctionDeclaration[async=false][id.name=/Async$/]",
                    message: "Function ending in 'Async' must be declared async",
                },
                {
                    selector: "MethodDefinition[value.async=false][key.name=/Async$/]",
                    message: "Method ending in 'Async' must be declared async",
                },
                {
                    selector: "Property[value.type=/FunctionExpression$/][value.async=false][key.name=/Async$/]",
                    message: "Function ending in 'Async' must be declared async",
                },
                {
                    selector: "VariableDeclarator[init.type=/FunctionExpression$/][init.async=false][id.name=/Async$/]",
                    message: "Function ending in 'Async' must be declared async",
                },
                {
                    selector: "VariableDeclarator[init.type=/FunctionExpression$/][init.async=true][id.name!=/Async$/]",
                    message: "Async function name must end in 'Async'",
                },
            ],

            // Import restrictions for TypeScript
            "@typescript-eslint/no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/index"],
                            message: "Do not import from index files",
                            allowTypeImports: true,
                        },
                    ],
                },
            ],

            "import/no-internal-modules": [
                "error",
                {
                    forbid: ["**/"],
                },
            ],

            // Naming conventions
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
                // Allow any casing for destructured variables
                {
                    selector: "variable",
                    format: null,
                    modifiers: ["destructured"],
                },
                {
                    selector: "variable",
                    format: ["StrictPascalCase", "UPPER_CASE"],
                    modifiers: ["global"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "variable",
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "parameter",
                    format: ["camelCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "objectLiteralProperty",
                    format: ["strictCamelCase", "snake_case", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                },
                // Allow CSS selector patterns in object literals (e.g., "> *", "&:hover", ":first-child")
                {
                    selector: "objectLiteralProperty",
                    format: null,
                    filter: {
                        regex: "^[>&:.*#\\[]",
                        match: true,
                    },
                },
                {
                    selector: "enumMember",
                    format: ["StrictPascalCase", "UPPER_CASE"],
                },
                // Public static members of classes
                {
                    selector: "memberLike",
                    modifiers: ["public", "static"],
                    format: ["StrictPascalCase", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                },
                // Private static members
                {
                    selector: "memberLike",
                    modifiers: ["private", "static"],
                    format: ["StrictPascalCase", "UPPER_CASE"],
                    leadingUnderscore: "require",
                },
                // Protected static members
                {
                    selector: "memberLike",
                    modifiers: ["protected", "static"],
                    format: ["StrictPascalCase", "UPPER_CASE"],
                    leadingUnderscore: "require",
                },
                // Public instance members
                {
                    selector: "memberLike",
                    modifiers: ["public"],
                    format: ["strictCamelCase", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                },
                // Private instance members
                {
                    selector: "memberLike",
                    modifiers: ["private"],
                    format: ["strictCamelCase"],
                    leadingUnderscore: "require",
                },
                // Protected instance members
                {
                    selector: "memberLike",
                    modifiers: ["protected"],
                    format: ["strictCamelCase"],
                    leadingUnderscore: "require",
                },
                // Async suffix
                {
                    selector: "memberLike",
                    modifiers: ["async"],
                    suffix: ["Async"],
                    format: ["strictCamelCase", "StrictPascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "typeLike",
                    format: ["StrictPascalCase"],
                },
                // Exported const variables
                {
                    selector: "variable",
                    modifiers: ["const", "global", "exported"],
                    format: ["StrictPascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "function",
                    modifiers: ["global"],
                    format: ["StrictPascalCase"],
                    leadingUnderscore: "allow",
                },
                {
                    selector: "interface",
                    format: ["StrictPascalCase"],
                    leadingUnderscore: "allow",
                    prefix: ["I"],
                },
                {
                    selector: "class",
                    format: ["StrictPascalCase"],
                    leadingUnderscore: "allow",
                },
                // Abbreviation exceptions
                {
                    selector: "default",
                    format: ["camelCase"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                {
                    selector: ["memberLike", "property", "parameter"],
                    format: ["camelCase", "UPPER_CASE"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                    leadingUnderscore: "allow",
                },
                {
                    selector: ["memberLike", "variable", "property", "class"],
                    format: ["PascalCase", "UPPER_CASE"],
                    modifiers: ["static"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                    leadingUnderscore: "allow",
                },
                {
                    selector: "class",
                    format: ["PascalCase"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                    leadingUnderscore: "allow",
                },
                {
                    selector: "interface",
                    format: ["PascalCase"],
                    prefix: ["I"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                    leadingUnderscore: "allow",
                },
                {
                    selector: "import",
                    format: ["camelCase", "PascalCase"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                {
                    selector: "objectLiteralProperty",
                    format: ["camelCase", "snake_case", "UPPER_CASE"],
                    leadingUnderscore: "allow",
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                // Exception for hooks starting with 'use'
                {
                    selector: "variable",
                    format: ["strictCamelCase"],
                    modifiers: ["global"],
                    filter: {
                        regex: "^use",
                        match: true,
                    },
                },
                {
                    selector: "function",
                    format: ["strictCamelCase"],
                    modifiers: ["global"],
                    filter: {
                        regex: "^use",
                        match: true,
                    },
                },
                {
                    selector: "variable",
                    format: ["PascalCase"],
                    modifiers: ["global"],
                    leadingUnderscore: "allow",
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                {
                    selector: "function",
                    modifiers: ["global"],
                    format: ["PascalCase"],
                    leadingUnderscore: "allow",
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                {
                    selector: "enumMember",
                    format: ["PascalCase", "UPPER_CASE"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"],
                    filter: {
                        regex: allowedNonStrictAbbreviations,
                        match: true,
                    },
                },
            ],
        },
    },

    // ===========================================
    // GUI Controls override
    // Requires context.save() before _applyStates()
    // ===========================================
    {
        files: ["packages/dev/gui/src/2D/controls/**/*.ts", "packages/dev/gui/src/2D/controls/**/*.tsx"],
        rules: {
            "babylonjs/require-context-save-before-apply-states": "error",
        },
    },
    {
        // Dev packages produce the public packages that use add-js-to-es6 post-processing,
        // which appends .js to imports. Directory imports like "core/Foo" become "core/Foo.js"
        // which fails if Foo is a directory. This rule catches those cases.
        files: ["packages/dev/**/*.{ts,tsx}"],
        rules: {
            "babylonjs/no-directory-barrel-imports": "error",
        },
    }
);
