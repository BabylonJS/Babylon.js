import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type AbstractEngine } from "core/Engines/abstractEngine";
import { NullEngine } from "core/Engines/nullEngine";
import { FilesInput } from "core/Misc/filesInput";
import { Logger } from "core/Misc/logger";
import { type Scene } from "core/scene";

function CreateFilesInput(onStart: (files?: File[]) => void, onReload: (sceneFile: File) => void): FilesInput {
    return new FilesInput({} as AbstractEngine, null, null, null, null, null, onStart, onReload, null);
}

function CreateDeferredScene() {
    let resolve!: (scene: Scene) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<Scene>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, resolve, reject };
}

describe("FilesInput", () => {
    it("preserves case and webkitRelativePath for selected files", () => {
        const onStart = vi.fn();
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(onStart, onReload);
        const file = new File(["scene"], "Main.usda") as File & { correctName?: string };
        Object.defineProperty(file, "webkitRelativePath", { value: "Package/Scenes/Main.usda" });
        filesInput.onProcessFileCallback = (processedFile, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(processedFile);
            return false;
        };

        filesInput.loadFiles({ target: { files: [file] } });

        expect(file.correctName).toBe("Package/Scenes/Main.usda");
        expect(filesInput.filesToLoad).toEqual([file]);
        expect(onStart).toHaveBeenCalledWith([file]);
        expect(onReload).toHaveBeenCalledWith(file);
    });

    it("reads every dropped directory batch before processing files", () => {
        const onStart = vi.fn();
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(onStart, onReload);
        const root = new File(["root"], "Main.usda") as File & { correctName?: string };
        const layer = new File(["layer"], "Geometry.usdc") as File & { correctName?: string };
        const batches = [
            [{ isFile: true, fullPath: "/Package/Main.usda", file: (success: (file: File) => void) => success(root) }],
            [{ isFile: true, fullPath: "/Package/Geometry.usdc", file: (success: (file: File) => void) => success(layer) }],
            [],
        ];
        const folder = {
            isDirectory: true,
            fullPath: "/Package",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => success(batches.shift() ?? []),
            }),
        };
        filesInput.onProcessFileCallback = (processedFile, _name, extension, setSceneFileToLoad) => {
            if (extension === "usda") {
                setSceneFileToLoad(processedFile);
            }
            return false;
        };

        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });

        expect(filesInput.filesToLoad).toEqual([root, layer]);
        expect(root.correctName).toBe("Package/Main.usda");
        expect(layer.correctName).toBe("Package/Geometry.usdc");
        expect(onStart).toHaveBeenCalledTimes(1);
        expect(onReload).toHaveBeenCalledWith(root);
    });

    it("keeps a virtual path assigned before loading", () => {
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(() => {}, onReload);
        const file = new File(["scene"], "Main.usda") as File & { correctName?: string };
        file.correctName = "Package/Scenes/Main.usda";
        filesInput.onProcessFileCallback = (processedFile, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(processedFile);
            return false;
        };

        filesInput.loadFiles({ dataTransfer: { files: [file] } });

        expect(file.correctName).toBe("Package/Scenes/Main.usda");
        expect(onReload).toHaveBeenCalledWith(file);
    });

    it("ignores a folder traversal superseded by a newer load", () => {
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(() => {}, onReload);
        const staleRoot = new File(["stale"], "Stale.usda");
        const currentRoot = new File(["current"], "Current.usda");
        const readCallbacks: Array<(entries: unknown[]) => void> = [];
        const folder = {
            isDirectory: true,
            fullPath: "/Stale",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => readCallbacks.push(success),
            }),
        };
        filesInput.onProcessFileCallback = (processedFile, _name, extension, setSceneFileToLoad) => {
            if (extension === "usda") {
                setSceneFileToLoad(processedFile);
            }
            return false;
        };

        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });
        filesInput.loadFiles({ target: { files: [currentRoot] } });

        readCallbacks.shift()?.([{ isFile: true, fullPath: "/Stale/Stale.usda", file: (success: (file: File) => void) => success(staleRoot) }]);
        readCallbacks.shift()?.([]);

        expect(filesInput.filesToLoad).toEqual([currentRoot]);
        expect(onReload).toHaveBeenCalledTimes(1);
        expect(onReload).toHaveBeenCalledWith(currentRoot);
    });

    it("does not supersede a valid folder traversal for an empty drop", () => {
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(() => {}, onReload);
        const root = new File(["root"], "Main.usda");
        const readCallbacks: Array<(entries: unknown[]) => void> = [];
        const folder = {
            isDirectory: true,
            fullPath: "/Package",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => readCallbacks.push(success),
            }),
        };
        filesInput.onProcessFileCallback = (processedFile, _name, extension, setSceneFileToLoad) => {
            if (extension === "usda") {
                setSceneFileToLoad(processedFile);
            }
            return false;
        };

        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });
        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "string", getAsString: () => {} }],
            },
        });
        readCallbacks.shift()?.([{ isFile: true, fullPath: "/Package/Main.usda", file: (success: (file: File) => void) => success(root) }]);
        readCallbacks.shift()?.([]);

        expect(filesInput.filesToLoad).toEqual([root]);
        expect(onReload).toHaveBeenCalledWith(root);
    });

    it("clears a pending scene selection", () => {
        const onReload = vi.fn();
        const filesInput = CreateFilesInput(() => {}, onReload);
        const file = new File(["scene"], "Main.usda");
        filesInput.onProcessFileCallback = (processedFile, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(processedFile);
            return false;
        };
        filesInput.loadFiles({ target: { files: [file] } });

        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        filesInput.clearFileSelection();
        filesInput.reload();

        expect(filesInput.filesToLoad).toEqual([]);
        expect(onReload).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith("Please provide a valid .babylon file.");
    });

    it("disposes a completed scene from a superseded load", async () => {
        const sceneLoaded = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, null, false, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        let resolveFirst!: (scene: Scene) => void;
        let resolveSecond!: (scene: Scene) => void;
        const firstScene = {
            dispose: vi.fn(),
            executeWhenReady: (callback: () => void) => callback(),
        } as unknown as Scene;
        const secondScene = {
            dispose: vi.fn(),
            executeWhenReady: (callback: () => void) => callback(),
        } as unknown as Scene;
        filesInput.loadAsync = (file) =>
            new Promise<Scene>((resolve) => {
                if (file.name === "First.usda") {
                    resolveFirst = resolve;
                } else {
                    resolveSecond = resolve;
                }
            });

        filesInput.loadFiles({ target: { files: [new File(["first"], "First.usda")] } });
        filesInput.loadFiles({ target: { files: [new File(["second"], "Second.usda")] } });
        resolveSecond(secondScene);
        await vi.waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));
        resolveFirst(firstScene);
        await vi.waitFor(() => expect(firstScene.dispose).toHaveBeenCalledTimes(1));

        expect(sceneLoaded).toHaveBeenCalledWith(expect.objectContaining({ name: "Second.usda" }), secondScene);
        expect(secondScene.dispose).not.toHaveBeenCalled();
    });

    it("cancels an earlier replacement reload of the same file", async () => {
        const sceneLoaded = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, null, false, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        const resolvers: Array<(scene: Scene) => void> = [];
        const firstScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        const secondScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => resolvers.push(resolve));

        filesInput.loadFiles({ target: { files: [new File(["scene"], "Scene.usda")] } });
        filesInput.reload();
        resolvers[1](secondScene);
        await vi.waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));
        resolvers[0](firstScene);
        await vi.waitFor(() => expect(firstScene.dispose).toHaveBeenCalledTimes(1));

        expect(sceneLoaded).toHaveBeenCalledWith(expect.objectContaining({ name: "Scene.usda" }), secondScene);
    });

    it("preserves append completion semantics after the selection changes", async () => {
        const sceneLoaded = vi.fn();
        const currentScene = { executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, currentScene, sceneLoaded, null, null, null, null, null, null, true, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        let resolveLoad!: (scene: Scene) => void;
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => (resolveLoad = resolve));

        const file = new File(["scene"], "Scene.usda");
        filesInput.loadFiles({ target: { files: [file] } });
        filesInput.clearFileSelection();
        resolveLoad(currentScene);
        await vi.waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));

        expect(sceneLoaded).toHaveBeenCalledWith(file, currentScene);
    });

    it("does not cancel an active load for an input without files", async () => {
        const sceneLoaded = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, null, false, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        let resolveLoad!: (scene: Scene) => void;
        const loadedScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => (resolveLoad = resolve));

        const file = new File(["scene"], "Scene.usda");
        filesInput.loadFiles({ target: { files: [file] } });
        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "string", getAsString: () => {} }],
            },
        });
        resolveLoad(loadedScene);
        await vi.waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));

        expect(sceneLoaded).toHaveBeenCalledWith(file, loadedScene);
        expect(loadedScene.dispose).not.toHaveBeenCalled();
    });

    it("invalidates an active replacement load after a valid folder is accepted", async () => {
        const sceneLoaded = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, null, false, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, extension, setSceneFileToLoad) => {
            if (extension === "usda") {
                setSceneFileToLoad(file);
            }
            return false;
        };
        const staleScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        const resolvers: Array<(scene: Scene) => void> = [];
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => resolvers.push(resolve));
        filesInput.loadFiles({ target: { files: [new File(["stale"], "Stale.usda")] } });

        const root = new File(["root"], "Main.usda");
        const readCallbacks: Array<(entries: unknown[]) => void> = [];
        const folder = {
            isDirectory: true,
            fullPath: "/Package",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => readCallbacks.push(success),
            }),
        };
        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });
        resolvers[0](staleScene);
        await vi.waitFor(() => expect(staleScene.dispose).toHaveBeenCalledTimes(1));
        readCallbacks.shift()?.([{ isFile: true, fullPath: "/Package/Main.usda", file: (success: (file: File) => void) => success(root) }]);
        readCallbacks.shift()?.([]);

        expect(sceneLoaded).not.toHaveBeenCalled();
        expect(filesInput.filesToLoad).toEqual([root]);
    });

    it("restores rendering when an accepted folder contains no readable files", async () => {
        const currentScene = {
            render: vi.fn(),
            getWaitingItemsCount: () => 0,
        } as unknown as Scene;
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, null, null, false, false);
        let resolveLoad!: (scene: Scene) => void;
        const staleScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => (resolveLoad = resolve));
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        filesInput.loadFiles({ target: { files: [new File(["stale"], "Stale.usda")] } });

        const folder = {
            isDirectory: true,
            fullPath: "/Empty",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => success([]),
            }),
        };
        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });
        resolveLoad(staleScene);
        await vi.waitFor(() => expect(staleScene.dispose).toHaveBeenCalledTimes(1));

        expect(engine.hideLoadingUI).toHaveBeenCalled();
        expect(engine.runRenderLoop).toHaveBeenCalledTimes(1);
    });

    it("reuses the render callback when an empty folder needs no restart", async () => {
        const currentScene = {
            dispose: vi.fn(),
            executeWhenReady: (callback: () => void) => callback(),
            render: vi.fn(),
            getWaitingItemsCount: () => 0,
        } as unknown as Scene;
        const runRenderLoop = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop,
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, null, null, null, null, null, null, null, false, false);
        filesInput.displayLoadingUI = false;
        filesInput.loadAsync = async () => currentScene;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        filesInput.loadFiles({ target: { files: [new File(["scene"], "Scene.usda")] } });
        await vi.waitFor(() => expect(runRenderLoop).toHaveBeenCalledTimes(1));

        const folder = {
            isDirectory: true,
            fullPath: "/Empty",
            createReader: () => ({
                readEntries: (success: (entries: unknown[]) => void) => success([]),
            }),
        };
        filesInput.loadFiles({
            dataTransfer: {
                files: [],
                items: [{ kind: "file", webkitGetAsEntry: () => folder }],
            },
        });

        expect(runRenderLoop).toHaveBeenCalledTimes(2);
        expect(runRenderLoop.mock.calls[0][0]).toBe(runRenderLoop.mock.calls[1][0]);
    });

    it("restores rendering when a nonempty selection has no scene loader", async () => {
        const currentScene = {
            render: vi.fn(),
            getWaitingItemsCount: () => 0,
        } as unknown as Scene;
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, null, null, false, false);
        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const processError = vi.fn();
        filesInput.onProcessFilesErrorCallback = processError;

        const file = new File(["unsupported"], "Scene.unsupported");
        filesInput.loadFiles({ target: { files: [file] } });

        expect(engine.hideLoadingUI).toHaveBeenCalled();
        expect(engine.runRenderLoop).toHaveBeenCalledTimes(1);
        expect(processError).toHaveBeenCalledWith([file]);
        expect(errorSpy).toHaveBeenCalledWith("Please provide a valid .babylon file.");
    });

    it("can clear a pending selection without canceling the active load", async () => {
        const sceneLoaded = vi.fn();
        const engine = {
            displayLoadingUI: vi.fn(),
            hideLoadingUI: vi.fn(),
            stopRenderLoop: vi.fn(),
            runRenderLoop: vi.fn(),
        } as unknown as AbstractEngine;
        const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, null, false, true);
        filesInput.displayLoadingUI = false;
        filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
            setSceneFileToLoad(file);
            return false;
        };
        let resolveLoad!: (scene: Scene) => void;
        const loadedScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
        filesInput.loadAsync = () => new Promise<Scene>((resolve) => (resolveLoad = resolve));

        const file = new File(["scene"], "Scene.usda");
        filesInput.loadFiles({ target: { files: [file] } });
        filesInput.clearFileSelection(false);
        resolveLoad(loadedScene);
        await vi.waitFor(() => expect(sceneLoaded).toHaveBeenCalledTimes(1));

        expect(sceneLoaded).toHaveBeenCalledWith(file, loadedScene);
        expect(loadedScene.dispose).not.toHaveBeenCalled();
    });

    describe("loading and render-loop ownership", () => {
        let engine: NullEngine;
        let currentScene: Scene;

        beforeEach(() => {
            vi.useFakeTimers();
            engine = new NullEngine();
            vi.spyOn(engine, "displayLoadingUI").mockImplementation(() => {});
            vi.spyOn(engine, "hideLoadingUI").mockImplementation(() => {});
            currentScene = {
                dispose: vi.fn(),
                executeWhenReady: (callback: () => void) => callback(),
                render: vi.fn(),
            } as unknown as Scene;
        });

        afterEach(() => {
            engine.dispose();
            vi.useRealTimers();
            vi.restoreAllMocks();
        });

        it.each([
            ["resolve", false],
            ["reject", false],
            ["resolve", true],
            ["reject", true],
        ] as const)("restores a canceled replacement before late %s (newer load: %s)", async (completion, startNewerLoad) => {
            const sceneLoaded = vi.fn();
            const onError = vi.fn();
            const filesInput = new FilesInput(engine, null, sceneLoaded, null, null, null, null, null, onError);
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            filesInput.loadAsync = async () => currentScene;
            filesInput.loadFiles({ target: { files: [new File(["initial"], "Initial.usda")] } });
            await Promise.resolve();
            const renderLoop = engine.activeRenderLoops[0];
            expect(renderLoop).toBeTypeOf("function");
            vi.mocked(engine.hideLoadingUI).mockClear();
            sceneLoaded.mockClear();

            const staleLoad = CreateDeferredScene();
            const staleScene = { dispose: vi.fn() } as unknown as Scene;
            filesInput.loadAsync = () => staleLoad.promise;
            filesInput.loadFiles({ target: { files: [new File(["stale"], "Stale.usda")] } });
            expect(engine.activeRenderLoops).toHaveLength(0);

            filesInput.clearFileSelection();

            expect(filesInput.filesToLoad).toEqual([]);
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
            renderLoop();
            expect(currentScene.render).toHaveBeenCalledTimes(1);
            expect(currentScene.dispose).not.toHaveBeenCalled();
            filesInput.clearFileSelection();
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);

            const newerLoad = CreateDeferredScene();
            const newerScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
            const newerFile = new File(["newer"], "Newer.usda");
            if (startNewerLoad) {
                filesInput.loadAsync = () => newerLoad.promise;
                filesInput.loadFiles({ target: { files: [newerFile] } });
            }
            expect(engine.activeRenderLoops).toEqual(startNewerLoad ? [] : [renderLoop]);

            if (completion === "resolve") {
                staleLoad.resolve(staleScene);
            } else {
                staleLoad.reject(new Error("Canceled load failed"));
            }
            await staleLoad.promise.catch(() => {});
            await Promise.resolve();

            expect(staleScene.dispose).toHaveBeenCalledTimes(completion === "resolve" ? 1 : 0);
            expect(currentScene.dispose).not.toHaveBeenCalled();
            expect(sceneLoaded).not.toHaveBeenCalled();
            expect(onError).not.toHaveBeenCalled();
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);
            expect(engine.activeRenderLoops).toEqual(startNewerLoad ? [] : [renderLoop]);

            if (startNewerLoad) {
                newerLoad.resolve(newerScene);
                await newerLoad.promise;
            }
            expect(sceneLoaded.mock.calls).toEqual(startNewerLoad ? [[newerFile, newerScene]] : []);
            expect(currentScene.dispose).toHaveBeenCalledTimes(startNewerLoad ? 1 : 0);
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(startNewerLoad ? 2 : 1);
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
        });

        it.each([
            [false, false],
            [true, true],
            [false, true],
        ])("honors loading UI (%s) and disabled render injection (%s) when canceling", async (displayLoadingUI, dontInjectRenderLoop) => {
            const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, null, null, false, dontInjectRenderLoop);
            filesInput.displayLoadingUI = displayLoadingUI;
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            const load = CreateDeferredScene();
            filesInput.loadAsync = () => load.promise;
            filesInput.loadFiles({ target: { files: [new File(["scene"], "Scene.usda")] } });
            filesInput.clearFileSelection();
            load.reject(new Error("Canceled"));
            await load.promise.catch(() => {});
            await Promise.resolve();

            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(displayLoadingUI ? 1 : 0);
            expect(engine.activeRenderLoops).toHaveLength(dontInjectRenderLoop ? 0 : 1);
        });

        it("leaves a custom reload handler's loading UI and render loop alone", () => {
            const renderLoop = vi.fn();
            const onReload = vi.fn();
            engine.runRenderLoop(renderLoop);
            const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, onReload, null);
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            filesInput.loadFiles({ target: { files: [new File(["scene"], "Scene.usda")] } });

            filesInput.clearFileSelection();

            expect(onReload).toHaveBeenCalledTimes(1);
            expect(engine.displayLoadingUI).not.toHaveBeenCalled();
            expect(engine.hideLoadingUI).not.toHaveBeenCalled();
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
        });

        it("does not restore UI or rendering when clearing without canceling the load", async () => {
            const sceneLoaded = vi.fn();
            const filesInput = new FilesInput(engine, currentScene, sceneLoaded, null, null, null, null, null, null);
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            const load = CreateDeferredScene();
            const loadedScene = { dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene;
            filesInput.loadAsync = () => load.promise;
            const file = new File(["scene"], "Scene.usda");
            filesInput.loadFiles({ target: { files: [file] } });
            filesInput.clearFileSelection(false);

            expect(filesInput.filesToLoad).toEqual([]);
            expect(engine.hideLoadingUI).not.toHaveBeenCalled();
            expect(engine.activeRenderLoops).toHaveLength(0);

            load.resolve(loadedScene);
            await load.promise;

            expect(sceneLoaded).toHaveBeenCalledWith(file, loadedScene);
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);
            expect(engine.activeRenderLoops).toHaveLength(1);
            expect(loadedScene.dispose).not.toHaveBeenCalled();
        });

        it("does not let a superseded scene readiness callback interrupt a newer load", async () => {
            const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, null, null);
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            let ready!: () => void;
            const firstScene = {
                dispose: vi.fn(),
                executeWhenReady: (callback: () => void) => (ready = callback),
            } as unknown as Scene;
            filesInput.loadAsync = async () => firstScene;
            filesInput.loadFiles({ target: { files: [new File(["first"], "First.usda")] } });
            await Promise.resolve();
            filesInput.clearFileSelection();
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);

            const newerLoad = CreateDeferredScene();
            filesInput.loadAsync = () => newerLoad.promise;
            filesInput.loadFiles({ target: { files: [new File(["newer"], "Newer.usda")] } });
            ready();

            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);
            expect(engine.activeRenderLoops).toHaveLength(0);
            newerLoad.resolve({ dispose: vi.fn(), executeWhenReady: (callback: () => void) => callback() } as unknown as Scene);
            await newerLoad.promise;
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(2);
            expect(engine.activeRenderLoops).toHaveLength(1);
        });

        it.each(["empty", "unreadable", "unsupported"])("preserves a caller-owned append render loop for an %s selection", (selection) => {
            const renderLoop = vi.fn();
            engine.runRenderLoop(renderLoop);
            const runRenderLoop = vi.spyOn(engine, "runRenderLoop");
            const filesInput = new FilesInput(engine, currentScene, null, null, null, null, null, null, null, true);
            const processError = vi.fn();
            filesInput.onProcessFilesErrorCallback = processError;
            vi.spyOn(Logger, "Error").mockImplementation(() => {});
            const file = new File(["unsupported"], "Scene.unsupported");

            if (selection === "unsupported") {
                filesInput.loadFiles({ target: { files: [file] } });
            } else {
                const folder = {
                    isDirectory: true,
                    fullPath: "/Folder",
                    createReader: () => ({
                        readEntries: (success: (entries: unknown[]) => void, error: (reason: Error) => void) => {
                            if (selection === "unreadable") {
                                error(new Error("Unreadable directory"));
                            } else {
                                success([]);
                            }
                        },
                    }),
                };
                filesInput.loadFiles({ dataTransfer: { files: [], items: [{ kind: "file", webkitGetAsEntry: () => folder }] } });
            }

            expect(processError).toHaveBeenCalledWith(selection === "unsupported" ? [file] : []);
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
            expect(runRenderLoop).not.toHaveBeenCalled();
            engine.activeRenderLoops[0]();
            expect(renderLoop).toHaveBeenCalledTimes(1);
            expect(currentScene.render).not.toHaveBeenCalled();
        });

        it("does not cancel an append load or restore its caller-owned loop when clearing", async () => {
            const renderLoop = vi.fn();
            engine.runRenderLoop(renderLoop);
            const sceneLoaded = vi.fn();
            const filesInput = new FilesInput(engine, currentScene, sceneLoaded, null, null, null, null, null, null, true);
            filesInput.onProcessFileCallback = (file, _name, _extension, setSceneFileToLoad) => {
                setSceneFileToLoad(file);
                return false;
            };
            const load = CreateDeferredScene();
            filesInput.loadAsync = () => load.promise;
            const file = new File(["scene"], "Scene.usda");
            filesInput.loadFiles({ target: { files: [file] } });
            filesInput.clearFileSelection();

            expect(engine.hideLoadingUI).not.toHaveBeenCalled();
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
            load.resolve(currentScene);
            await load.promise;

            expect(sceneLoaded).toHaveBeenCalledWith(file, currentScene);
            expect(engine.hideLoadingUI).toHaveBeenCalledTimes(1);
            expect(currentScene.dispose).not.toHaveBeenCalled();
            expect(engine.activeRenderLoops).toEqual([renderLoop]);
        });
    });
});
