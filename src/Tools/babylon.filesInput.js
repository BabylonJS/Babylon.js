var BABYLON;
(function (BABYLON) {
    var FilesInput = (function () {
        /// Register to core BabylonJS object: engine, scene, rendering canvas, callback function when the scene will be loaded,
        /// loading progress callback and optionnal addionnal logic to call in the rendering loop
        function FilesInput(p_engine, p_scene, p_canvas, p_sceneLoadedCallback, p_progressCallback, p_additionnalRenderLoopLogicCallback, p_textureLoadingCallback, p_startingProcessingFilesCallback) {
            this._engine = p_engine;
            this._canvas = p_canvas;
            this._currentScene = p_scene;
            this._sceneLoadedCallback = p_sceneLoadedCallback;
            this._progressCallback = p_progressCallback;
            this._additionnalRenderLoopLogicCallback = p_additionnalRenderLoopLogicCallback;
            this._textureLoadingCallback = p_textureLoadingCallback;
            this._startingProcessingFilesCallback = p_startingProcessingFilesCallback;
        }
        FilesInput.prototype.monitorElementForDragNDrop = function (p_elementToMonitor) {
            var _this = this;
            if (p_elementToMonitor) {
                this._elementToMonitor = p_elementToMonitor;
                this._elementToMonitor.addEventListener("dragenter", function (e) { _this.drag(e); }, false);
                this._elementToMonitor.addEventListener("dragover", function (e) { _this.drag(e); }, false);
                this._elementToMonitor.addEventListener("drop", function (e) { _this.drop(e); }, false);
            }
        };
        FilesInput.prototype.renderFunction = function () {
            if (this._additionnalRenderLoopLogicCallback) {
                this._additionnalRenderLoopLogicCallback();
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
        };
        FilesInput.prototype.drag = function (e) {
            e.stopPropagation();
            e.preventDefault();
        };
        FilesInput.prototype.drop = function (eventDrop) {
            eventDrop.stopPropagation();
            eventDrop.preventDefault();
            this.loadFiles(eventDrop);
        };
        FilesInput.prototype.loadFiles = function (event) {
            if (this._startingProcessingFilesCallback)
                this._startingProcessingFilesCallback();
            // Handling data transfer via drag'n'drop
            if (event && event.dataTransfer && event.dataTransfer.files) {
                this._filesToLoad = event.dataTransfer.files;
            }
            // Handling files from input files
            if (event && event.target && event.target.files) {
                this._filesToLoad = event.target.files;
            }
            if (this._filesToLoad && this._filesToLoad.length > 0) {
                for (var i = 0; i < this._filesToLoad.length; i++) {
                    switch (this._filesToLoad[i].type) {
                        case "image/jpeg":
                        case "image/png":
                        case "image/bmp":
                            FilesInput.FilesTextures[this._filesToLoad[i].name] = this._filesToLoad[i];
                            break;
                        case "image/targa":
                        case "image/vnd.ms-dds":
                        case "audio/wav":
                        case "audio/x-wav":
                        case "audio/mp3":
                        case "audio/mpeg":
                        case "audio/mpeg3":
                        case "audio/x-mpeg-3":
                        case "audio/ogg":
                            FilesInput.FilesToLoad[this._filesToLoad[i].name] = this._filesToLoad[i];
                            break;
                        default:
                            if (this._filesToLoad[i].name.indexOf(".mtl") !== -1) {
                                FilesInput.FilesToLoad[this._filesToLoad[i].name] = this._filesToLoad[i];
                            }
                            else if ((this._filesToLoad[i].name.indexOf(".babylon") !== -1 ||
                                this._filesToLoad[i].name.indexOf(".stl") !== -1 ||
                                this._filesToLoad[i].name.indexOf(".obj") !== -1)
                                && this._filesToLoad[i].name.indexOf(".manifest") === -1
                                && this._filesToLoad[i].name.indexOf(".incremental") === -1 && this._filesToLoad[i].name.indexOf(".babylonmeshdata") === -1
                                && this._filesToLoad[i].name.indexOf(".babylongeometrydata") === -1 && this._filesToLoad[i].name.indexOf(".babylonbinarymeshdata") === -1 &&
                                this._filesToLoad[i].name.indexOf(".binary.babylon") === -1) {
                                this._sceneFileToLoad = this._filesToLoad[i];
                            }
                            break;
                    }
                }
                this.reload();
            }
        };
        FilesInput.prototype.reload = function () {
            var _this = this;
            var that = this;
            // If a ".babylon" file has been provided
            if (this._sceneFileToLoad) {
                if (this._currentScene) {
                    if (BABYLON.Tools.errorsCount > 0) {
                        BABYLON.Tools.ClearLogCache();
                        BABYLON.Tools.Log("Babylon.js engine (v" + BABYLON.Engine.Version + ") launched");
                    }
                    this._engine.stopRenderLoop();
                    this._currentScene.dispose();
                }
                BABYLON.SceneLoader.Load("file:", this._sceneFileToLoad, this._engine, function (newScene) {
                    that._currentScene = newScene;
                    // Wait for textures and shaders to be ready
                    that._currentScene.executeWhenReady(function () {
                        // Attach camera to canvas inputs
                        if (!that._currentScene.activeCamera || that._currentScene.lights.length === 0) {
                            that._currentScene.createDefaultCameraOrLight();
                        }
                        that._currentScene.activeCamera.attachControl(that._canvas);
                        if (that._sceneLoadedCallback) {
                            that._sceneLoadedCallback(_this._sceneFileToLoad, that._currentScene);
                        }
                        that._engine.runRenderLoop(function () { that.renderFunction(); });
                    });
                }, function (progress) {
                    if (_this._progressCallback) {
                        _this._progressCallback(progress);
                    }
                });
            }
            else {
                BABYLON.Tools.Error("Please provide a valid .babylon file.");
            }
        };
        FilesInput.FilesTextures = new Array();
        FilesInput.FilesToLoad = new Array();
        return FilesInput;
    }());
    BABYLON.FilesInput = FilesInput;
})(BABYLON || (BABYLON = {}));
