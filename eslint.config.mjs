// @ts-check
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginVitest from "@vitest/eslint-plugin";
import eslintPluginJsdoc from "eslint-plugin-jsdoc";
import eslintPluginGithub from "eslint-plugin-github";
import eslintPluginImport from "eslint-plugin-import";
import babylonjsPlugin from "./packages/tools/eslintBabylonPlugin/dist/index.js";
import { LintSourceFiles, LintTestFiles } from "./scripts/lint-globs.mjs";

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
    "FSR",
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

const testSourceFiles = ["packages/tools/tests/**/src/**/*.{ts,tsx,js}"];
const misusedPromiseOptions = {
    checksConditionals: true,
    checksVoidReturn: {
        arguments: false,
        attributes: false,
    },
};

const restrictedRuntimeImports = [
    {
        selector: 'ImportExpression[source.type="Literal"][source.value=/\\/(index)?$/]',
        message: "Use an explicit module path instead of an index or trailing-slash import",
    },
    {
        selector: 'CallExpression[callee.name="require"][arguments.0.type="Literal"][arguments.0.value=/\\/(index)?$/]',
        message: "Use an explicit module path instead of an index or trailing-slash import",
    },
    {
        selector: 'TSImportEqualsDeclaration[moduleReference.type="TSExternalModuleReference"][moduleReference.expression.value=/\\/$/]',
        message: "Do not import from trailing-slash module paths",
    },
    {
        selector: 'TSImportEqualsDeclaration[importKind!="type"][moduleReference.expression.value=/\\/index$/]',
        message: "Do not import values from index modules",
    },
];

export default defineConfig(
    // ===========================================
    // Global ignores (replaces .eslintignore)
    // ===========================================
    {
        ignores: [
            // Build outputs
            "dist/**",
            "**/dist/**",
            ".snapshot/**",

            // Generated shader files
            "**/Shaders/**/*.ts",
            "**/ShadersWGSL/**/*.ts",
            "**/*.fragment.ts",
            "**/*.vertex.ts",
            "**/*.fragment.d.ts",
            "**/*.vertex.d.ts",
            // Generated Smart Filter blocks
            "packages/dev/smartFilterBlocks/src/**/*.block.ts",

            // Public packages (generated)
            "packages/public/**",

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

    // ===========================================
    // Global language options
    // ===========================================
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
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
        rules: {
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
    // Production source rules
    // ===========================================
    {
        files: LintSourceFiles,
        ignores: testSourceFiles,
        rules: {
            // No console except allowed methods
            "no-console": ["error", { allow: ["time", "timeEnd", "trace"] }],

            // Import rules
            "import/no-unresolved": "off",
            // import/named is redundant — TypeScript already validates named imports
            "import/named": "off",
            // import/no-cycle is disabled for performance — it traverses the full
            // dependency graph and is the single most expensive rule in the config.
            // Circular dependencies are checked separately via `npm run lint:cycles`.
            "import/no-cycle": "off",
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            regex: "/index$|/$",
                            message: "Use an explicit module path instead of an index or trailing-slash import",
                        },
                    ],
                },
            ],
            "no-restricted-syntax": ["error", ...restrictedRuntimeImports],

            // General rules
            "no-unused-vars": "off",
            "no-empty": ["error", { allowEmptyCatch: true }],

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
            "import/no-duplicates": ["error", { "prefer-inline": true }],
            "import/consistent-type-specifier-style": ["error", "prefer-inline"],
            "import/export": "warn",
            "no-useless-escape": "warn",
            "no-case-declarations": "warn",
            "no-prototype-builtins": "warn",
            "no-loss-of-precision": "error",
            "no-fallthrough": "error",
            "no-async-promise-executor": "error",

            // Disabled rules
            "prefer-spread": "off",
            "prefer-rest-params": "off",

            // Errors
            "no-throw-literal": "error",
        },
    },

    // ===========================================
    // TypeScript files override
    // ===========================================
    {
        files: ["packages/**/src/**/*.ts", "packages/**/src/**/*.tsx"],
        ignores: testSourceFiles,
        extends: [tseslint.configs.recommendedTypeChecked],
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
            // Sparse device/delay tables intentionally preserve array indices.
            // Audit these advisory findings before making either policy blocking.
            "@typescript-eslint/no-array-delete": "warn",
            "@typescript-eslint/no-implied-eval": "off",
            "@typescript-eslint/no-duplicate-enum-values": "off",
            "@typescript-eslint/only-throw-error": "off",
            "@typescript-eslint/no-for-in-array": "warn",
            "@typescript-eslint/no-deprecated": "off",
            "@typescript-eslint/no-unnecessary-type-assertion": "off",

            // Async/Promise rules
            "@typescript-eslint/promise-function-async": "error",
            "@typescript-eslint/no-misused-promises": ["error", misusedPromiseOptions],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/return-await": ["error", "always"],
            "no-await-in-loop": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/prefer-promise-reject-errors": "error",
            "require-atomic-updates": "warn",
            "github/no-then": "error",

            // Other TypeScript rules
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/consistent-type-imports": ["error", { disallowTypeAnnotations: false, fixStyle: "inline-type-imports" }],
            "@typescript-eslint/no-this-alias": "error",

            // Restricted syntax
            "no-restricted-syntax": [
                "error",
                ...restrictedRuntimeImports,
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
            "no-restricted-imports": "off",
            "@typescript-eslint/no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["**/index"],
                            message: "Do not import from index files",
                            allowTypeImports: true,
                        },
                        {
                            regex: "/$",
                            message: "Do not import from trailing-slash module paths",
                        },
                    ],
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

    // These existing lazy Promise caches are typed as always present. Preserve
    // the existing conditional policy until their declarations are corrected.
    {
        files: [
            "packages/dev/core/src/Meshes/Node/Blocks/booleanGeometryBlock.pure.ts",
            "packages/dev/core/src/Meshes/csg2.ts",
            "packages/dev/loaders/src/glTF/glTFValidation.ts",
            "packages/tools/ktx2Decoder/src/Transcoders/liteTranscoder.ts",
            "packages/tools/ktx2Decoder/src/Transcoders/mscTranscoder.ts",
            "packages/tools/ktx2Decoder/src/zstddec.ts",
        ],
        rules: {
            "@typescript-eslint/no-misused-promises": ["error", { ...misusedPromiseOptions, checksConditionals: false }],
        },
    },
    {
        files: ["packages/dev/serializers/src/glTF/2.0/glTFMaterialExporter.ts"],
        rules: {
            // Existing occlusion-texture exporter requires a separate runtime fix.
            "no-async-promise-executor": "warn",
        },
    },

    // Tests use syntax-only TypeScript linting; public API conventions and
    // type-service startup costs belong to production source, not test fixtures.
    {
        files: [...LintTestFiles, ...testSourceFiles],
        extends: [tseslint.configs.recommended],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            // Introduce test-style policies as advisory without rewriting fixtures.
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-this-alias": "warn",
            "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true }],
            "prefer-const": "warn",
            "no-var": "warn",
            "no-useless-assignment": "warn",
            "no-unassigned-vars": "warn",
            // Playwright requires an object pattern for its fixture parameter.
            "no-empty-pattern": ["error", { allowObjectPatternsAsParameters: true }],
        },
    },
    {
        files: ["packages/**/test/unit/**/*.{test,spec}.{ts,tsx,js}"],
        extends: [eslintPluginVitest.configs.recommended],
        languageOptions: {
            globals: eslintPluginVitest.environments.env.globals,
        },
        rules: {
            "vitest/no-standalone-expect": ["error", { additionalTestBlockFunctions: ["afterEach"] }],
            "vitest/valid-expect": ["error", { maxArgs: 2 }],
            "vitest/no-conditional-expect": "warn",
            "vitest/no-commented-out-tests": "warn",
            "vitest/expect-expect": "warn",
            "vitest/valid-title": "warn",
        },
    },
    {
        files: [
            "packages/dev/addons/test/unit/atmosphere/sampling.test.ts",
            "packages/dev/loaders/test/unit/USD/usdFileLoader.test.ts",
            "packages/dev/loaders/test/unit/USD/usdSceneMaterializer.test.ts",
        ],
        rules: {
            // The installed rule misses matchers behind TS casts and assertions
            // stored in a variable then awaited after a cancellation is triggered.
            "vitest/valid-expect": ["warn", { maxArgs: 2 }],
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
        files: ["packages/dev/**/src/**/*.{ts,tsx}"],
        rules: {
            "babylonjs/no-directory-barrel-imports": "error",
        },
    },

    // ===========================================
    // Pure files: require /*#__PURE__*/ on top-level calls
    // ===========================================
    {
        files: ["packages/dev/{core,gui,loaders,serializers}/src/**/*.pure.ts"],
        rules: {
            "babylonjs/require-pure-annotation": "error",
            // Review newly discovered initializers before annotating them: an
            // annotation on an actually effectful call would change bundling.
            "babylonjs/require-nested-pure-annotation": "warn",
        },
    },

    // ===========================================
    // Pure files: no side-effect (bare) imports
    // ===========================================
    {
        files: ["packages/dev/{core,gui,loaders,serializers}/src/**/*.pure.ts", "packages/dev/{core,gui,loaders,serializers}/src/**/pure.ts"],
        rules: {
            "babylonjs/no-side-effect-imports-in-pure": "error",
        },
    },

    // ===========================================
    // Babylon Native ES5 downlevel guard
    // ===========================================
    {
        files: [
            "packages/dev/core/src/**/*.ts",
            "packages/dev/gui/src/**/*.ts",
            "packages/dev/loaders/src/**/*.ts",
            "packages/dev/materials/src/**/*.ts",
            "packages/dev/serializers/src/**/*.ts",
            "packages/dev/postProcesses/src/**/*.ts",
            "packages/dev/proceduralTextures/src/**/*.ts",
            "packages/dev/addons/src/**/*.ts",
        ],
        rules: {
            "babylonjs/no-super-in-accessor": "error",
        },
    },
    eslintConfigPrettier,
    {
        files: LintSourceFiles,
        ignores: testSourceFiles,
        // Requiring all braces is compatible with Prettier and remains a blocking policy.
        rules: {
            curly: ["error", "all"],
        },
    }
);
