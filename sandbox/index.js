/// <reference path="../dist/preview release/babylon.d.ts" />
/// <reference path="../dist/preview release/loaders/babylon.glTFFileLoader.d.ts" />

var assetUrl;
var cameraPosition;
var kiosk;

var indexOf = location.href.indexOf("?");
if (indexOf !== -1) {
    var params = location.href.substr(indexOf + 1).split("&");
    for (var index = 0; index < params.length; index++) {
        var [name, value] = params[index].split("=");
        switch (name) {
            case "assetUrl": {
                assetUrl = value;
                break;
            }
            case "cameraPosition": {
                cameraPosition = BABYLON.Vector3.FromArray(value.split(",").map(component => +component));
                break;
            }
            case "kiosk": {
                kiosk = value === "true" ? true : false;
                break;
            }
        }
    }
}

if (BABYLON.Engine.isSupported()) {
    var canvas = document.getElementById("renderCanvas");
    var engine = new BABYLON.Engine(canvas, true);
    var htmlInput = document.getElementById("files");
    var footer = document.getElementById("footer");
    var btnFullScreen = document.getElementById("btnFullscreen");
    var btnPerf = document.getElementById("btnPerf");
    var help01 = document.getElementById("help01");
    var help02 = document.getElementById("help02");
    var errorZone = document.getElementById("errorZone");
    var filesInput;
    var currentHelpCounter;
    var currentScene;
    var currentSkybox;
    var enableDebugLayer = false;
    var currentPluginName;
    var skyboxPath = "Assets/environment.dds";

    canvas.addEventListener("contextmenu", function (evt) {
        evt.preventDefault();
    }, false);

    currentHelpCounter = localStorage.getItem("helpcounter");

    BABYLON.Engine.ShadersRepository = "/src/Shaders/";

    if (!currentHelpCounter) currentHelpCounter = 0;

    // Setting up some GLTF values
    BABYLON.GLTFFileLoader.IncrementalLoading = false;
    BABYLON.SceneLoader.OnPluginActivatedObservable.add(function (plugin) {
        currentPluginName = plugin.name;
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

        // Clear the error
        errorZone.style.display = 'none';

        currentScene = babylonScene;
        document.title = "BabylonJS - " + sceneFile.name;
        // Fix for IE, otherwise it will change the default filter for files selection after first use
        htmlInput.value = "";

        // removing glTF created camera
        if (currentScene.activeCamera && currentPluginName === "gltf") {
            currentScene.activeCamera.dispose();
            currentScene.activeCamera = null;
        }
        // Attach camera to canvas inputs
        if (!currentScene.activeCamera || currentScene.lights.length === 0) {
            currentScene.createDefaultCameraOrLight(true);

            if (cameraPosition) {
                currentScene.activeCamera.setPosition(cameraPosition);
            }
            else {
                if (currentPluginName === "gltf") {
                    // glTF assets use a +Z forward convention while the default camera faces +Z. Rotate the camera to look at the front of the asset.
                    currentScene.activeCamera.alpha += Math.PI;
                }

                // Enable camera's behaviors
                currentScene.activeCamera.useFramingBehavior = true;

                var framingBehavior = currentScene.activeCamera.getBehaviorByName("Framing");
                framingBehavior.framingTime = 0;
                framingBehavior.elevationReturnTime = -1;

                if (currentScene.meshes.length) {
                    var worldExtends = currentScene.getWorldExtends();
                    currentScene.activeCamera.lowerRadiusLimit = null;
                    framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
                }
            }

            currentScene.activeCamera.pinchPrecision = 200 / currentScene.activeCamera.radius;
            currentScene.activeCamera.upperRadiusLimit = 5 * currentScene.activeCamera.radius;

            currentScene.activeCamera.wheelDeltaPercentage = 0.01;
            currentScene.activeCamera.pinchDeltaPercentage = 0.01;
        }

        currentScene.activeCamera.attachControl(canvas);

        // Environment
        if (currentPluginName === "gltf") {
            var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(skyboxPath, currentScene);
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

    var sceneError = function (sceneFile, babylonScene, message) {
        document.title = "BabylonJS - " + sceneFile.name;
        document.getElementById("logo").className = "";
        canvas.style.opacity = 0;

        var errorContent = '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message.replace("file:[object File]", "'" + sceneFile.name + "'") + '</div>';

        errorZone.style.display = 'block';
        errorZone.innerHTML = errorContent;

        // Close button error
        errorZone.querySelector('.close').addEventListener('click', function () {
            errorZone.style.display = 'none';
        });
    };

    if (assetUrl) {
        var rootUrl = BABYLON.Tools.GetFolderPath(assetUrl);
        var fileName = BABYLON.Tools.GetFilename(assetUrl);
        BABYLON.SceneLoader.LoadAsync(rootUrl, fileName, engine).then(function (scene) {
            sceneLoaded({ name: fileName }, scene);
            scene.whenReadyAsync().then(function () {
                engine.runRenderLoop(function ()  {
                    scene.render();
                });
            });
        }).catch(function (reason) {
            sceneError({ name: fileName }, null, reason);
        });
    }
    else {
        filesInput = new BABYLON.FilesInput(engine, null, sceneLoaded, null, null, null, function () { BABYLON.Tools.ClearLogCache() }, null, sceneError);
        filesInput.onProcessFileCallback = (function (file, name, extension) {
            if (filesInput._filesToLoad && filesInput._filesToLoad.length === 1 && extension && extension.toLowerCase() === "dds") {
                BABYLON.FilesInput.FilesToLoad[name] = file;
                skyboxPath = "file:" + file.correctName;
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
    }

    if (kiosk) {
        footer.style.display = "none";
    }
    else {
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

    window.addEventListener("keydown", function (evt) {
        // Press Esc to toggle footer
        if (evt.keyCode === 27) {
            if (footer.style.display === "none") {
                footer.style.display = "block";
            }
            else {
                footer.style.display = "none";
                errorZone.style.display = "none";
                if (enableDebugLayer) {
                    currentScene.debugLayer.hide();
                    enableDebugLayer = false;
                }
            }
        }
    });

    sizeScene();

    window.onresize = function () {
        sizeScene();
    }
}

function sizeScene() {
    let divInspWrapper = document.getElementsByClassName('insp-wrapper')[0];
    if (divInspWrapper) {
        let divFooter = document.getElementsByClassName('footer')[0];
        divInspWrapper.style.height = (document.body.clientHeight - divFooter.clientHeight) + "px";
        divInspWrapper.style['max-width'] = document.body.clientWidth + "px";
    }
}
