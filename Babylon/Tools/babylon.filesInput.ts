// ANY
declare module BABYLON {
    export class SceneLoader {
        static Load: (param1: any, param2: any, param3: any, param4: any, param5: any) => void;
    }
}

module BABYLON {
    export class FilesInput {
        private engine: BABYLON.Engine;
        private currentScene: BABYLON.Scene;
        private canvas: HTMLCanvasElement;
        private sceneLoadedCallback;
        private progressCallback;
        private additionnalRenderLoopLogicCallback;
        private textureLoadingCallback;
        private startingProcessingFilesCallback;
        private elementToMonitor: HTMLElement;
        public static FilesTextures: any[] = new Array();
        public static FilesToLoad: any[] = new Array();

        /// Register to core BabylonJS object: engine, scene, rendering canvas, callback function when the scene will be loaded,
        /// loading progress callback and optionnal addionnal logic to call in the rendering loop
        constructor(p_engine: BABYLON.Engine, p_scene: BABYLON.Scene, p_canvas: HTMLCanvasElement, p_sceneLoadedCallback,
            p_progressCallback, p_additionnalRenderLoopLogicCallback, p_textureLoadingCallback, p_startingProcessingFilesCallback) {
            this.engine = p_engine;
            this.canvas = p_canvas;
            this.currentScene = p_scene;
            this.sceneLoadedCallback = p_sceneLoadedCallback;
            this.progressCallback = p_progressCallback;
            this.additionnalRenderLoopLogicCallback = p_additionnalRenderLoopLogicCallback;
            this.textureLoadingCallback = p_textureLoadingCallback;
            this.startingProcessingFilesCallback = p_startingProcessingFilesCallback;
        }

        public monitorElementForDragNDrop(p_elementToMonitor: HTMLElement): void {
            if (p_elementToMonitor) {
                this.elementToMonitor = p_elementToMonitor;
                this.elementToMonitor.addEventListener("dragenter", (e) => { this.drag(e); }, false);
                this.elementToMonitor.addEventListener("dragover", (e) => { this.drag(e); }, false);
                this.elementToMonitor.addEventListener("drop", (e) => { this.drop(e); }, false);
            }
        }

        private renderFunction(): void {
            if (this.additionnalRenderLoopLogicCallback) {
                this.additionnalRenderLoopLogicCallback();
            }

            if (this.currentScene) {
                if (this.textureLoadingCallback) {
                    var remaining = this.currentScene.getWaitingItemsCount();

                    if (remaining > 0) {
                        this.textureLoadingCallback(remaining);
                    }
                }
                this.currentScene.render();
            }
        }

        private drag(e): void {
            e.stopPropagation();
            e.preventDefault();
        }

        private drop(eventDrop): void {
            eventDrop.stopPropagation();
            eventDrop.preventDefault();

            this.loadFiles(eventDrop);
        }

        private loadFiles(event): void {
            var that = this;
            if (this.startingProcessingFilesCallback) this.startingProcessingFilesCallback();

            var sceneFileToLoad: File;
            var filesToLoad: File[];

            // Handling data transfer via drag'n'drop
            if (event && event.dataTransfer && event.dataTransfer.files) {
                filesToLoad = event.dataTransfer.files;
            }

            // Handling files from input files
            if (event && event.target && event.target.files) {
                filesToLoad = event.target.files;
            }

            if (filesToLoad && filesToLoad.length > 0) {
                for (var i = 0; i < filesToLoad.length; i++) {
                    switch (filesToLoad[i].type) {
                        case "image/jpeg":
                        case "image/png":
                            BABYLON.FilesInput.FilesTextures[filesToLoad[i].name] = filesToLoad[i];
                            break;
                        case "image/targa":
                        case "image/vnd.ms-dds":
                            BABYLON.FilesInput.FilesToLoad[filesToLoad[i].name] = filesToLoad[i];
                            break;
                        default:
                            if (filesToLoad[i].name.indexOf(".babylon") !== -1 && filesToLoad[i].name.indexOf(".manifest") === -1
                                && filesToLoad[i].name.indexOf(".incremental") === -1 && filesToLoad[i].name.indexOf(".babylonmeshdata") === -1
                                && filesToLoad[i].name.indexOf(".babylongeometrydata") === -1) {
                                sceneFileToLoad = filesToLoad[i];
                            }
                            break;
                    }
                }

                // If a ".babylon" file has been provided
                if (sceneFileToLoad) {
                    if (this.currentScene) {
                        this.engine.stopRenderLoop();
                        this.currentScene.dispose();
                    }

                    BABYLON.SceneLoader.Load("file:", sceneFileToLoad, this.engine, (newScene) => {
                        that.currentScene = newScene;

                        // Wait for textures and shaders to be ready
                        that.currentScene.executeWhenReady(() => {
                            // Attach camera to canvas inputs
                            if (that.currentScene.activeCamera) {
                                that.currentScene.activeCamera.attachControl(that.canvas);
                            }
                            if (that.sceneLoadedCallback) {
                                that.sceneLoadedCallback(sceneFileToLoad, that.currentScene);
                            }
                            that.engine.runRenderLoop(() => { that.renderFunction(); });
                        });
                    }, progress => {
                        if (this.progressCallback) {
                            this.progressCallback(progress);
                        }
                    });
                }
                else {
                    BABYLON.Tools.Error("Please provide a valid .babylon file.");
                }
            }
        }
    }
}