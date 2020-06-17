import { Engine } from "../Engines/engine";
import { Scene } from "../scene";
import { ISceneLoaderProgressEvent, SceneLoader } from "../Loading/sceneLoader";
import { Logger } from "../Misc/logger";
import { FilesInputStore } from "./filesInputStore";

/**
 * Class used to help managing file picking and drag'n'drop
 */
export class FilesInput {
    /**
     * List of files ready to be loaded
     */
    public static get FilesToLoad() {
        return FilesInputStore.FilesToLoad;
    }

    /**
     * Callback called when a file is processed
     */
    public onProcessFileCallback: (file: File, name: string, extension: string) => true = () => { return true; };

    private _engine: Engine;
    private _currentScene: Scene;
    private _sceneLoadedCallback: (sceneFile: File, scene: Scene) => void;
    private _progressCallback: (progress: ISceneLoaderProgressEvent) => void;
    private _additionalRenderLoopLogicCallback: () => void;
    private _textureLoadingCallback: (remaining: number) => void;
    private _startingProcessingFilesCallback: (files?: File[]) => void;
    private _onReloadCallback: (sceneFile: File) => void;
    private _errorCallback: (sceneFile: File, scene: Scene, message: string) => void;
    private _elementToMonitor: HTMLElement;

    private _sceneFileToLoad: File;
    private _filesToLoad: File[];

    /**
     * Creates a new FilesInput
     * @param engine defines the rendering engine
     * @param scene defines the hosting scene
     * @param sceneLoadedCallback callback called when scene is loaded
     * @param progressCallback callback called to track progress
     * @param additionalRenderLoopLogicCallback callback called to add user logic to the rendering loop
     * @param textureLoadingCallback callback called when a texture is loading
     * @param startingProcessingFilesCallback callback called when the system is about to process all files
     * @param onReloadCallback callback called when a reload is requested
     * @param errorCallback callback call if an error occurs
     */
    constructor(engine: Engine, scene: Scene, sceneLoadedCallback: (sceneFile: File, scene: Scene) => void, progressCallback: (progress: ISceneLoaderProgressEvent) => void, additionalRenderLoopLogicCallback: () => void,
        textureLoadingCallback: (remaining: number) => void, startingProcessingFilesCallback: (files?: File[]) => void, onReloadCallback: (sceneFile: File) => void, errorCallback: (sceneFile: File, scene: Scene, message: string) => void) {
        this._engine = engine;
        this._currentScene = scene;

        this._sceneLoadedCallback = sceneLoadedCallback;
        this._progressCallback = progressCallback;
        this._additionalRenderLoopLogicCallback = additionalRenderLoopLogicCallback;
        this._textureLoadingCallback = textureLoadingCallback;
        this._startingProcessingFilesCallback = startingProcessingFilesCallback;
        this._onReloadCallback = onReloadCallback;
        this._errorCallback = errorCallback;
    }

    private _dragEnterHandler: (e: any) => void;
    private _dragOverHandler: (e: any) => void;
    private _dropHandler: (e: any) => void;

    /**
     * Calls this function to listen to drag'n'drop events on a specific DOM element
     * @param elementToMonitor defines the DOM element to track
     */
    public monitorElementForDragNDrop(elementToMonitor: HTMLElement): void {
        if (elementToMonitor) {
            this._elementToMonitor = elementToMonitor;

            this._dragEnterHandler = (e) => { this.drag(e); };
            this._dragOverHandler = (e) => { this.drag(e); };
            this._dropHandler = (e) => { this.drop(e); };

            this._elementToMonitor.addEventListener("dragenter", this._dragEnterHandler, false);
            this._elementToMonitor.addEventListener("dragover", this._dragOverHandler, false);
            this._elementToMonitor.addEventListener("drop", this._dropHandler, false);
        }
    }

    /**
     * Release all associated resources
     */
    public dispose() {
        if (!this._elementToMonitor) {
            return;
        }

        this._elementToMonitor.removeEventListener("dragenter", this._dragEnterHandler);
        this._elementToMonitor.removeEventListener("dragover", this._dragOverHandler);
        this._elementToMonitor.removeEventListener("drop", this._dropHandler);
    }

    private renderFunction(): void {
        if (this._additionalRenderLoopLogicCallback) {
            this._additionalRenderLoopLogicCallback();
        }

        if (this._currentScene) {
            if (this._textureLoadingCallback) {
                var remaining = this._currentScene.getWaitingItemsCount();

                if (remaining > 0) {
                    this._textureLoadingCallback(remaining);
                }
            }
            this._currentScene.render();
        }
    }

    private drag(e: DragEvent): void {
        e.stopPropagation();
        e.preventDefault();
    }

    private drop(eventDrop: DragEvent): void {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        this.loadFiles(eventDrop);
    }

    private _traverseFolder(folder: any, files: Array<any>, remaining: { count: number }, callback: () => void) {
        var reader = folder.createReader();
        var relativePath = folder.fullPath.replace(/^\//, "").replace(/(.+?)\/?$/, "$1/");
        reader.readEntries((entries: any) => {
            remaining.count += entries.length;
            for (let entry of entries) {
                if (entry.isFile) {
                    entry.file((file: any) => {
                        file.correctName = relativePath + file.name;
                        files.push(file);

                        if (--remaining.count === 0) {
                            callback();
                        }
                    });
                }
                else if (entry.isDirectory) {
                    this._traverseFolder(entry, files, remaining, callback);
                }
            }

            if (--remaining.count) {
                callback();
            }
        });
    }

    private _processFiles(files: Array<any>): void {
        for (var i = 0; i < files.length; i++) {
            var name = files[i].correctName.toLowerCase();
            var extension = name.split('.').pop();

            if (!this.onProcessFileCallback(files[i], name, extension)) {
                continue;
            }

            if (SceneLoader.IsPluginForExtensionAvailable("." + extension)) {
                this._sceneFileToLoad = files[i];
            }

            FilesInput.FilesToLoad[name] = files[i];
        }
    }

    /**
     * Load files from a drop event
     * @param event defines the drop event to use as source
     */
    public loadFiles(event: any): void {
        // Handling data transfer via drag'n'drop
        if (event && event.dataTransfer && event.dataTransfer.files) {
            this._filesToLoad = event.dataTransfer.files;
        }

        // Handling files from input files
        if (event && event.target && event.target.files) {
            this._filesToLoad = event.target.files;
        }

        if (!this._filesToLoad || this._filesToLoad.length === 0) {
            return;
        }

        if (this._startingProcessingFilesCallback) {
            this._startingProcessingFilesCallback(this._filesToLoad);
        }

        if (this._filesToLoad && this._filesToLoad.length > 0) {
            let files = new Array<File>();
            let folders = [];
            var items = event.dataTransfer ? event.dataTransfer.items : null;

            for (var i = 0; i < this._filesToLoad.length; i++) {
                let fileToLoad: any = this._filesToLoad[i];
                let name = fileToLoad.name.toLowerCase();
                let entry;

                fileToLoad.correctName = name;

                if (items) {
                    let item = items[i];
                    if (item.getAsEntry) {
                        entry = item.getAsEntry();
                    } else if (item.webkitGetAsEntry) {
                        entry = item.webkitGetAsEntry();
                    }
                }

                if (!entry) {
                    files.push(fileToLoad);
                } else {
                    if (entry.isDirectory) {
                        folders.push(entry);
                    } else {
                        files.push(fileToLoad);
                    }
                }
            }

            if (folders.length === 0) {
                this._processFiles(files);
                this._processReload();
            } else {
                var remaining = { count: folders.length };
                for (var folder of folders) {
                    this._traverseFolder(folder, files, remaining, () => {
                        this._processFiles(files);

                        if (remaining.count === 0) {
                            this._processReload();
                        }
                    });
                }
            }

        }
    }

    private _processReload() {
        if (this._onReloadCallback) {
            this._onReloadCallback(this._sceneFileToLoad);
        }
        else {
            this.reload();
        }
    }

    /**
     * Reload the current scene from the loaded files
     */
    public reload() {
        // If a scene file has been provided
        if (this._sceneFileToLoad) {
            if (this._currentScene) {
                if (Logger.errorsCount > 0) {
                    Logger.ClearLogCache();
                }
                this._engine.stopRenderLoop();
            }

            SceneLoader.ShowLoadingScreen = false;
            this._engine.displayLoadingUI();
            SceneLoader.LoadAsync("file:", this._sceneFileToLoad, this._engine, (progress) => {
                if (this._progressCallback) {
                    this._progressCallback(progress);
                }
            }).then((scene) => {
                if (this._currentScene) {
                    this._currentScene.dispose();
                }

                this._currentScene = scene;

                if (this._sceneLoadedCallback) {
                    this._sceneLoadedCallback(this._sceneFileToLoad, this._currentScene);
                }

                // Wait for textures and shaders to be ready
                this._currentScene.executeWhenReady(() => {
                    this._engine.hideLoadingUI();
                    this._engine.runRenderLoop(() => {
                        this.renderFunction();
                    });
                });
            }).catch((error) => {
                this._engine.hideLoadingUI();
                if (this._errorCallback) {
                    this._errorCallback(this._sceneFileToLoad, this._currentScene, error.message);
                }
            });
        }
        else {
            Logger.Error("Please provide a valid .babylon file.");
        }
    }
}
