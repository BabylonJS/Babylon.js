import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { generateCombinedDeclaration } from "../../src/generateDeclaration";

/**
 * Regression coverage for the UMD/namespace declaration generation.
 *
 * The generator strips ES re-export statements out of the global `BABYLON`
 * namespace declaration. A re-export left inside `declare namespace BABYLON`
 * turns the namespace into an export context, which breaks declaration merging
 * of augmented classes/interfaces (TS2395) and strips augmented members from
 * the public namespace types (see forum report 63631).
 *
 * The tree-shaking refactor introduced type-only re-exports
 * (`export type * from "..."` / `export type { ... } from "..."`) that the
 * original exclusion regexes did not catch. These tests lock in that all
 * re-export variants are excluded from the namespace output while real
 * declarations are preserved.
 */
describe("generateCombinedDeclaration namespace re-export stripping", () => {
    let tempDir: string;

    beforeEach(() => {
        // The generator keys module naming off a "/dist" path segment.
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bjs-gendecl-"));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    const writeDeclarationFile = (contents: string): string => {
        const fileDir = path.join(tempDir, "core", "dist", "Meshes");
        fs.mkdirSync(fileDir, { recursive: true });
        const filePath = path.join(fileDir, "meshUVSpaceRenderer.d.ts");
        fs.writeFileSync(filePath, contents);
        return filePath;
    };

    it("excludes type-only re-exports from the namespace declaration", () => {
        const filePath = writeDeclarationFile(
            [
                "export declare class MeshUVSpaceRenderer {",
                "    isReady(): boolean;",
                "}",
                'export * from "./meshUVSpaceRenderer.pure";',
                'export type * from "./meshUVSpaceRenderer.types";',
                'export type { IMeshUVSpaceRendererOptions } from "./meshUVSpaceRenderer.types";',
            ].join("\n")
        );

        const { namespaceDeclaration } = generateCombinedDeclaration([filePath], {
            devPackageName: "core",
            declarationLibs: ["@dev/core"],
        });

        // The real declaration must survive.
        expect(namespaceDeclaration).toContain("class MeshUVSpaceRenderer");
        // No re-export statement may leak into the ambient namespace.
        expect(namespaceDeclaration).not.toContain("export * from");
        expect(namespaceDeclaration).not.toContain("export type * from");
        expect(namespaceDeclaration).not.toContain("export type {");
        expect(namespaceDeclaration).not.toMatch(/from\s+["']\.\/meshUVSpaceRenderer/);
    });

    it("keeps augmented interfaces mergeable by not leaking a re-export between them", () => {
        // Mirrors the real failure: an augmentation interface, a leaked type
        // re-export, then another augmentation. The re-export must be removed so
        // both interfaces stay in the same (mergeable) namespace context.
        const filePath = writeDeclarationFile(
            [
                "export declare class MeshUVSpaceRenderer {",
                "    isReady(): boolean;",
                "}",
                "interface Scene {",
                "    firstAugmentation: number;",
                "}",
                'export type * from "./meshUVSpaceRenderer.types";',
                "interface Scene {",
                "    secondAugmentation: number;",
                "}",
            ].join("\n")
        );

        const { namespaceDeclaration } = generateCombinedDeclaration([filePath], {
            devPackageName: "core",
            declarationLibs: ["@dev/core"],
        });

        expect(namespaceDeclaration).toContain("firstAugmentation");
        expect(namespaceDeclaration).toContain("secondAugmentation");
        expect(namespaceDeclaration).not.toContain("export type * from");
    });
});
