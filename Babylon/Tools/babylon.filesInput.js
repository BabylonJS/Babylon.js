"use strict";

var BABYLON = BABYLON || {};

(function () {
    var elementToMonitor;
    var engine;
    var canvas;
    var currentScene;

    // elementToMonitor is the HTML element that will listen to drag'n'drop events
    // it could be the rendering canvas or whatever element on the page
    BABYLON.FilesInput = function (p_engine, p_canvas, p_elementToMonitor) {
        if (p_elementToMonitor) {
            elementToMonitor = p_elementToMonitor;
            elementToMonitor.addEventListener("dragenter", drag, false);
            elementToMonitor.addEventListener("dragover", drag, false);
            elementToMonitor.addEventListener("drop", drop, false);
        }
        engine = p_engine;
        canvas = p_canvas;

        engine.runRenderLoop(renderFunction);
    };

    function renderFunction() {
        if (currentScene) {
            currentScene.render();
        }
    };

    function drag(e) {
        e.stopPropagation();
        e.preventDefault();
    };

    function drop(eventDrop) {
        eventDrop.stopPropagation();
        eventDrop.preventDefault();

        BABYLON.FilesInput.loadFiles(eventDrop);
    };

    BABYLON.FilesInput.loadFiles = function (event) {
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

        if (filesToLoad) {
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
                BABYLON.SceneLoader.Load("file:", sceneFileToLoad, engine, function (newScene) {
                    if (currentScene) currentScene.dispose();

                    currentScene = newScene;

                    // Wait for textures and shaders to be ready
                    currentScene.executeWhenReady(function () {
                        // Attach camera to canvas inputs
                        currentScene.activeCamera.attachControl(canvas);

                    });
                }, function (progress) {
                    // To do: give progress feedback to user
                });
            }
            else {
                console.log("Please provide a valid .babylon file.");
            }
        }
    };
})();