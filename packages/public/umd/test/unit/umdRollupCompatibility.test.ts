import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const umdRoot = path.join(repoRoot, "packages/public/umd");

function collectEntryFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectEntryFiles(fullPath));
        } else if (entry.isFile() && fullPath.includes(`${path.sep}src${path.sep}`) && fullPath.endsWith(".ts")) {
            files.push(fullPath);
        }
    }
    return files;
}

describe("UMD Rollup compatibility", () => {
    it("keeps UMD entry points compatible with webpack libraryExport default", () => {
        const entryFiles = collectEntryFiles(umdRoot);
        expect(entryFiles.length).toBeGreaterThan(0);

        for (const filePath of entryFiles) {
            const source = fs.readFileSync(filePath, "utf8");
            if (!source.includes("export * from")) {
                continue;
            }

            expect(source, filePath).not.toMatch(/export default\b/);
            expect(source, filePath).not.toMatch(/export \{ [^}]+ \};/);

            const exportSpecifier = source.match(/export \* from (["'][^"']+["']);/)?.[1];
            expect(exportSpecifier, filePath).toBeDefined();
            expect(source, filePath).toContain(`import ${exportSpecifier};`);
        }
    });

    it("does not tree-shake legacy UMD side effects", async () => {
        const { commonUMDRollupConfiguration } = await import("../../../rollupUMDHelper.mjs");

        const singleEntryConfig = commonUMDRollupConfiguration({ devPackageName: "core" });
        expect(singleEntryConfig.treeshake).toBe(false);

        const multiEntryConfig = commonUMDRollupConfiguration({
            devPackageName: "loaders",
            entryPoints: {
                loaders: "./src/index.ts",
                glTFFileLoader: "./src/glTFFileLoader.ts",
            },
        });
        expect(multiEntryConfig).toHaveLength(2);
        expect(multiEntryConfig.every((config) => config.treeshake === false)).toBe(true);
    });

    it("keeps the glTF2 legacy export compatible with nested UMD namespaces", async () => {
        const { GLTF2: glTF2EntryNamespace } = await import("../../../../dev/loaders/src/legacy/legacy-glTF2");
        const { GLTF2: fullLoadersNamespace } = await import("../../../../dev/loaders/src/legacy/legacy");

        for (const GLTF2 of [glTF2EntryNamespace, fullLoadersNamespace]) {
            const legacyGLTF2 = GLTF2 as typeof GLTF2 & { Loader: { Extensions: { KHR_lights: unknown } } };
            expect(legacyGLTF2.Loader).toBeDefined();
            expect(legacyGLTF2.Loader.Extensions).toBeDefined();
            expect(legacyGLTF2.Loader.Extensions.KHR_lights).toBeDefined();
        }
    });
});
