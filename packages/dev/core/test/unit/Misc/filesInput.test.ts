import { describe, expect, it, vi } from "vitest";

import { type AbstractEngine } from "core/Engines/abstractEngine";
import { FilesInput } from "core/Misc/filesInput";
import { Logger } from "core/Misc/logger";
import { type Scene } from "core/scene";

function CreateFilesInput(onStart: (files?: File[]) => void, onReload: (sceneFile: File) => void): FilesInput {
    return new FilesInput({} as AbstractEngine, null, null, null, null, null, onStart, onReload, null);
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
});
