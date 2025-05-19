// want to add a new allowed abbreviation? Fear not! Just add it to the regex below.
// The regex is used to allow abbreviations in strict camelCase and PascalCase.
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

// Join them into a single regex string
const allowedNonStrictAbbreviations = abbreviations.join("|");
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
            files: ["packages/**/src/**/*.{ts,tsx}"],
            extends: [
                "plugin:@typescript-eslint/eslint-recommended",
                "plugin:@typescript-eslint/recommended",
                "plugin:@typescript-eslint/recommended-requiring-type-checking",
                // "plugin:eslint-plugin-tsdoc/recommended"
            ],
            parserOptions: {
                projectService: true,
            },
            parser: "@typescript-eslint/parser",
            rules: {
                "babylonjs/available": [
                    "warn",
                    {
                        contexts: [
                            'PropertyDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                            'MethodDefinition:not([accessibility="private"]):not([accessibility="protected"])',
                        ],
                    },
                ],
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
                "prefer-rest-params": "off",
                // the following were enabled per default
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
                // till here
                // async fun
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
                // rest of the rules
                "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
                "@typescript-eslint/consistent-type-imports": ["error", { disallowTypeAnnotations: false, fixStyle: "separate-type-imports" }],
                "@typescript-eslint/no-this-alias": "error",
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
                        format: ["StrictPascalCase"],
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "function",
                        modifiers: [/*"exported", */ "global"],
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
                    // Remove the strict requirement for abbreviations like HTML, GUI, BRDF, etc.
                    {
                        selector: "default",
                        format: ["camelCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: ["memberLike", "property", "parameter"],
                        format: ["camelCase", "UPPER_CASE"],
                        filter: {
                            // you can expand this regex to add more allowed names
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
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "class",
                        format: ["PascalCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
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
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                        leadingUnderscore: "allow",
                    },
                    {
                        selector: "import",
                        format: ["camelCase", "PascalCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: "objectLiteralProperty",
                        format: ["camelCase", "snake_case", "UPPER_CASE"],
                        leadingUnderscore: "allow",
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: "variable",
                        format: ["PascalCase"],
                        modifiers: ["global"],
                        leadingUnderscore: "allow",
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: "function",
                        modifiers: [/*"exported", */ "global"],
                        format: ["PascalCase"],
                        leadingUnderscore: "allow",
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: "enumMember",
                        format: ["PascalCase", "UPPER_CASE"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
                    },
                    {
                        selector: "typeLike", // class, interface, enum, type alias
                        format: ["PascalCase"],
                        filter: {
                            // you can expand this regex to add more allowed names
                            regex: allowedNonStrictAbbreviations,
                            match: true,
                        },
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
        "github",
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
        curly: "error",
    },
};

module.exports = rules;
