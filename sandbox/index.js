﻿if (BABYLON.Engine.isSupported()) {
    var canvas = document.getElementById("renderCanvas");
    var engine = new BABYLON.Engine(canvas, true);
    var divFps = document.getElementById("fps");
    var htmlInput = document.getElementById("files");
    var btnFullScreen = document.getElementById("btnFullscreen");
    var btnDownArrow = document.getElementById("btnDownArrow");
    var perffooter = document.getElementById("perf");
    var btnPerf = document.getElementById("btnPerf");
    var miscCounters = document.getElementById("miscCounters");
    var help01 = document.getElementById("help01");
    var help02 = document.getElementById("help02");
    var loadingText = document.getElementById("loadingText");
    var filesInput;
    var currentHelpCounter;
    var currentScene;
    var currentSkybox;
    var enableDebugLayer = false;
    var currentPluginName;

    canvas.addEventListener("contextmenu", function(evt) {
        evt.preventDefault();
    }, false);

    currentHelpCounter = localStorage.getItem("helpcounter");

    BABYLON.Engine.ShadersRepository = "/src/Shaders/";

    if (!currentHelpCounter) currentHelpCounter = 0;

    // Setting up some GLTF values
    BABYLON.SceneLoader.OnPluginActivatedObservable.add(function(plugin) {
        currentPluginName = plugin.name;

        if (plugin.name !== "gltf") {
            return;
        }
        plugin.onBeforeMaterialReadyAsync = function(material, mesh, isLOD, callback) {
            if (!isLOD) {
                callback();
                return;
            }
            material.forceCompilation(mesh, callback);
        }
    });

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    var sceneLoaded = function (sceneFile, babylonScene) {
        function displayDebugLayerAndLogs() {
            currentScene.debugLayer._displayLogs = true;
            enableDebugLayer = true;
            currentScene.debugLayer.show();
        };
        function hideDebugLayerAndLogs() {
            currentScene.debugLayer._displayLogs = false;
            enableDebugLayer = false;
            currentScene.debugLayer.hide();
        };
        if (enableDebugLayer) {
            hideDebugLayerAndLogs();
        }
        currentScene = babylonScene;
        document.title = "BabylonJS - " + sceneFile.name;
        // Fix for IE, otherwise it will change the default filter for files selection after first use
        htmlInput.value = "";

        // Attach camera to canvas inputs
        if (!currentScene.activeCamera || currentScene.lights.length === 0) {     
            currentScene.createDefaultCameraOrLight(true);
            // Enable camera's behaviors
            currentScene.activeCamera.useBouncingBehavior = true;
            currentScene.activeCamera.useFramingBehavior = true;

            var framingBehavior = currentScene.activeCamera.getBehaviorByName("Framing");
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            var bouncingBehavior = currentScene.activeCamera.getBehaviorByName("Bouncing");
            bouncingBehavior.autoTransitionRange = true;        

            if (currentScene.meshes.length) {
                var worldExtends = currentScene.getWorldExtends();
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
            }
        }

        currentScene.activeCamera.attachControl(canvas); 

        // Environment
        if (currentPluginName === "gltf") {
            var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("Assets/environment.dds", currentScene);
            currentSkybox = currentScene.createDefaultSkybox(hdrTexture, true, (currentScene.activeCamera.maxZ - currentScene.activeCamera.minZ) / 2, 0.3);
        }

        // In case of error during loading, meshes will be empty and clearColor is set to red
        if (currentScene.meshes.length === 0 && currentScene.clearColor.r === 1 && currentScene.clearColor.g === 0 && currentScene.clearColor.b === 0) {
            document.getElementById("logo").className = "";
            canvas.style.opacity = 0;
            displayDebugLayerAndLogs();
        }
        else {
            if (BABYLON.Tools.errorsCount > 0) {
                displayDebugLayerAndLogs();
            }
            document.getElementById("logo").className = "hidden";
            canvas.style.opacity = 1;
            if (currentScene.activeCamera.keysUp) {
                currentScene.activeCamera.keysUp.push(90); // Z
                currentScene.activeCamera.keysUp.push(87); // W
                currentScene.activeCamera.keysDown.push(83); // S
                currentScene.activeCamera.keysLeft.push(65); // A
                currentScene.activeCamera.keysLeft.push(81); // Q
                currentScene.activeCamera.keysRight.push(69); // E
                currentScene.activeCamera.keysRight.push(68); // D
            }
        }
    };

    filesInput = new BABYLON.FilesInput(engine, null, sceneLoaded);
    filesInput.onProcessFileCallback = (function (file, name, extension) {
        if (extension === "dds") {
            BABYLON.FilesInput.FilesToLoad[name] = file;
            var newHdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("file:" + file.correctName, currentScene);
            if (currentSkybox) {
                currentSkybox.dispose();
            }
            currentSkybox = currentScene.createDefaultSkybox(newHdrTexture, true, (currentScene.activeCamera.maxZ - currentScene.activeCamera.minZ) / 2, 0.3);
            return false;
        }
        return true;
    }).bind(this);
    filesInput.monitorElementForDragNDrop(canvas);

    window.addEventListener("keydown", function (evt) {
        // Press R to reload
        if (evt.keyCode === 82) {
            filesInput.reload();
        }
    });
    htmlInput.addEventListener('change', function (event) {
        var filestoLoad;
        // Handling data transfer via drag'n'drop
        if (event && event.dataTransfer && event.dataTransfer.files) {
            filesToLoad = event.dataTransfer.files;
        }
        // Handling files from input files
        if (event && event.target && event.target.files) {
            filesToLoad = event.target.files;
        }
        filesInput.loadFiles(event);
    }, false);
    btnFullScreen.addEventListener('click', function () {
        engine.switchFullscreen(true);
    }, false);
    btnPerf.addEventListener('click', function () {
        if (currentScene) {
            if (!enableDebugLayer) {
                currentScene.debugLayer.show();
                enableDebugLayer = true;

            } else {
                currentScene.debugLayer.hide();
                enableDebugLayer = false;
            }
        }
    }, false);
    // The help tips will be displayed only 5 times
    if (currentHelpCounter < 5) {
        help01.className = "help shown";

        setTimeout(function () {
            help01.className = "help";
            help02.className = "help2 shown";
            setTimeout(function () {
                help02.className = "help2";
                localStorage.setItem("helpcounter", currentHelpCounter + 1);
            }, 5000);
        }, 5000);
    }
}
