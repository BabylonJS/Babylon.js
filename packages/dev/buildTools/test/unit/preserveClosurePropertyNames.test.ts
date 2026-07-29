import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CollectClosureSensitivePropertyNames, PreserveClosurePropertyNames } from "../../src/preserveClosurePropertyNames";

describe("Closure Compiler property preservation", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-closure-properties-"));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("collects dynamic callback and backing property names", () => {
        const propertyNames = CollectClosureSensitivePropertyNames(`
            decorators = [expandToProperty("_reorderLightsInScene")];
            __esDecorate(Light, null, decorators, { kind: "accessor", name: "renderPriority" }, initializers, extraInitializers);
            __esDecorate(Light, null, [serialize()], { kind: "accessor", name: "serializedProperty" }, initializers, extraInitializers);
            __decorate([expandToProperty("_legacyCallback")], Light.prototype, "legacyProperty", void 0);
            expandToProperty("_reorderLightsInScene", "_renderPriority");
            addAccessorsForMaterialProperty("_markAllSubMeshesAsTexturesDirty");
            target["_quotedProperty"];
        `);

        expect([...propertyNames].sort()).toEqual([
            "_legacyCallback",
            "_legacyProperty",
            "_markAllSubMeshesAsTexturesDirty",
            "_quotedProperty",
            "_renderPriority",
            "_reorderLightsInScene",
        ]);
    });

    it("quotes matching declarations and accesses across package files", () => {
        fs.writeFileSync(
            path.join(tempDir, "tslib.es6.js"),
            `
                export function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
                    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
                    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
                    if (target) Object.defineProperty(target, contextIn.name, descriptor);
                }
            `
        );
        fs.writeFileSync(
            path.join(tempDir, "decorator.js"),
            `
                expandToProperty("_callback", "_value");
            `
        );
        fs.writeFileSync(
            path.join(tempDir, "class.js"),
            `
                import { Constants } from "./constants.js";
                class Test {
                    _callback() {}
                    read() {
                        return this._value;
                    }
                }
                Object.defineProperty(Test.prototype, "reflected", {
                    get() {
                        return this._value;
                    },
                });
                const supportsFeature = "feature" in Test.prototype;
                const supportsExternalFeature = "externalFeature" in getTarget();
                const hasReflected = Object.prototype.hasOwnProperty.call(Test.prototype, "reflected");
                const values = { _value: 1 };
                const { _value } = values;
                test?._callback();
                test.publicMethod();
            `
        );

        expect(PreserveClosurePropertyNames(tempDir)).toBe(1);
        const output = fs.readFileSync(path.join(tempDir, "class.js"), "utf8");
        const helperOutput = fs.readFileSync(path.join(tempDir, "closureTools.js"), "utf8");
        const tslibOutput = fs.readFileSync(path.join(tempDir, "tslib.es6.js"), "utf8");

        expect(output).toContain('["_callback"]()');
        expect(output).toContain('this["_value"]');
        expect(output).toContain('{ ["_value"]: 1 }');
        expect(output).toContain('{ ["_value"]: _value }');
        expect(output).toContain('test?.["_callback"]()');
        expect(output).toContain("test.publicMethod()");
        expect(output).toContain(';\nimport { JSCompiler_renameProperty } from "./closureTools.js";\n');
        expect(helperOutput).toContain("export function JSCompiler_renameProperty(propertyName, _target)");
        expect(output).toContain('Object.defineProperty(Test.prototype, JSCompiler_renameProperty("reflected", Test.prototype)');
        expect(output).toContain('JSCompiler_renameProperty("feature", Test.prototype) in Test.prototype');
        expect(output).toContain('((_closureTarget) => JSCompiler_renameProperty("externalFeature", _closureTarget) in _closureTarget)(getTarget())');
        expect(output).toContain('Object.prototype.hasOwnProperty.call(Test.prototype, JSCompiler_renameProperty("reflected", Test.prototype))');
        expect(tslibOutput).toContain("contextIn.access.get(__closurePropertyProxy)");
        expect(tslibOutput).toContain("contextIn.access.set(__closurePropertyProxy, void 0)");
        expect(tslibOutput).toContain("Object.getOwnPropertyDescriptor(target, propertyName)");
        expect(tslibOutput).toContain("Object.defineProperty(target, propertyName, descriptor)");
    });

    it("resolves the renamed key for setter decorators", async () => {
        fs.copyFileSync(path.resolve("node_modules/tslib/tslib.es6.mjs"), path.join(tempDir, "tslib.es6.js"));
        fs.writeFileSync(path.join(tempDir, "package.json"), '{"type":"module"}');
        PreserveClosurePropertyNames(tempDir);

        const { __esDecorate } = await import(pathToFileURL(path.join(tempDir, "tslib.es6.js")).href);
        class Test {
            public value = 0;

            public set renamed(value: number) {
                this.value = value;
            }
        }

        __esDecorate(
            Test,
            null,
            [(setter: (value: number) => void) => setter],
            {
                kind: "setter",
                name: "original",
                static: false,
                private: false,
                access: {
                    has: (target: Test) => "renamed" in target,
                    set: (target: Test, value: number) => {
                        target.renamed = value;
                    },
                },
            },
            null,
            []
        );

        const instance = new Test();
        instance.renamed = 42;
        expect(instance.value).toBe(42);
    });
});
