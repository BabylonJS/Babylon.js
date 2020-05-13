/// <reference path="../dist/preview release/babylon.d.ts" />

var assetUrl;
var cameraPosition;
var kiosk;
var currentGroup; // animation group
var currentGroupIndex;
var currentScene;

// html tags
var footer = document.getElementById("footer");
var canvas = document.getElementById("renderCanvas");
var canvasZone = document.getElementById("canvasZone");

// Check URL
var indexOf = location.href.indexOf("?");
if (indexOf !== -1) {
    var params = location.href.substr(indexOf + 1).split("&");
    for (var index = 0; index < params.length; index++) {
        var param = params[index].split("=");
        var name = param[0];
        var value = param[1];
        switch (name) {
            case "assetUrl": {
                assetUrl = value;
                break;
            }
            case "cameraPosition": {
                cameraPosition = BABYLON.Vector3.FromArray(value.split(",").map(function(component) { return +component; }));
                break;
            }
            case "kiosk": {
                kiosk = value === "true" ? true : false;
                break;
            }
        }
    }
}

if (kiosk) {
    footer.style.display = "none";
    canvasZone.style.height = "100%";
}

if (BABYLON.Engine.isSupported()) {
    var engine = new BABYLON.Engine(canvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });
    var htmlInput = document.getElementById("files");
    var btnInspector = document.getElementById("btnInspector");
    var errorZone = document.getElementById("errorZone");
    var filesInput;
    var currentScene;
    var currentSkybox;
    var currentPluginName;
    var skyboxPath = skyboxes[defaultSkyboxIndex];
    var debugLayerEnabled = false;

    engine.loadingUIBackgroundColor = "#2A2342";

    btnInspector.classList.add("hidden");
    btnEnvironment.classList.add("hidden");

    canvas.addEventListener("contextmenu", function(evt) {
        evt.preventDefault();
    }, false);

    BABYLON.Engine.ShadersRepository = "/src/Shaders/";

    // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
    BABYLON.Animation.AllowMatricesInterpolation = true;

    // Setting up some GLTF values
    BABYLON.GLTFFileLoader.IncrementalLoading = false;
    BABYLON.SceneLoader.OnPluginActivatedObservable.add(function(plugin) {
        currentPluginName = plugin.name;
        if (currentPluginName === "gltf") {
            plugin.onValidatedObservable.add(function(results) {
                if (results.issues.numErrors > 0) {
                    debugLayerEnabled = true;
                }
            });
        }
    });

    // Resize
    window.addEventListener("resize", function() {
        engine.resize();
    });

    var anyLoaded = function(babylonScene, playFirstAnimationGroup) {
        // Clear dropdown that contains animation names
        dropdownContent.innerHTML = "";
        animationBar.style.display = "none";
        currentGroup = null;
        babylonScene.skipFrustumClipping = true;

        if (babylonScene.animationGroups.length > 0) {
            animationBar.style.display = "flex";
            for (var index = 0; index < babylonScene.animationGroups.length; index++) {
                var group = babylonScene.animationGroups[index];
                createDropdownLink(group, index);
            }
            currentGroupIndex = playFirstAnimationGroup ? 0 : babylonScene.animationGroups.length - 1;
            currentGroup = babylonScene.animationGroups[currentGroupIndex];
            currentGroup.play(true);
        }

        // Sync the slider with the current frame
        babylonScene.registerBeforeRender(function() {
            if (currentGroup) {
                var targetedAnimations = currentGroup.targetedAnimations;
                if (targetedAnimations.length > 0) {
                    var runtimeAnimations = currentGroup.targetedAnimations[0].animation.runtimeAnimations;
                    if (runtimeAnimations.length > 0) {
                        slider.value = runtimeAnimations[0].currentFrame;
                    }
                }
            }
        });

        // Clear the error
        errorZone.style.display = 'none';
    }

    var assetContainerLoaded = function (sceneFile, babylonScene) {
        anyLoaded(babylonScene);
    }

    var sceneLoaded = function (sceneFile, babylonScene) {
        engine.clearInternalTexturesCache();

        anyLoaded(babylonScene, true);

        // Fix for IE, otherwise it will change the default filter for files selection after first use
        htmlInput.value = "";

        currentScene = babylonScene;

        babylonScene.onAnimationFileImportedObservable.add(function (scene) {
            anyLoaded(scene, false);
        });

        document.title = "Babylon.js - " + sceneFile.name;

        btnInspector.classList.remove("hidden");
        btnEnvironment.classList.remove("hidden");

        // Attach camera to canvas inputs
        if (!currentScene.activeCamera || currentScene.lights.length === 0) {
            currentScene.createDefaultCamera(true);

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
                    currentScene.activeCamera.lowerRadiusLimit = null;

                    var worldExtends = currentScene.getWorldExtends(function (mesh) {
                        return mesh.isVisible && mesh.isEnabled();
                    });
                    framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
                }
            }

            currentScene.activeCamera.pinchPrecision = 200 / currentScene.activeCamera.radius;
            currentScene.activeCamera.upperRadiusLimit = 5 * currentScene.activeCamera.radius;

            currentScene.activeCamera.wheelDeltaPercentage = 0.01;
            currentScene.activeCamera.pinchDeltaPercentage = 0.01;
        }

        currentScene.activeCamera.attachControl(canvas);

        // Lighting
        if (currentPluginName === "gltf") {
            if (!currentScene.environmentTexture) {
                currentScene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(skyboxPath, currentScene);
            }

            currentSkybox = currentScene.createDefaultSkybox(currentScene.environmentTexture, true, (currentScene.activeCamera.maxZ - currentScene.activeCamera.minZ) / 2, 0.3, false);
        }
        else {
            var pbrPresent = false;
            for (var i = 0; i < currentScene.materials.length; i++) {
                if (currentScene.materials[i]._transparencyMode !== undefined) {
                    pbrPresent = true;
                    break;
                }
            }

            if (pbrPresent) {
                if (!currentScene.environmentTexture) {
                    currentScene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(skyboxPath, currentScene);
                }
            }
            else {
                currentScene.createDefaultLight();
            }
        }

        // In case of error during loading, meshes will be empty and clearColor is set to red
        if (currentScene.meshes.length === 0 && currentScene.clearColor.r === 1 && currentScene.clearColor.g === 0 && currentScene.clearColor.b === 0) {
            document.getElementById("logo").className = "";
            canvas.style.opacity = 0;
            debugLayerEnabled = true;
        }
        else {
            if (BABYLON.Tools.errorsCount > 0) {
                debugLayerEnabled = true;
            }
            document.getElementById("logo").className = "hidden";
            document.getElementById("droptext").className = "hidden";
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

        if (debugLayerEnabled) {
            currentScene.debugLayer.show();
        }
    };

    var sceneError = function(sceneFile, babylonScene, message) {
        document.title = "Babylon.js - " + sceneFile.name;
        document.getElementById("logo").className = "";
        canvas.style.opacity = 0;

        var errorContent = '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>' + message.replace("file:[object File]", "'" + sceneFile.name + "'") + '</div>';

        errorZone.style.display = 'block';
        errorZone.innerHTML = errorContent;

        // Close button error
        errorZone.querySelector('.close').addEventListener('click', function() {
            errorZone.style.display = 'none';
        });
    };

    var loadFromAssetUrl = function() {
        var rootUrl = BABYLON.Tools.GetFolderPath(assetUrl);
        var fileName = BABYLON.Tools.GetFilename(assetUrl);
        BABYLON.SceneLoader.LoadAsync(rootUrl, fileName, engine).then(function(scene) {
            if (currentScene) {
                currentScene.dispose();
            }

            sceneLoaded({ name: fileName }, scene);

            scene.whenReadyAsync().then(function() {
                engine.runRenderLoop(function() {
                    scene.render();
                });
            });
        }).catch(function(reason) {
            sceneError({ name: fileName }, null, reason.message || reason);
        });
    };

    if (assetUrl) {
        loadFromAssetUrl();
    }
    else {
        var startProcessingFiles = function() {
            BABYLON.Tools.ClearLogCache();
        };

        filesInput = new BABYLON.FilesInput(engine, null, sceneLoaded, null, null, null, startProcessingFiles, null, sceneError);
        filesInput.onProcessFileCallback = (function(file, name, extension) {
            if (filesInput._filesToLoad && filesInput._filesToLoad.length === 1 && extension) {
                if (extension.toLowerCase() === "dds" || extension.toLowerCase() === "env") {
                    BABYLON.FilesInput.FilesToLoad[name] = file;
                    skyboxPath = "file:" + file.correctName;
                    return false;
                }
            }
            return true;
        }).bind(this);
        filesInput.monitorElementForDragNDrop(canvas);

        htmlInput.addEventListener('change', function(event) {
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

    window.addEventListener("keydown", function(event) {
        // Press R to reload
        if (event.keyCode === 82 && event.target.nodeName !== "INPUT" && currentScene) {
            if (assetUrl) {
                loadFromAssetUrl();
            }
            else {
                filesInput.reload();
            }
        }
    });

    btnInspector.addEventListener('click', function() {
        if (currentScene) {
            if (currentScene.debugLayer.isVisible()) {
                debugLayerEnabled = false;
                currentScene.debugLayer.hide();
            }
            else {
                currentScene.debugLayer.show();
                debugLayerEnabled = true;
            }
        }
    }, false);

    window.addEventListener("keydown", function(event) {
        // Press space to toggle footer
        if (event.keyCode === 32 && event.target.nodeName !== "INPUT") {
            if (footer.style.display === "none") {
                footer.style.display = "block";
                canvasZone.style.height = "calc(100% - 56px)";
                if (debugLayerEnabled) {
                    currentScene.debugLayer.show();
                }
                engine.resize();
            }
            else {
                footer.style.display = "none";
                canvasZone.style.height = "100%";
                errorZone.style.display = "none";
                engine.resize();
                if (currentScene.debugLayer.isVisible()) {
                    currentScene.debugLayer.hide();
                }
            }
        }
    });

    sizeScene();

    window.onresize = function() {
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

