"use strict";

var BABYLON = BABYLON || {};

(function () {
    var that;

    /// Register to core BabylonJS object: engine, scene, rendering canvas, callback function when the scene will be loaded,
    /// loading progress callback and optionnal addionnal logic to call in the rendering loop
    BABYLON.FilesInput = function (p_engine, p_scene, p_canvas, p_sceneLoadedCallback,
                                   p_progressCallback, p_additionnalRenderLoopLogicCallback, p_textureLoadingCallback, p_startingProcessingFilesCallback) {
        that = this;
        this.engine = p_engine;
        this.canvas = p_canvas;
        this.currentScene = p_scene;
        this.sceneLoadedCallback = p_sceneLoadedCallback;
        this.progressCallback = p_progressCallback;
        this.additionnalRenderLoopLogicCallback = p_additionnalRenderLoopLogicCallback;
        this.textureLoadingCallback = p_textureLoadingCallback;
        this.startingProcessingFilesCallback = p_startingProcessingFilesCallback;

        this.engine.runRenderLoop(renderFunction);
    };

    // elementToMonitor is the HTML element that will listen to drag'n'drop events
    // it could be the rendering canvas or whatever element on the page
    BABYLON.FilesInput.prototype.monitorElementForDragNDrop = function (p_elementToMonitor) {
        if (p_elementToMonitor) {
            this.elementToMonitor = p_elementToMonitor;
            this.elementToMonitor.addEventListener("dragenter", drag, false);
            this.elementToMonitor.addEventListener("dragover", drag, false);
            this.elementToMonitor.addEventListener("drop", drop, false);
        }
    };

    function renderFunction() {
        if (that.additionnalRenderLoopLogicCallback) {
            that.additionnalRenderLoopLogicCallback();
        }

        if (that.currentScene) {
            if (that.textureLoadingCallback) {
                var remaining = that.currentScene.getWaitingItemsCount();

                if (remaining > 0) {
                    that.textureLoadingCallback(remaining);
                }
            }
            that.currentScene.render();
        }
    };

    function drag(e) {
        e.stopPropagation();
        e.preventDefault();
    };

    function drop(eventDrop) {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        that.loadFiles(eventDrop);
    };

    BABYLON.FilesInput.prototype.loadFiles = function (event) {
        if (that.startingProcessingFilesCallback) that.startingProcessingFilesCallback();

        var sceneFileToLoad;
        var filesToLoad;
        BABYLON.FilesTextures = {};

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
                if (filesToLoad[i].name.indexOf(".babylon") !== -1 && filesToLoad[i].name.indexOf(".manifest") === -1
				 && filesToLoad[i].name.indexOf(".incremental") === -1 && filesToLoad[i].name.indexOf(".babylonmeshdata") === -1) {
                    sceneFileToLoad = filesToLoad[i];
                }
                else {
                    if (filesToLoad[i].type.indexOf("image/jpeg") == 0 || filesToLoad[i].type.indexOf("image/png") == 0) {
                        BABYLON.FilesTextures[filesToLoad[i].name] = filesToLoad[i];
                    }
                }
            }

            // If a ".babylon" file has been provided
            if (sceneFileToLoad) {
                if (that.currentScene) {
                    that.currentScene.dispose();
                }

                BABYLON.SceneLoader.Load("file:", sceneFileToLoad, that.engine, function (newScene) {
                    that.currentScene = newScene;

                    // Wait for textures and shaders to be ready
                    that.currentScene.executeWhenReady(function () {
                        // Attach camera to canvas inputs
                        that.currentScene.activeCamera.attachControl(that.canvas);
                        if (that.sceneLoadedCallback) {
                            that.sceneLoadedCallback(sceneFileToLoad, that.currentScene);
                        }
                    });
                }, function (progress) {
                    if (that.progressCallback) {
                        that.progressCallback(progress);
                    }
                });
            }
            else {
                console.log("Please provide a valid .babylon file.");
            }
        }
    };
})();