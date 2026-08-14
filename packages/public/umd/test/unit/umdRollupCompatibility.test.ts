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

    it("lazy-loads editor bundles from the CDN and shares a single load between concurrent imports", async () => {
        const { commonUMDRollupConfiguration } = await import("../../../rollupUMDHelper.mjs");

        const config = commonUMDRollupConfiguration({ devPackageName: "core" });
        const plugin = config.plugins.find((candidate: { name?: string }) => candidate?.name === "rewrite-dynamic-external-imports");
        expect(plugin).toBeDefined();

        const rendered = plugin.renderChunk(`export const load = () => import("babylonjs-gui-editor");\nexport const loadCore = () => import("babylonjs");`);
        expect(rendered).not.toBeNull();
        const code: string = rendered.code;

        // The editor import resolves through the lazy CDN loader rather than reading a global that may not exist yet.
        expect(code).toContain(`_BabylonUMDLoadEditorAsync("GUIEDITOR","guiEditor/babylon.guiEditor.js")`);
        // Non-editor externals keep resolving straight from their global, since the host page always preloads them.
        expect(code).toContain(`Promise.resolve(BABYLON)`);

        // The helper is emitted as a single leading line, so evaluate just that line with a stubbed global object.
        const helperSource = code.slice(0, code.indexOf("\n"));
        // eslint-disable-next-line no-new-func
        const instantiateHelper = new Function("globalThis", `${helperSource}\nreturn _BabylonUMDLoadEditorAsync;`);

        const cdnPath = "guiEditor/babylon.guiEditor.js";
        const createStub = (onLoad: () => Promise<void>) => {
            const stub: Record<string, any> = {
                BABYLON: { Tools: { _DefaultCdnUrl: "https://cdn.babylonjs.com", LoadBabylonScriptAsync: onLoad } },
            };
            return stub;
        };

        // Concurrent imports share one script injection, and the global is returned once loading completes.
        let loadCount = 0;
        let completeLoad = () => {};
        const stub = createStub(() => {
            loadCount++;
            return new Promise<void>((resolve) => {
                completeLoad = () => {
                    stub.GUIEDITOR = { GUIEditor: {} };
                    resolve();
                };
            });
        });
        const loadEditorAsync = instantiateHelper(stub);

        const first = loadEditorAsync("GUIEDITOR", cdnPath);
        const second = loadEditorAsync("GUIEDITOR", cdnPath);
        expect(second).toBe(first);
        expect(loadCount).toBe(1);

        completeLoad();
        await expect(first).resolves.toBe(stub.GUIEDITOR);

        // Once the global exists the CDN is not hit again.
        await expect(loadEditorAsync("GUIEDITOR", cdnPath)).resolves.toBe(stub.GUIEDITOR);
        expect(loadCount).toBe(1);

        // A failed load is not cached, so a later attempt retries instead of replaying the rejection forever.
        let failingLoadCount = 0;
        const failingStub = createStub(() => {
            failingLoadCount++;
            return failingLoadCount === 1 ? Promise.reject(new Error("network error")) : Promise.resolve();
        });
        const loadFailingEditorAsync = instantiateHelper(failingStub);

        await expect(loadFailingEditorAsync("GUIEDITOR", cdnPath)).rejects.toThrow("network error");
        // The retry loads successfully but the bundle defines no global, which surfaces as a descriptive error.
        await expect(loadFailingEditorAsync("GUIEDITOR", cdnPath)).rejects.toThrow("did not define the expected global");
        expect(failingLoadCount).toBe(2);
    });
});
