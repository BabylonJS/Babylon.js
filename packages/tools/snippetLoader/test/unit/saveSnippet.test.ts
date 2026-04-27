vi.mock(
    "monaco-editor/esm/vs/language/typescript/lib/typescriptServices",
    () => ({
        typescript: {
            transpileModule: (source: string) => ({ outputText: source }),
            ScriptTarget: { ESNext: 99 },
            ModuleKind: { ESNext: 99, None: 0 },
            JsxEmit: { ReactJSX: 4 },
        },
    }),
    { virtual: true }
);

import { SaveSnippet } from "../../src/saveSnippet";
import { ParseSnippetResponse } from "../../src/snippetLoader";
import { type IV2Manifest, type ISnippetServerResponse } from "../../src/types";

// ---------------------------------------------------------------------------
// Mock fetch
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;
const mockFetch = vi.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>();

function mockFetchSuccess(id: string, version: string | number = "0") {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id, version: String(version) }),
    } as Response);
}

function mockFetchFailure(status: number, statusText: string) {
    mockFetch.mockResolvedValueOnce({
        ok: false,
        status,
        statusText,
    } as Response);
}

/** Parses the body sent to the last `fetch` call. */
function lastPostedBody(): { payload: string; name: string; description: string; tags: string } {
    const call = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    return JSON.parse(call[1]?.body as string);
}

/** Parses the inner payload from the last `fetch` call. */
function lastInnerPayload(): Record<string, unknown> {
    return JSON.parse(lastPostedBody().payload);
}

describe("SaveSnippet", () => {
    beforeEach(() => {
        mockFetch.mockReset();
        (globalThis as any).fetch = mockFetch;
    });

    afterAll(() => {
        globalThis.fetch = originalFetch;
    });

    // -------------------------------------------------------------------
    // Playground — code (V1 style)
    // -------------------------------------------------------------------

    describe("playground code (V1)", () => {
        it("saves a simple JS code snippet to a new ID", async () => {
            mockFetchSuccess("NEW123", "0");

            const result = await SaveSnippet({ type: "playground", code: "var createScene = function() {}" });

            expect(result.snippetId).toBe("NEW123");
            expect(result.id).toBe("NEW123");
            expect(result.version).toBe("0");

            // Verify the POST went to the default URL with no ID suffix.
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, init] = mockFetch.mock.calls[0];
            expect(url).toBe("https://snippet.babylonjs.com");
            expect(init?.method).toBe("POST");

            // Verify inner payload structure.
            const inner = lastInnerPayload();
            expect(inner.code).toBe("var createScene = function() {}");
            expect(inner.unicode).toBeUndefined(); // ASCII-only, no unicode needed
        });

        it("includes unicode encoding for non-ASCII code", async () => {
            mockFetchSuccess("UNI1", "0");
            const code = 'var x = "日本語";';

            await SaveSnippet({ type: "playground", code });

            const inner = lastInnerPayload();
            expect(inner.code).toBe(code);
            expect(inner.unicode).toBeDefined();
            expect(typeof inner.unicode).toBe("string");
        });

        it("stores the engine type when provided", async () => {
            mockFetchSuccess("ENG1", "0");

            await SaveSnippet({ type: "playground", code: "code", engine: "WebGPU" });

            const inner = lastInnerPayload();
            expect(inner.engine).toBe("WebGPU");
        });

        it("passes metadata to the outer envelope", async () => {
            mockFetchSuccess("META1", "0");

            await SaveSnippet({ type: "playground", code: "code" }, { metadata: { name: "My Snippet", description: "A demo", tags: "test,demo" } });

            const body = lastPostedBody();
            expect(body.name).toBe("My Snippet");
            expect(body.description).toBe("A demo");
            expect(body.tags).toBe("test,demo");
        });
    });

    // -------------------------------------------------------------------
    // Playground — V2 manifest
    // -------------------------------------------------------------------

    describe("playground manifest (V2)", () => {
        const manifest: IV2Manifest = {
            v: 2,
            language: "TS",
            entry: "index.ts",
            imports: { "@babylonjs/core": "https://cdn.babylonjs.com/babylon.module.js" },
            files: {
                "index.ts": 'import { Scene } from "@babylonjs/core";\nexport function createScene() {}',
            },
        };

        it("saves a V2 manifest as a new snippet", async () => {
            mockFetchSuccess("V2ID", "0");

            const result = await SaveSnippet({ type: "playground", manifest });

            expect(result.snippetId).toBe("V2ID");

            const inner = lastInnerPayload();
            // code should be the stringified manifest
            const parsed = JSON.parse(inner.code as string);
            expect(parsed.v).toBe(2);
            expect(parsed.language).toBe("TS");
            expect(parsed.files["index.ts"]).toContain("createScene");
            expect(inner.version).toBe(2);
        });

        it("stores the engine type alongside the manifest", async () => {
            mockFetchSuccess("V2ENG", "0");

            await SaveSnippet({ type: "playground", manifest, engine: "WebGPU" });

            const inner = lastInnerPayload();
            expect(inner.engine).toBe("WebGPU");
        });
    });

    // -------------------------------------------------------------------
    // Data snippets
    // -------------------------------------------------------------------

    describe("data snippets", () => {
        it("saves a nodeMaterial snippet", async () => {
            mockFetchSuccess("NME1", "1");
            const data = { customType: "BABYLON.StandardMaterial", outputNodes: [] };

            const result = await SaveSnippet({ type: "nodeMaterial", data });

            expect(result.snippetId).toBe("NME1#1");
            expect(result.id).toBe("NME1");
            expect(result.version).toBe("1");

            const inner = lastInnerPayload();
            expect(JSON.parse(inner.nodeMaterial as string)).toEqual(data);
        });

        it("saves a nodeGeometry snippet", async () => {
            mockFetchSuccess("NGE1", "0");
            const data = { some: "geometry" };

            await SaveSnippet({ type: "nodeGeometry", data });

            const inner = lastInnerPayload();
            expect(JSON.parse(inner.nodeGeometry as string)).toEqual(data);
        });

        it("saves a nodeRenderGraph snippet", async () => {
            mockFetchSuccess("NRG1", "0");

            await SaveSnippet({ type: "nodeRenderGraph", data: { graph: true } });

            const inner = lastInnerPayload();
            expect(inner.nodeRenderGraph).toBeDefined();
        });

        it("saves a nodeParticle snippet", async () => {
            mockFetchSuccess("NP1", "0");

            await SaveSnippet({ type: "nodeParticle", data: { particle: true } });

            const inner = lastInnerPayload();
            expect(inner.nodeParticle).toBeDefined();
        });

        it("saves a gui snippet", async () => {
            mockFetchSuccess("GUI1", "0");
            const guiData = { root: { typeName: "Rectangle" } };

            await SaveSnippet({ type: "gui", data: guiData });

            const inner = lastInnerPayload();
            expect(JSON.parse(inner.gui as string)).toEqual(guiData);
        });

        it("saves an animation snippet under the 'animations' key", async () => {
            mockFetchSuccess("ANIM1", "0");
            const animations = [{ name: "anim1", keys: [] }];

            await SaveSnippet({ type: "animation", data: animations });

            const inner = lastInnerPayload();
            // animation type should be stored under "animations" key
            expect(inner.animations).toBeDefined();
            expect(JSON.parse(inner.animations as string)).toEqual(animations);
        });

        it("saves a particleSystem snippet", async () => {
            mockFetchSuccess("PS1", "0");

            await SaveSnippet({ type: "particleSystem", data: { emitter: {} } });

            const inner = lastInnerPayload();
            expect(inner.particleSystem).toBeDefined();
        });

        it("saves a spriteManager snippet", async () => {
            mockFetchSuccess("SM1", "0");

            await SaveSnippet({ type: "spriteManager", data: { sprites: [] } });

            const inner = lastInnerPayload();
            expect(inner.spriteManager).toBeDefined();
        });

        it("saves a shaderMaterial snippet", async () => {
            mockFetchSuccess("SHDR1", "0");

            await SaveSnippet({ type: "shaderMaterial", data: { vertex: "", fragment: "" } });

            const inner = lastInnerPayload();
            expect(inner.shaderMaterial).toBeDefined();
        });

        it("accepts a pre-stringified data value", async () => {
            mockFetchSuccess("STR1", "0");
            const jsonStr = '{"customType":"test"}';

            await SaveSnippet({ type: "nodeMaterial", data: jsonStr });

            const inner = lastInnerPayload();
            // When data is already a string, it should be stored as-is
            expect(inner.nodeMaterial).toBe(jsonStr);
        });
    });

    // -------------------------------------------------------------------
    // Versioning / updating existing snippets
    // -------------------------------------------------------------------

    describe("versioning", () => {
        it("posts to the existing snippet ID URL for updates", async () => {
            mockFetchSuccess("EXIST1", "3");

            const result = await SaveSnippet({ type: "playground", code: "updated" }, { snippetId: "EXIST1" });

            expect(result.snippetId).toBe("EXIST1#3");
            expect(result.version).toBe("3");

            const [url] = mockFetch.mock.calls[0];
            expect(url).toBe("https://snippet.babylonjs.com/EXIST1");
        });

        it("strips the #revision from snippetId for the POST URL", async () => {
            mockFetchSuccess("ABC", "5");

            await SaveSnippet({ type: "playground", code: "code" }, { snippetId: "ABC#2" });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toBe("https://snippet.babylonjs.com/ABC");
        });

        it("uses a custom snippet server URL", async () => {
            mockFetchSuccess("CUSTOM1", "0");

            await SaveSnippet({ type: "playground", code: "code" }, { snippetUrl: "https://my-server.test/snippets" });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toBe("https://my-server.test/snippets");
        });

        it("combines custom URL with existing snippet ID", async () => {
            mockFetchSuccess("XYZ", "1");

            await SaveSnippet({ type: "nodeMaterial", data: {} }, { snippetUrl: "https://my-server.test/snippets/", snippetId: "XYZ#0" });

            const [url] = mockFetch.mock.calls[0];
            expect(url).toBe("https://my-server.test/snippets/XYZ");
        });
    });

    // -------------------------------------------------------------------
    // Error handling
    // -------------------------------------------------------------------

    describe("error handling", () => {
        it("throws on non-ok response", async () => {
            mockFetchFailure(500, "Internal Server Error");

            await expect(SaveSnippet({ type: "playground", code: "code" })).rejects.toThrow("Failed to save snippet: 500 Internal Server Error");
        });

        it("throws on network error", async () => {
            mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

            await expect(SaveSnippet({ type: "playground", code: "code" })).rejects.toThrow("Failed to fetch");
        });
    });

    // -------------------------------------------------------------------
    // Round-trip: save → parse → verify
    // -------------------------------------------------------------------

    describe("round-trip: save and load produce identical data", () => {
        /** Capture the POST body from SaveSnippet and feed it to ParseSnippetResponse. */
        async function saveAndParse(...args: Parameters<typeof SaveSnippet>) {
            const saveResult = await SaveSnippet(...args);
            const postedBody = lastPostedBody();

            // The POST body IS the server envelope — convert it to ISnippetServerResponse.
            const serverResponse: ISnippetServerResponse = {
                payload: postedBody.payload,
                name: postedBody.name,
                description: postedBody.description,
                tags: postedBody.tags,
            };

            const parsed = await ParseSnippetResponse(serverResponse, saveResult.snippetId, { moduleFormat: "script" });
            return { saveResult, parsed };
        }

        it("playground V1 code round-trips: saved code equals loaded code", async () => {
            mockFetchSuccess("PG_RT1", "0");
            const code = "var createScene = function(engine, canvas) { return new BABYLON.Scene(engine); };";

            const { parsed } = await saveAndParse({ type: "playground", code, language: "JS", engine: "WebGL2" });

            expect(parsed.type).toBe("playground");
            if (parsed.type !== "playground") return;

            // The loaded code must contain the original source.
            expect(parsed.code).toContain(code);
            expect(parsed.engineType).toBe("WebGL2");
            expect(parsed.language).toBe("JS");
        });

        it("playground V2 manifest round-trips: saved files equal loaded files", async () => {
            mockFetchSuccess("PG_RT2", "0");

            const manifest: IV2Manifest = {
                v: 2,
                language: "JS",
                entry: "index.js",
                imports: { "@babylonjs/core": "https://cdn.babylonjs.com/babylon.module.js" },
                files: {
                    "index.js": 'import { Scene } from "@babylonjs/core";\nexport function createScene(engine) { return new Scene(engine); }',
                    "helper.js": "export const MAGIC = 42;",
                },
            };

            const { parsed } = await saveAndParse({ type: "playground", manifest, engine: "WebGPU" });

            expect(parsed.type).toBe("playground");
            if (parsed.type !== "playground") return;

            expect(parsed.isMultiFile).toBe(true);
            expect(parsed.manifest).not.toBeNull();
            expect(parsed.manifest!.files["index.js"]).toBe(manifest.files["index.js"]);
            expect(parsed.manifest!.files["helper.js"]).toBe(manifest.files["helper.js"]);
            expect(parsed.manifest!.language).toBe("JS");
            expect(parsed.manifest!.entry).toBe("index.js");
            expect(parsed.manifest!.imports["@babylonjs/core"]).toBe("https://cdn.babylonjs.com/babylon.module.js");
            expect(parsed.engineType).toBe("WebGPU");
        });

        it("NME data round-trips: saved data equals loaded data", async () => {
            mockFetchSuccess("NME_RT", "0");
            const nmeData = { customType: "BABYLON.NodeMaterial", outputNodes: [1], blocks: [{ id: 0, name: "VertexOutput" }] };

            const { parsed } = await saveAndParse({ type: "nodeMaterial", data: nmeData });

            expect(parsed.type).toBe("nodeMaterial");
            if (parsed.type !== "nodeMaterial") return;

            expect(parsed.data).toEqual(nmeData);
        });

        it("GUI data round-trips: saved data equals loaded data", async () => {
            mockFetchSuccess("GUI_RT", "0");
            const guiData = { root: { typeName: "Rectangle", children: [{ typeName: "TextBlock", text: "Hello" }] } };

            const { parsed } = await saveAndParse({ type: "gui", data: guiData });

            expect(parsed.type).toBe("gui");
            if (parsed.type !== "gui") return;

            expect(parsed.data).toEqual(guiData);
        });

        it("particleSystem data round-trips: saved data equals loaded data", async () => {
            mockFetchSuccess("PS_RT", "0");
            const psData = { emitter: { x: 0, y: 1, z: 0 }, maxSize: 1.5 };

            const { parsed } = await saveAndParse({ type: "particleSystem", data: psData });

            expect(parsed.type).toBe("particleSystem");
            if (parsed.type !== "particleSystem") return;

            expect(parsed.data).toEqual(psData);
        });

        it("metadata round-trips: saved name/description/tags equal loaded metadata", async () => {
            mockFetchSuccess("META_RT", "0");

            const { parsed } = await saveAndParse(
                { type: "nodeMaterial", data: { test: true } },
                { metadata: { name: "My Material", description: "A test material", tags: "nme,test" } }
            );

            expect(parsed.metadata.name).toBe("My Material");
            expect(parsed.metadata.description).toBe("A test material");
            expect(parsed.metadata.tags).toBe("nme,test");
        });
    });

    // -------------------------------------------------------------------
    // Full cycle: load → save → load produces identical data
    // -------------------------------------------------------------------

    describe("full cycle: load, save, and reload produce identical data", () => {
        /**
         * Simulates the full cycle: parse an original server response, save it
         * back via SaveSnippet, then parse the saved envelope and compare.
         */
        async function loadSaveAndReload(
            originalPayload: unknown,
            snippetType: "playground" | "nodeMaterial" | "nodeGeometry" | "nodeRenderGraph" | "nodeParticle" | "gui" | "particleSystem" | "spriteManager" | "shaderMaterial"
        ) {
            const originalResponse: ISnippetServerResponse = {
                payload: JSON.stringify(originalPayload),
                name: "Original",
                description: "Original description",
                tags: "original",
            };

            // Step 1: Parse the original
            const firstLoad = await ParseSnippetResponse(originalResponse, "ORIG#0", { moduleFormat: "script" });

            // Step 2: Save it back via SaveSnippet
            mockFetchSuccess("SAVED1", "1");

            if (firstLoad.type === "playground") {
                if (firstLoad.manifest) {
                    await SaveSnippet(
                        { type: "playground", manifest: firstLoad.manifest, engine: firstLoad.engineType },
                        { metadata: { name: firstLoad.metadata.name, description: firstLoad.metadata.description, tags: firstLoad.metadata.tags } }
                    );
                } else {
                    await SaveSnippet(
                        { type: "playground", code: firstLoad.code, language: firstLoad.language, engine: firstLoad.engineType },
                        { metadata: { name: firstLoad.metadata.name, description: firstLoad.metadata.description, tags: firstLoad.metadata.tags } }
                    );
                }
            } else if (firstLoad.type !== "unknown") {
                await SaveSnippet(
                    { type: snippetType as any, data: firstLoad.data },
                    { metadata: { name: firstLoad.metadata.name, description: firstLoad.metadata.description, tags: firstLoad.metadata.tags } }
                );
            }

            // Step 3: Parse what was saved
            const postedBody = lastPostedBody();
            const reloadResponse: ISnippetServerResponse = {
                payload: postedBody.payload,
                name: postedBody.name,
                description: postedBody.description,
                tags: postedBody.tags,
            };
            const secondLoad = await ParseSnippetResponse(reloadResponse, "SAVED1#1", { moduleFormat: "script" });

            return { firstLoad, secondLoad };
        }

        it("NME: load → save → load produces identical data", async () => {
            const originalData = { customType: "BABYLON.NodeMaterial", outputNodes: [1], blocks: [{ id: 0, name: "VertexOutput" }] };

            const { firstLoad, secondLoad } = await loadSaveAndReload({ nodeMaterial: JSON.stringify(originalData) }, "nodeMaterial");

            expect(firstLoad.type).toBe("nodeMaterial");
            expect(secondLoad.type).toBe("nodeMaterial");
            if (firstLoad.type !== "nodeMaterial" || secondLoad.type !== "nodeMaterial") return;

            expect(secondLoad.data).toEqual(firstLoad.data);
            expect(secondLoad.data).toEqual(originalData);
        });

        it("GUI: load → save → load produces identical data", async () => {
            const originalData = { root: { typeName: "Rectangle" } };

            const { firstLoad, secondLoad } = await loadSaveAndReload({ gui: JSON.stringify(originalData) }, "gui");

            expect(firstLoad.type).toBe("gui");
            expect(secondLoad.type).toBe("gui");
            if (firstLoad.type !== "gui" || secondLoad.type !== "gui") return;

            expect(secondLoad.data).toEqual(firstLoad.data);
            expect(secondLoad.data).toEqual(originalData);
        });

        it("particleSystem: load → save → load produces identical data", async () => {
            const originalData = { emitter: {}, maxSize: 2 };

            const { firstLoad, secondLoad } = await loadSaveAndReload({ particleSystem: JSON.stringify(originalData) }, "particleSystem");

            expect(firstLoad.type).toBe("particleSystem");
            expect(secondLoad.type).toBe("particleSystem");
            if (firstLoad.type !== "particleSystem" || secondLoad.type !== "particleSystem") return;

            expect(secondLoad.data).toEqual(firstLoad.data);
            expect(secondLoad.data).toEqual(originalData);
        });

        it("playground V2: load → save → load produces identical files", async () => {
            const manifest: IV2Manifest = {
                v: 2,
                language: "JS",
                entry: "index.js",
                imports: {},
                files: { "index.js": "export function createScene(engine, canvas) { return new BABYLON.Scene(engine); }" },
            };

            const { firstLoad, secondLoad } = await loadSaveAndReload({ code: JSON.stringify(manifest), version: 2 }, "playground");

            expect(firstLoad.type).toBe("playground");
            expect(secondLoad.type).toBe("playground");
            if (firstLoad.type !== "playground" || secondLoad.type !== "playground") return;

            expect(secondLoad.manifest!.files).toEqual(firstLoad.manifest!.files);
            expect(secondLoad.manifest!.language).toBe(firstLoad.manifest!.language);
            expect(secondLoad.manifest!.entry).toBe(firstLoad.manifest!.entry);
        });

        it("metadata survives the full cycle", async () => {
            const originalData = { customType: "BABYLON.NodeMaterial", outputNodes: [] };

            const { firstLoad, secondLoad } = await loadSaveAndReload({ nodeMaterial: JSON.stringify(originalData) }, "nodeMaterial");

            expect(secondLoad.metadata.name).toBe(firstLoad.metadata.name);
            expect(secondLoad.metadata.description).toBe(firstLoad.metadata.description);
            expect(secondLoad.metadata.tags).toBe(firstLoad.metadata.tags);
        });
    });
});
