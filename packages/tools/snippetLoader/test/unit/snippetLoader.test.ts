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

import { ParseSnippetResponse } from "../../src/snippetLoader";
import { type ISnippetServerResponse } from "../../src/types";

function makeResponse(payload: unknown): ISnippetServerResponse {
    return {
        name: "",
        description: "",
        tags: "",
        jsonPayload: JSON.stringify(payload),
    };
}

describe("snippetLoader", () => {
    beforeEach(() => {
        (globalThis as any).BABYLON = {
            Engine: class {
                public isWebGPU = false;
                constructor(
                    public canvas: any,
                    public antialias: boolean,
                    public options: any
                ) {}
            },
        };
        delete (globalThis as any).__sideMarker;
    });

    afterEach(() => {
        delete (globalThis as any).BABYLON;
        delete (globalThis as any).__sideMarker;
    });

    it("initializes metadata for V1 JS snippets so consumers can branch on it", async () => {
        const response = makeResponse({
            code: "var createScene = function (engine, canvas) { return { engine, canvas, source: 'v1-js' }; };",
        });

        const result = await ParseSnippetResponse(response, "TEST#0", { moduleFormat: "script" });

        expect(result.type).toBe("playground");
        if (result.type !== "playground") {
            return;
        }

        expect(result.createEngineSource).toBe("default");
        expect(result.sceneFunctionName).toBe("default");

        const scene = await result.createScene({ id: "engine" } as any, { id: "canvas" } as any);
        expect(scene).toEqual({ engine: { id: "engine" }, canvas: { id: "canvas" }, source: "v1-js" });
    });

    it("supports V1 TS Playground class snippets in script mode", async () => {
        const response = makeResponse({
            code: "class Playground { static CreateScene(engine, canvas) { return { engine, canvas, source: 'v1-ts' }; } }",
        });

        const result = await ParseSnippetResponse(response, "TEST#1", {
            moduleFormat: "script",
            transpile: (src: string) => src,
        });

        expect(result.type).toBe("playground");
        if (result.type !== "playground") {
            return;
        }

        expect(result.createEngineSource).toBe("default");
        expect(result.sceneFunctionName).toBe("default.CreateScene");

        const scene = await result.createScene({ id: "engine" } as any, { id: "canvas" } as any);
        expect(scene).toEqual({ engine: { id: "engine" }, canvas: { id: "canvas" }, source: "v1-ts" });
    });

    it("executes V2 multi-file snippets in script mode with relative imports and side effects", async () => {
        const manifest = {
            v: 2,
            language: "JS",
            entry: "index.js",
            imports: {},
            files: {
                "index.js": [
                    "import { makeScene } from './sceneFactory.js';",
                    "export function createEngine(canvas) { return { from: 'snippet', canvas }; }",
                    "export function createScene(engine, canvas) { return makeScene(engine, canvas); }",
                ].join("\n"),
                "sceneFactory.js": [
                    "import settings from './settings.js';",
                    "export function makeScene(engine, canvas) {",
                    "  return { engine, canvas, ok: settings.ok, marker: globalThis.__sideMarker };",
                    "}",
                ].join("\n"),
                "settings.js": ["globalThis.__sideMarker = 'loaded';", "export default { ok: true };"].join("\n"),
            },
        };

        const response = makeResponse({ code: JSON.stringify(manifest) });
        const result = await ParseSnippetResponse(response, "TEST#2", { moduleFormat: "script" });

        expect(result.type).toBe("playground");
        if (result.type !== "playground") {
            return;
        }

        expect(result.createEngineSource).toBe("snippet");
        expect(result.sceneFunctionName).toBe("createScene");

        const canvas = { id: "canvas" } as any;
        const engine = await result.createEngine(canvas);
        expect(engine).toEqual({ from: "snippet", canvas });

        const scene = await result.createScene(engine, canvas);
        expect(scene).toEqual({ engine, canvas, ok: true, marker: "loaded" });
    });

    it("does not eagerly execute ESM modules while parsing", async () => {
        const response = makeResponse({
            code: "export const createScene = function () { return { ok: true }; };",
        });

        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
            throw new Error("should not execute during parse");
        });

        const result = await ParseSnippetResponse(response, "TEST#3", { moduleFormat: "esm" });

        expect(result.type).toBe("playground");
        if (result.type !== "playground") {
            createObjectURLSpy.mockRestore();
            return;
        }

        expect(result.sceneFunctionName).toBe("createScene");
        expect(result.createEngineSource).toBe("default");

        expect(createObjectURLSpy).not.toHaveBeenCalled();
        createObjectURLSpy.mockRestore();
    });
});
