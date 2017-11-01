module BABYLON {
    export class FilesInput {
        public static FilesToLoad: {[key: string]: File} = {};

        public onProcessFileCallback: (file: File, name: string, extension: string) => true = () => { return true; };

        private _engine: Engine;
        private _currentScene: Scene;
        private _sceneLoadedCallback: (sceneFile: File, scene: Scene) => void;
        private _progressCallback: (progress: ProgressEvent) => void;
        private _additionalRenderLoopLogicCallback: () => void;
        private _textureLoadingCallback: (remaining: number) => void;
        private _startingProcessingFilesCallback: () => void;
        private _onReloadCallback: (sceneFile: File) => void;
        private _errorCallback: (sceneFile: File, scene: Scene, message: string) => void;
        private _elementToMonitor: HTMLElement;

        private _sceneFileToLoad: File;
        private _filesToLoad: File[];

        constructor(engine: Engine, scene: Scene, sceneLoadedCallback: (sceneFile: File, scene: Scene) => void, progressCallback: (progress: ProgressEvent) => void, additionalRenderLoopLogicCallback: () => void, 
                    textureLoadingCallback: (remaining: number) => void, startingProcessingFilesCallback: () => void, onReloadCallback: (sceneFile: File) => void, errorCallback: (sceneFile: File, scene: Scene, message: string) => void) {
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
                        entry.file((file:any) => {
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
            var skippedFiles = 0;
            for (var i = 0; i < files.length; i++) {
                var name = files[i].correctName.toLowerCase();
                var extension = name.split('.').pop();

                if (!this.onProcessFileCallback(files[i], name, extension)) {
                    skippedFiles++;
                    continue;
                }

                if ((extension === "babylon" || extension === "stl" || extension === "obj" || extension === "gltf" || extension === "glb") 
                    && name.indexOf(".binary.babylon") === -1 && name.indexOf(".incremental.babylon") === -1) {
                    this._sceneFileToLoad = files[i];
                }
                else {
                    FilesInput.FilesToLoad[name] = files[i];
                }
            }

            if (this._onReloadCallback) {
                this._onReloadCallback(this._sceneFileToLoad);
            }
            else if (skippedFiles < files.length) {
                this.reload();
            }
        }

        public loadFiles(event: any): void {
            if (this._startingProcessingFilesCallback) this._startingProcessingFilesCallback();

            // Handling data transfer via drag'n'drop
            if (event && event.dataTransfer && event.dataTransfer.files) {
                this._filesToLoad = event.dataTransfer.files;
            }

            // Handling files from input files
            if (event && event.target && event.target.files) {
                this._filesToLoad = event.target.files;
            }

            if (this._filesToLoad && this._filesToLoad.length > 0) {
                let files = new Array<File>();
                let folders = [];
                var items = event.dataTransfer ? event.dataTransfer.items : null;

                for (var i = 0; i < this._filesToLoad.length; i++) {
                    let fileToLoad:any =  this._filesToLoad[i];
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
                } else {
                    var remaining = { count: folders.length };
                    for (var folder of folders) {
                        this._traverseFolder(folder, files, remaining, () => {
                            this._processFiles(files);
                        });
                    }
                }
            }
        }

        public reload() {
            // If a ".babylon" file has been provided
            if (this._sceneFileToLoad) {
                if (this._currentScene) {
                    if (Tools.errorsCount > 0) {
                        Tools.ClearLogCache();
                        Tools.Log("Babylon.js engine (v" + Engine.Version + ") launched");
                    }
                    this._engine.stopRenderLoop();
                    this._currentScene.dispose();
                }

                SceneLoader.Load("file:", this._sceneFileToLoad, this._engine, (newScene) => {
                    this._currentScene = newScene;

                    if (this._sceneLoadedCallback) {
                        this._sceneLoadedCallback(this._sceneFileToLoad, this._currentScene);
                    }

                    // Wait for textures and shaders to be ready
                    this._currentScene.executeWhenReady(() => {
                        this._engine.runRenderLoop(() => {
                            this.renderFunction();
                        });
                    });
                }, progress => {
                    if (this._progressCallback) {
                        this._progressCallback(progress);
                    }
                }, (scene, message) => {
                    this._currentScene = scene;

                    if (this._errorCallback) {
                        this._errorCallback(this._sceneFileToLoad, this._currentScene, message);
                    }
                });
            }
            else {
                Tools.Error("Please provide a valid .babylon file.");
            }
        }
    }
}