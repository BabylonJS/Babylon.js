// Provide a global JSZip stub so that localSession.ts can initialize
// (it reads JSZip.compressions.DEFLATE at the top level).
(globalThis as any).JSZip = {
    compressions: {
        DEFLATE: {
            compress: (d: Uint8Array) => d,
            uncompress: (d: Uint8Array) => d,
        },
    },
};

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

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockFetchSnippet = vi.fn();
const mockParseSnippetResponse = vi.fn();

vi.mock("@tools/snippet-loader", () => ({
    FetchSnippet: (...args: unknown[]) => mockFetchSnippet(...args),
    ParseSnippetResponse: (...args: unknown[]) => mockParseSnippetResponse(...args),
}));

vi.mock("../../src/tools/localSession", () => ({
    ReadLastLocal: vi.fn(),
}));

import { Observable } from "@dev/core";
import type { IPlaygroundSnippetResult, ISnippetServerResponse, IV2Manifest, IRuntimeFeatures } from "@tools/snippet-loader";
import { ReadLastLocal } from "../../src/tools/localSession";
import type { Mock } from "vitest";

// ---------------------------------------------------------------------------
// Minimal GlobalState mock
// ---------------------------------------------------------------------------

function createMockGlobalState() {
    return {
        SnippetServerUrl: "https://snippet.babylonjs.com",
        currentCode: "",
        language: "JS",
        currentSnippetTitle: "",
        currentSnippetDescription: "",
        currentSnippetTags: "",
        currentSnippetToken: "",
        currentSnippetRevision: "",
        files: {} as Record<string, string>,
        activeFilePath: "index.js",
        importsMap: {} as Record<string, string>,
        entryFilePath: "index.js",
        loadingCodeInProgress: false,

        onLoadRequiredObservable: new Observable<string>(),
        onLocalLoadRequiredObservable: new Observable<void>(),
        onDisplayWaitRingObservable: new Observable<boolean>(),
        onCodeLoaded: new Observable<string>(),
        onErrorObservable: new Observable<{ message: string }>(),
        onV2HydrateRequiredObservable: new Observable<IV2Manifest>(),
        onMetadataUpdatedObservable: new Observable<void>(),
        onEngineChangedObservable: new Observable<string | void>(),
        onLanguageChangedObservable: new Observable<void>(),
        onEngineSwitchDialogRequiredObservable: new Observable<{ currentEngine: string; targetEngine: string; resolve: (val: boolean) => void }>(),

        showEngineSwitchDialogAsync: vi.fn().mockResolvedValue(false),
    };
}

// ---------------------------------------------------------------------------
// Helper to create a mock IPlaygroundSnippetResult
// ---------------------------------------------------------------------------

function makePlaygroundResult(overrides: Partial<IPlaygroundSnippetResult> = {}): IPlaygroundSnippetResult {
    const noop = async () => {};
    const defaultManifest: IV2Manifest = {
        v: 2,
        language: "JS",
        entry: "index.js",
        imports: {},
        files: { "index.js": "export function createScene() { return {}; }" },
    };
    return {
        snippetId: "TEST#0",
        type: "playground",
        metadata: { name: "Test", description: "Test snippet", tags: "test" },
        language: "JS",
        engineType: "WebGL2",
        isMultiFile: true,
        manifest: defaultManifest,
        code: "export function createScene() { return {}; }",
        files: { "index.js": "export function createScene() { return {}; }" },
        jsFiles: { "index.js": "export function createScene() { return {}; }" },
        executedCode: "export function createScene() { return {}; }",
        moduleFormat: "esm",
        createEngine: noop as unknown as IPlaygroundSnippetResult["createEngine"],
        createScene: noop as unknown as IPlaygroundSnippetResult["createScene"],
        createEngineSource: "default",
        sceneFunctionName: "createScene",
        runtimeFeatures: { havok: false, ammo: false, recast: false } as IRuntimeFeatures,
        initializeRuntimeAsync: noop as unknown as IPlaygroundSnippetResult["initializeRuntimeAsync"],
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// DOM mock setup
// ---------------------------------------------------------------------------

/**
 * Creates a mock location object that emulates browser behavior where
 * location.hash always includes the leading '#' when non-empty.
 */
function createLocationMock() {
    let hashValue = "";
    return {
        get hash() {
            return hashValue;
        },
        set hash(v: string) {
            if (!v) {
                hashValue = "";
            } else {
                hashValue = v.startsWith("#") ? v : "#" + v;
            }
        },
        search: "",
        pathname: "/",
        href: "http://localhost:1338/",
    };
}

function setupDomMocks() {
    const locationMock = createLocationMock();

    Object.defineProperty(globalThis, "location", {
        value: locationMock,
        writable: true,
        configurable: true,
    });

    if (typeof globalThis.window === "undefined") {
        (globalThis as Record<string, unknown>).window = {
            addEventListener: vi.fn(),
            location: locationMock,
            confirm: vi.fn().mockReturnValue(true),
        };
    } else {
        vi.spyOn(window, "addEventListener").mockImplementation(() => {});
    }

    if (typeof globalThis.history === "undefined") {
        (globalThis as Record<string, unknown>).history = {
            replaceState: vi.fn(),
        };
    }

    const storage: Record<string, string> = {};
    const storageMock = {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, val: string) => {
            storage[key] = val;
        },
        removeItem: (key: string) => {
            delete storage[key];
        },
    };
    if (typeof globalThis.sessionStorage === "undefined") {
        (globalThis as Record<string, unknown>).sessionStorage = storageMock;
    }
    if (typeof globalThis.localStorage === "undefined") {
        (globalThis as Record<string, unknown>).localStorage = storageMock;
    }

    if (typeof globalThis.parent === "undefined") {
        (globalThis as Record<string, unknown>).parent = { location: locationMock };
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoadManager", () => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let LoadManagerCtor: typeof import("../../src/tools/loadManager").LoadManager;

    beforeAll(async () => {
        setupDomMocks();
        const mod = await import("../../src/tools/loadManager");
        LoadManagerCtor = mod.LoadManager;
    });

    beforeEach(() => {
        mockFetchSnippet.mockReset();
        mockParseSnippetResponse.mockReset();
        (ReadLastLocal as Mock).mockReset();

        // Reset location for each test with proper hash behavior
        const loc = createLocationMock();
        (globalThis as Record<string, unknown>).location = loc;
        (globalThis as Record<string, unknown>).parent = { location: loc };
    });

    /**
     * Helper: sets location.hash BEFORE creating the LoadManager so the
     * constructor's _checkHash() sees it and calls _loadPlayground().
     * Returns the V2Manifest data delivered to the hydration observable.
     */
    async function loadViaHash(hash: string, globalState: ReturnType<typeof createMockGlobalState>): Promise<IV2Manifest> {
        // Register hydration observer BEFORE creating LoadManager
        const hydratePromise = new Promise<IV2Manifest>((resolve) => {
            globalState.onV2HydrateRequiredObservable.add(resolve);
        });

        // Set hash so the constructor's _checkHash picks it up
        (globalThis as any).location.hash = hash; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Constructor calls _checkHash -> _loadPlayground -> async fetch
        void new LoadManagerCtor(globalState as never);

        return hydratePromise;
    }

    /**
     * Helper that waits for the error observable instead of hydration.
     */
    async function loadViaHashExpectError(hash: string, globalState: ReturnType<typeof createMockGlobalState>): Promise<{ message: string }> {
        const errorPromise = new Promise<{ message: string }>((resolve) => {
            globalState.onErrorObservable.add(resolve);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).location.hash = hash;
        void new LoadManagerCtor(globalState as never);

        return errorPromise;
    }

    // -------------------------------------------------------------------
    // Loading V2 multi-file snippets
    // -------------------------------------------------------------------

    describe("loading via FetchSnippet", () => {
        it("fetches and processes a V2 multi-file snippet", async () => {
            const globalState = createMockGlobalState();

            const manifest: IV2Manifest = {
                v: 2,
                language: "JS",
                entry: "index.js",
                imports: {},
                files: { "index.js": "export function createScene() { return {}; }" },
            };

            const serverResponse: ISnippetServerResponse = {
                name: "My PG",
                description: "A test playground",
                tags: "test,demo",
                jsonPayload: JSON.stringify({
                    code: JSON.stringify(manifest),
                    engine: "WebGL2",
                    version: 2,
                }),
            };

            const parsedResult = makePlaygroundResult({
                snippetId: "ABC123#0",
                metadata: { name: "My PG", description: "A test playground", tags: "test,demo" },
                manifest,
                isMultiFile: true,
                language: "JS",
                engineType: "WebGL2",
                files: manifest.files,
            });

            mockFetchSnippet.mockResolvedValueOnce(serverResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            const hydrateData = await loadViaHash("#ABC123#0", globalState);

            expect(mockFetchSnippet).toHaveBeenCalledWith("ABC123#0", "https://snippet.babylonjs.com");
            expect(mockParseSnippetResponse).toHaveBeenCalledWith(serverResponse, "ABC123#0", { moduleFormat: "esm" });

            expect(globalState.currentSnippetTitle).toBe("My PG");
            expect(globalState.currentSnippetDescription).toBe("A test playground");
            expect(globalState.currentSnippetTags).toBe("test,demo");

            expect(hydrateData.files).toEqual(manifest.files);
            expect(hydrateData.entry).toBe("index.js");
            expect(hydrateData.language).toBe("JS");
        });

        it("fetches and processes a V1 legacy snippet", async () => {
            const globalState = createMockGlobalState();

            const legacyCode = "var createScene = function(engine, canvas) { return new BABYLON.Scene(engine); }\nexport default createScene\n";

            const parsedResult = makePlaygroundResult({
                snippetId: "LEGACY#0",
                metadata: { name: "Legacy PG", description: "An old playground", tags: "legacy" },
                isMultiFile: false,
                manifest: null,
                language: "JS",
                engineType: "WebGL2",
                code: legacyCode,
                files: { "index.js": legacyCode },
            });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            const hydrateData = await loadViaHash("#LEGACY#0", globalState);

            expect(hydrateData.files["index.js"]).toContain("createScene");
            expect(hydrateData.language).toBe("JS");
            expect(globalState.currentSnippetTitle).toBe("Legacy PG");
        });

        it("handles fetch errors gracefully", async () => {
            const globalState = createMockGlobalState();
            mockFetchSnippet.mockRejectedValueOnce(new Error("Network error"));

            const error = await loadViaHashExpectError("#BADID#0", globalState);

            expect(error.message).toContain("Network error");
            expect(globalState.loadingCodeInProgress).toBe(false);
        });

        it("prompts for engine switch when snippet engine differs from current", async () => {
            const globalState = createMockGlobalState();
            globalState.showEngineSwitchDialogAsync = vi.fn().mockResolvedValue(true);
            sessionStorage.setItem("engineVersion", "WebGL2");

            const parsedResult = makePlaygroundResult({
                snippetId: "GPU#0",
                engineType: "WebGPU",
                isMultiFile: true,
            });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            await loadViaHash("#GPU#0", globalState);

            expect(globalState.showEngineSwitchDialogAsync).toHaveBeenCalledWith({
                currentEngine: "WebGL2",
                targetEngine: "WebGPU",
            });
        });

        it("switches language when snippet language differs from current", async () => {
            const globalState = createMockGlobalState();
            globalState.language = "JS";

            const manifest: IV2Manifest = {
                v: 2,
                language: "TS",
                entry: "index.ts",
                imports: {},
                files: { "index.ts": "class Playground { static CreateScene() {} }" },
            };

            const parsedResult = makePlaygroundResult({
                snippetId: "TS#0",
                manifest,
                language: "TS",
                isMultiFile: true,
                files: manifest.files,
            });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            const hydrateData = await loadViaHash("#TS#0", globalState);

            expect(hydrateData.language).toBe("TS");
            expect(hydrateData.entry).toBe("index.ts");
        });
    });

    // -------------------------------------------------------------------
    // Loading from local storage
    // -------------------------------------------------------------------

    describe("loading from local storage", () => {
        it("loads a local session snippet via ParseSnippetResponse", async () => {
            const globalState = createMockGlobalState();

            const localData = JSON.stringify({
                name: "Local",
                description: "Saved locally",
                tags: "local",
                payload: JSON.stringify({
                    code: JSON.stringify({
                        v: 2,
                        language: "JS",
                        entry: "index.js",
                        imports: {},
                        files: { "index.js": "export function createScene() { return {}; }" },
                    }),
                    engine: "WebGL2",
                    version: 2,
                }),
            });

            (ReadLastLocal as Mock).mockReturnValue(localData);

            const parsedResult = makePlaygroundResult({
                snippetId: "MYTOKEN#0",
                metadata: { name: "Local", description: "Saved locally", tags: "local" },
            });

            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            const hydrateData = await loadViaHash("#MYTOKEN#local", globalState);

            expect(mockFetchSnippet).not.toHaveBeenCalled();
            expect(mockParseSnippetResponse).toHaveBeenCalled();
            expect(hydrateData.language).toBe("JS");
        });
    });

    // -------------------------------------------------------------------
    // Snippet token and revision parsing
    // -------------------------------------------------------------------

    describe("snippet token and revision parsing", () => {
        it("extracts token and revision from snippet ID", async () => {
            const globalState = createMockGlobalState();
            const parsedResult = makePlaygroundResult({ snippetId: "ABC#5" });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            await loadViaHash("#ABC#5", globalState);

            expect(globalState.currentSnippetToken).toBe("ABC");
            expect(globalState.currentSnippetRevision).toBe("5");
        });

        it("defaults revision to 0 when not provided", async () => {
            const globalState = createMockGlobalState();
            const parsedResult = makePlaygroundResult({ snippetId: "NOVER#0" });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            await loadViaHash("#NOVER", globalState);

            expect(globalState.currentSnippetToken).toBe("NOVER");
            expect(globalState.currentSnippetRevision).toBe("0");
            expect(mockFetchSnippet).toHaveBeenCalledWith("NOVER#0", expect.any(String));
        });
    });

    // -------------------------------------------------------------------
    // Custom snippet server URL
    // -------------------------------------------------------------------

    describe("uses custom snippet server URL", () => {
        it("passes the globalState SnippetServerUrl to FetchSnippet", async () => {
            const globalState = createMockGlobalState();
            globalState.SnippetServerUrl = "https://custom-server.test/snippets";

            const parsedResult = makePlaygroundResult({ snippetId: "CUSTOM#0" });

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce(parsedResult);

            await loadViaHash("#CUSTOM#0", globalState);

            expect(mockFetchSnippet).toHaveBeenCalledWith("CUSTOM#0", "https://custom-server.test/snippets");
        });
    });

    // -------------------------------------------------------------------
    // Non-playground snippet handling
    // -------------------------------------------------------------------

    describe("non-playground snippet handling", () => {
        it("reports an error when the snippet is not a playground type", async () => {
            const globalState = createMockGlobalState();

            mockFetchSnippet.mockResolvedValueOnce({} as ISnippetServerResponse);
            mockParseSnippetResponse.mockResolvedValueOnce({
                snippetId: "NME#0",
                type: "nodeMaterial",
                metadata: { name: "", description: "", tags: "" },
                data: {},
                load: () => {},
            });

            const error = await loadViaHashExpectError("#NME#0", globalState);

            expect(error.message).toContain("playground");
        });
    });
});
