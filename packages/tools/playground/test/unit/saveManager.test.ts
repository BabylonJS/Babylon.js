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

const mockSaveSnippet = vi.fn();

vi.mock("@tools/snippet-loader", () => ({
    SaveSnippet: (...args: any[]) => mockSaveSnippet(...args),
}));

import { Observable } from "@dev/core";
import { type ISaveSnippetResult } from "@tools/snippet-loader";
import { type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Minimal GlobalState mock
// ---------------------------------------------------------------------------

function createMockGlobalState() {
    return {
        SnippetServerUrl: "https://snippet.babylonjs.com",
        currentCode: "export function createScene() { return {}; }",
        language: "JS",
        currentSnippetTitle: "My Playground",
        currentSnippetDescription: "A test description",
        currentSnippetTags: "test,save",
        currentSnippetToken: "",
        currentSnippetRevision: "",
        files: { "index.js": "export function createScene() { return {}; }" } as Record<string, string>,
        activeFilePath: "index.js",
        importsMap: {},
        entryFilePath: "index.js",

        onSaveRequiredObservable: new Observable<void>(),
        onLocalSaveRequiredObservable: new Observable<void>(),
        onSavedObservable: new Observable<void>(),
        onErrorObservable: new Observable<any>(),
        onDisplayMetadataObservable: new Observable<boolean>(),
        onMetadataWindowHiddenObservable: new Observable<boolean>(),
    };
}

// DOM mocks

function setupDomMocks() {
    const locationMock: any = {
        hash: "",
        search: "",
        pathname: "/",
        href: "http://localhost:1338/",
    };

    Object.defineProperty(globalThis, "location", {
        value: locationMock,
        writable: true,
        configurable: true,
    });

    if (typeof globalThis.history === "undefined") {
        (globalThis as any).history = {
            replaceState: vi.fn(),
        };
    } else {
        vi.spyOn(history, "replaceState").mockImplementation(() => {});
    }

    // Mock sessionStorage and localStorage
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
        (globalThis as any).sessionStorage = storageMock;
    }
    if (typeof globalThis.localStorage === "undefined") {
        (globalThis as any).localStorage = storageMock;
    }

    if (typeof globalThis.window === "undefined") {
        (globalThis as any).window = {
            confirm: vi.fn().mockReturnValue(true),
        };
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SaveManager", () => {
    let SaveManager: any;

    beforeAll(async () => {
        setupDomMocks();
        const mod = await import("../../src/tools/saveManager");
        SaveManager = mod.SaveManager;
    });

    beforeEach(() => {
        mockSaveSnippet.mockReset();
        (globalThis as any).location.hash = "";
        (globalThis as any).location.search = "";
        (globalThis as any).location.pathname = "/";
        (globalThis as any).location.href = "http://localhost:1338/";

        if (history.replaceState && (history.replaceState as Mock).mockReset) {
            (history.replaceState as Mock).mockReset();
        }
    });

    describe("saving a new snippet", () => {
        it("calls SaveSnippet with the correct manifest and metadata", async () => {
            const globalState = createMockGlobalState();

            const saveResult: ISaveSnippetResult = {
                snippetId: "NEW123",
                id: "NEW123",
                version: "0",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            expect(mockSaveSnippet).toHaveBeenCalledTimes(1);
            const [input, options] = mockSaveSnippet.mock.calls[0];

            // Verify input type and manifest
            expect(input.type).toBe("playground");
            expect(input.manifest).toBeDefined();
            expect(input.manifest.v).toBe(2);
            expect(input.manifest.language).toBe("JS");
            expect(input.manifest.entry).toBe("index.js");
            expect(input.manifest.files["index.js"]).toContain("createScene");

            // Verify metadata
            expect(options.metadata.name).toBe("My Playground");
            expect(options.metadata.description).toBe("A test description");
            expect(options.metadata.tags).toBe("test,save");

            // Verify no snippetId for new snippet
            expect(options.snippetId).toBeUndefined();

            // Verify URL was updated
            expect(globalState.currentSnippetToken).toBe("NEW123");
        });

        it("includes the engine type from session storage", async () => {
            const globalState = createMockGlobalState();
            sessionStorage.setItem("engineVersion", "WebGPU");

            const saveResult: ISaveSnippetResult = {
                snippetId: "ENG1",
                id: "ENG1",
                version: "0",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const [input] = mockSaveSnippet.mock.calls[0];
            expect(input.engine).toBe("WebGPU");
        });
    });

    describe("updating an existing snippet", () => {
        it("passes the existing snippet token as snippetId", async () => {
            const globalState = createMockGlobalState();
            globalState.currentSnippetToken = "EXIST1";
            globalState.currentSnippetRevision = "2";

            const saveResult: ISaveSnippetResult = {
                snippetId: "EXIST1#3",
                id: "EXIST1",
                version: "3",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const [, options] = mockSaveSnippet.mock.calls[0];
            expect(options.snippetId).toBe("EXIST1");
            expect(globalState.currentSnippetRevision).toBe("3");
        });
    });

    describe("URL update after save", () => {
        it("updates hash-based URL with new snippet id and version", async () => {
            const globalState = createMockGlobalState();

            const saveResult: ISaveSnippetResult = {
                snippetId: "ABC#1",
                id: "ABC",
                version: "1",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            expect(history.replaceState).toHaveBeenCalled();
            const newUrl = (history.replaceState as Mock).mock.calls[0][2];
            expect(newUrl).toContain("#ABC");
            expect(newUrl).toContain("#1");
        });

        it("updates pg/ path-based URL with revision", async () => {
            const globalState = createMockGlobalState();
            (globalThis as any).location.pathname = "/pg/ABC";
            (globalThis as any).location.href = "http://localhost:1338/pg/ABC";

            const saveResult: ISaveSnippetResult = {
                snippetId: "ABC#2",
                id: "ABC",
                version: "2",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const newUrl = (history.replaceState as Mock).mock.calls[0][2];
            expect(newUrl).toContain("/revision/2");
        });

        it("updates pg/ path with existing revision", async () => {
            const globalState = createMockGlobalState();
            (globalThis as any).location.pathname = "/pg/ABC/revision/1";
            (globalThis as any).location.href = "http://localhost:1338/pg/ABC/revision/1";

            const saveResult: ISaveSnippetResult = {
                snippetId: "ABC#3",
                id: "ABC",
                version: "3",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const newUrl = (history.replaceState as Mock).mock.calls[0][2];
            expect(newUrl).toContain("revision/3");
            expect(newUrl).not.toContain("revision/1");
        });

        it("updates query string-based URL", async () => {
            const globalState = createMockGlobalState();
            (globalThis as any).location.search = "?pg=XYZ";
            (globalThis as any).location.href = "http://localhost:1338/?pg=XYZ";

            const saveResult: ISaveSnippetResult = {
                snippetId: "XYZ#1",
                id: "XYZ",
                version: "1",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const newUrl = (history.replaceState as Mock).mock.calls[0][2];
            expect(newUrl).toContain("revision=1");
        });
    });

    describe("error handling", () => {
        it("notifies error observable when save fails", async () => {
            const globalState = createMockGlobalState();

            mockSaveSnippet.mockRejectedValueOnce(new Error("Server error"));

            const errorPromise = new Promise<any>((resolve) => {
                globalState.onErrorObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            const error = await errorPromise;
            expect(error.message).toContain("Unable to save your code");
        });
    });

    describe("metadata prompt", () => {
        it("prompts for metadata when title is missing", async () => {
            const globalState = createMockGlobalState();
            globalState.currentSnippetTitle = "";
            globalState.currentSnippetDescription = "";
            globalState.currentSnippetTags = "";

            const displayPromise = new Promise<boolean>((resolve) => {
                globalState.onDisplayMetadataObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            const displayed = await displayPromise;
            expect(displayed).toBe(true);

            // SaveSnippet should NOT have been called yet (waiting for metadata)
            expect(mockSaveSnippet).not.toHaveBeenCalled();
        });

        it("saves after metadata dialog is confirmed", async () => {
            const globalState = createMockGlobalState();
            globalState.currentSnippetTitle = "";

            const saveResult: ISaveSnippetResult = {
                snippetId: "META#0",
                id: "META",
                version: "0",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            void new SaveManager(globalState);

            // Listen for metadata display
            globalState.onDisplayMetadataObservable.add(() => {
                // User fills in metadata
                globalState.currentSnippetTitle = "Filled In Title";
                globalState.currentSnippetDescription = "Filled In Desc";
                globalState.currentSnippetTags = "test";

                // Simulate the metadata window closing with success
                globalState.onMetadataWindowHiddenObservable.notifyObservers(true);
            });

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            expect(mockSaveSnippet).toHaveBeenCalledTimes(1);
            const [, options] = mockSaveSnippet.mock.calls[0];
            expect(options.metadata.name).toBe("Filled In Title");
        });
    });

    describe("uses custom snippet server URL", () => {
        it("passes globalState.SnippetServerUrl as snippetUrl", async () => {
            const globalState = createMockGlobalState();
            globalState.SnippetServerUrl = "https://my-custom-server.test";

            const saveResult: ISaveSnippetResult = {
                snippetId: "CUSTOM#0",
                id: "CUSTOM",
                version: "0",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const [, options] = mockSaveSnippet.mock.calls[0];
            expect(options.snippetUrl).toBe("https://my-custom-server.test");
        });
    });

    describe("TS snippet saving", () => {
        it("generates a TS manifest when language is TS", async () => {
            const globalState = createMockGlobalState();
            globalState.language = "TS";
            globalState.entryFilePath = "index.ts";
            globalState.files = { "index.ts": "class Playground { static CreateScene() {} }" };

            const saveResult: ISaveSnippetResult = {
                snippetId: "TS1#0",
                id: "TS1",
                version: "0",
            };
            mockSaveSnippet.mockResolvedValueOnce(saveResult);

            const savedPromise = new Promise<void>((resolve) => {
                globalState.onSavedObservable.add(resolve);
            });

            void new SaveManager(globalState);
            globalState.onSaveRequiredObservable.notifyObservers();

            await savedPromise;

            const [input] = mockSaveSnippet.mock.calls[0];
            expect(input.manifest.language).toBe("TS");
            expect(input.manifest.entry).toBe("index.ts");
            expect(input.manifest.files["index.ts"]).toContain("Playground");
        });
    });
});
