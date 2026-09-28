import { RuleTester } from "eslint";
import * as fs from "fs";
import * as path from "path";
import * as tsParser from "@typescript-eslint/parser";
import { afterEach, describe, expect, test } from "vitest";
import plugin from "../../src/index";
import { SideEffectsManifestLoader } from "../../src/SideEffectsManifest";

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
});

const packageSourceFile = (packageName: "core" | "gui" | "loaders" | "serializers", filename = "probe.pure.ts") =>
    path.join(process.cwd(), "packages", "dev", packageName, "src", filename);

ruleTester.run("no-side-effect-imports-in-pure", plugin.rules["no-side-effect-imports-in-pure"], {
    valid: [
        {
            filename: packageSourceFile("gui"),
            code: `import type { Control } from "./2D/controls/control";`,
        },
        {
            filename: packageSourceFile("gui"),
            code: `import { type Control } from "gui/2D/controls/control";`,
        },
        {
            filename: packageSourceFile("gui"),
            code: `import { Control } from "./2D/controls/control.pure";`,
        },
        {
            filename: packageSourceFile("loaders"),
            code: `import { OBJFileLoader } from "loaders/OBJ/objFileLoader.pure";`,
        },
    ],
    invalid: [
        {
            filename: packageSourceFile("core"),
            code: `import { Scene } from "./scene";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `import { Control } from "./2D/controls/control";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `import { Control } from "gui/2D/controls/control";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `import { Control } from "@babylonjs/gui/2D/controls/control";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("loaders"),
            code: `import { OBJFileLoader } from "loaders/OBJ/objFileLoader";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("serializers"),
            code: `import { KHRLightsPunctual } from "@babylonjs/serializers/glTF/2.0/Extensions/KHR_lights_punctual";`,
            errors: [{ messageId: "unsafeValueImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `import "./2D/controls/control";`,
            errors: [{ messageId: "bareImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `const controlModule = import("./2D/controls/control");`,
            errors: [{ messageId: "unsafeDynamicImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `const controlModule = import("./2D/controls/control.js");`,
            errors: [{ messageId: "unsafeDynamicImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `const controlModule = import("@babylonjs/gui/2D/controls/control.ts");`,
            errors: [{ messageId: "unsafeDynamicImport" }],
        },
        {
            filename: packageSourceFile("gui"),
            code: `const controlModule = import("gui/2D/controls/control.js");`,
            errors: [{ messageId: "unsafeDynamicImport" }],
        },
        {
            filename: packageSourceFile("gui", "pure.ts"),
            code: `export { Control } from "./2D/controls/control";`,
            errors: [{ messageId: "unsafeBarrelReExport" }],
        },
    ],
});

ruleTester.run("require-context-save-before-apply-states", plugin.rules["require-context-save-before-apply-states"], {
    valid: [
        `
            class Control {
                draw(context) {
                    context.save();
                    this._applyStates(context);
                    context.restore();
                }
            }
        `,
        `
            class Control {
                draw(context, condition) {
                    if (condition) {
                        context.save();
                        this._applyStates(context);
                        context.restore();
                    }
                }
            }
        `,
        `
            class Control {
                draw(context, condition) {
                    if (condition) {
                        context.save();
                    } else {
                        context.save();
                    }
                    this._applyStates(context);
                    context.restore();
                }
            }
        `,
    ],
    invalid: [
        {
            code: `class Control { draw(context) { context.save(); context.restore() && context.save(); this._applyStates(context); } }`,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `class Control { draw(context) { context.save(); while (context.restore()) {} this._applyStates(context); } }`,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context) {
                        context.save();
                        context.restore();
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context, condition) {
                        if (condition) {
                            context.save();
                        }
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context) {
                        const saveLater = () => context.save();
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context, condition) {
                        context.save();
                        context.save();
                        while (condition) {
                            context.restore();
                        }
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context) {
                        context.save();
                        try {
                            context.restore();
                            throw new Error();
                        } catch {
                        }
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context, condition) {
                        context.save();
                        if ((context.restore(), condition)) {
                        }
                        this._applyStates(context);
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
        {
            code: `
                class Control {
                    draw(context) {
                        context.save();
                        (context.restore(), this._applyStates(context));
                    }
                }
            `,
            errors: [{ messageId: "missingSave" }],
        },
    ],
});

ruleTester.run("require-pure-annotation", plugin.rules["require-pure-annotation"], {
    valid: [
        {
            filename: packageSourceFile("core"),
            code: `export const value = new Widget();`,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = condition ? new Widget() : null;`,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = /*#__PURE__*/ createValue(() => new Widget());`,
        },
        {
            filename: packageSourceFile("core"),
            code: `function createValue() { return new Widget(); }`,
        },
        {
            filename: packageSourceFile("core"),
            code: `class Holder { value = new Widget(); }`,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = { nested: new Widget() };`,
        },
    ],
    invalid: [
        {
            filename: packageSourceFile("core"),
            code: `const value = new Widget();`,
            errors: [{ messageId: "missing-pure-annotation" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `class Holder { static value = new Widget(); }`,
            errors: [{ messageId: "missing-pure-annotation" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `function createHolder() { return class Holder { static value = new Widget(); }; }`,
            errors: [{ messageId: "missing-pure-annotation" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `new Widget();`,
            errors: [{ messageId: "missing-pure-annotation" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = new Vector3();`,
            output: `const value = /*#__PURE__*/ new Vector3();`,
            errors: [{ messageId: "missing-pure-annotation" }],
        },
    ],
});

ruleTester.run("require-nested-pure-annotation", plugin.rules["require-nested-pure-annotation"], {
    valid: [
        {
            filename: packageSourceFile("core"),
            code: `const value = new Widget();`,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = condition ? /*#__PURE__*/ new Widget() : null;`,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = /*#__PURE__*/ createValue(() => new Widget());`,
        },
        {
            filename: packageSourceFile("core"),
            code: `function createValue() { return { nested: new Widget() }; }`,
        },
    ],
    invalid: [
        {
            filename: packageSourceFile("core"),
            code: `export const value = new Widget();`,
            errors: [{ messageId: "nested-pure-review" }],
            output: null,
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = condition ? new Widget() : null;`,
            errors: [{ messageId: "nested-pure-review" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `const value = { nested: new Widget() };`,
            errors: [{ messageId: "nested-pure-review" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `class Holder { static value = condition ? new Widget() : null; }`,
            errors: [{ messageId: "nested-pure-review" }],
        },
        {
            filename: packageSourceFile("core"),
            code: `if (condition) { const value = new Widget(); }`,
            errors: [{ messageId: "nested-pure-review" }],
        },
    ],
});

describe("SideEffectsManifestLoader", () => {
    const fixtureRoot = path.join(process.cwd(), "packages", "tools", "eslintBabylonPlugin", "test", "unit", `.manifest-fixture-${process.pid}`);

    afterEach(() => {
        fs.rmSync(fixtureRoot, { recursive: true, force: true });
    });

    test("refreshes changed manifests after the cache interval", () => {
        const packageRoot = path.join(fixtureRoot, "core");
        const shardPath = path.join(packageRoot, "Root.json");
        fs.mkdirSync(packageRoot, { recursive: true });
        fs.writeFileSync(shardPath, JSON.stringify({ files: { "first.ts": [] } }));

        let now = 0;
        const loader = new SideEffectsManifestLoader(fixtureRoot, () => now);
        expect(loader.load("core").files).toEqual(new Set(["first.ts"]));

        fs.writeFileSync(shardPath, JSON.stringify({ files: { "second-longer-name.ts": [] } }));
        now = 999;
        expect(loader.load("core").files).toEqual(new Set(["first.ts"]));

        now = 1000;
        expect(loader.load("core").files).toEqual(new Set(["second-longer-name.ts"]));
    });

    test("reports malformed manifest paths", () => {
        const packageRoot = path.join(fixtureRoot, "gui");
        const shardPath = path.join(packageRoot, "Broken.json");
        fs.mkdirSync(packageRoot, { recursive: true });
        fs.writeFileSync(shardPath, "{ malformed");

        const loader = new SideEffectsManifestLoader(fixtureRoot);
        expect(() => loader.load("gui")).toThrow(`Failed to parse manifest at "${shardPath}"`);
    });

    test.each([null, [], { files: [3] }, { manifest: [{}] }])("reports invalid manifest structures: %j", (manifest) => {
        const packageRoot = path.join(fixtureRoot, "gui");
        const shardPath = path.join(packageRoot, "Invalid.json");
        fs.mkdirSync(packageRoot, { recursive: true });
        fs.writeFileSync(shardPath, JSON.stringify(manifest));

        const loader = new SideEffectsManifestLoader(fixtureRoot);
        expect(() => loader.load("gui")).toThrow(`Failed to validate manifest at "${shardPath}"`);
    });
});
