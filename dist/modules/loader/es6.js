

import * as BABYLON from 'babylonjs/core/es6';
var BABYLON;
(function (BABYLON) {
    var DefaultLoadingScreen = /** @class */ (function () {
        function DefaultLoadingScreen(_renderingCanvas, _loadingText, _loadingDivBackgroundColor) {
            if (_loadingText === void 0) { _loadingText = ""; }
            if (_loadingDivBackgroundColor === void 0) { _loadingDivBackgroundColor = "black"; }
            var _this = this;
            this._renderingCanvas = _renderingCanvas;
            this._loadingText = _loadingText;
            this._loadingDivBackgroundColor = _loadingDivBackgroundColor;
            // Resize
            this._resizeLoadingUI = function () {
                var canvasRect = _this._renderingCanvas.getBoundingClientRect();
                var canvasPositioning = window.getComputedStyle(_this._renderingCanvas).position;
                if (!_this._loadingDiv) {
                    return;
                }
                _this._loadingDiv.style.position = (canvasPositioning === "fixed") ? "fixed" : "absolute";
                _this._loadingDiv.style.left = canvasRect.left + "px";
                _this._loadingDiv.style.top = canvasRect.top + "px";
                _this._loadingDiv.style.width = canvasRect.width + "px";
                _this._loadingDiv.style.height = canvasRect.height + "px";
            };
        }
        DefaultLoadingScreen.prototype.displayLoadingUI = function () {
            if (this._loadingDiv) {
                // Do not add a loading screen if there is already one  
                return;
            }
            this._loadingDiv = document.createElement("div");
            this._loadingDiv.id = "babylonjsLoadingDiv";
            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.style.transition = "opacity 1.5s ease";
            this._loadingDiv.style.pointerEvents = "none";
            // Loading text
            this._loadingTextDiv = document.createElement("div");
            this._loadingTextDiv.style.position = "absolute";
            this._loadingTextDiv.style.left = "0";
            this._loadingTextDiv.style.top = "50%";
            this._loadingTextDiv.style.marginTop = "80px";
            this._loadingTextDiv.style.width = "100%";
            this._loadingTextDiv.style.height = "20px";
            this._loadingTextDiv.style.fontFamily = "Arial";
            this._loadingTextDiv.style.fontSize = "14px";
            this._loadingTextDiv.style.color = "white";
            this._loadingTextDiv.style.textAlign = "center";
            this._loadingTextDiv.innerHTML = "Loading";
            this._loadingDiv.appendChild(this._loadingTextDiv);
            //set the predefined text
            this._loadingTextDiv.innerHTML = this._loadingText;
            // Generating keyframes
            var style = document.createElement('style');
            style.type = 'text/css';
            var keyFrames = "@-webkit-keyframes spin1 {                    0% { -webkit-transform: rotate(0deg);}\n                    100% { -webkit-transform: rotate(360deg);}\n                }                @keyframes spin1 {                    0% { transform: rotate(0deg);}\n                    100% { transform: rotate(360deg);}\n                }";
            style.innerHTML = keyFrames;
            document.getElementsByTagName('head')[0].appendChild(style);
            // Loading img
            var imgBack = new Image();
            imgBack.src = "data:image/png;base64,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";
            imgBack.style.position = "absolute";
            imgBack.style.left = "50%";
            imgBack.style.top = "50%";
            imgBack.style.marginLeft = "-60px";
            imgBack.style.marginTop = "-60px";
            imgBack.style.animation = "spin1 2s infinite ease-in-out";
            imgBack.style.webkitAnimation = "spin1 2s infinite ease-in-out";
            imgBack.style.transformOrigin = "50% 50%";
            imgBack.style.webkitTransformOrigin = "50% 50%";
            this._loadingDiv.appendChild(imgBack);
            this._resizeLoadingUI();
            window.addEventListener("resize", this._resizeLoadingUI);
            this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            document.body.appendChild(this._loadingDiv);
            this._loadingDiv.style.opacity = "1";
        };
        DefaultLoadingScreen.prototype.hideLoadingUI = function () {
            var _this = this;
            if (!this._loadingDiv) {
                return;
            }
            var onTransitionEnd = function () {
                if (!_this._loadingDiv) {
                    return;
                }
                document.body.removeChild(_this._loadingDiv);
                window.removeEventListener("resize", _this._resizeLoadingUI);
                _this._loadingDiv = null;
            };
            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.addEventListener("transitionend", onTransitionEnd);
        };
        Object.defineProperty(DefaultLoadingScreen.prototype, "loadingUIText", {
            set: function (text) {
                this._loadingText = text;
                if (this._loadingTextDiv) {
                    this._loadingTextDiv.innerHTML = this._loadingText;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DefaultLoadingScreen.prototype, "loadingUIBackgroundColor", {
            get: function () {
                return this._loadingDivBackgroundColor;
            },
            set: function (color) {
                this._loadingDivBackgroundColor = color;
                if (!this._loadingDiv) {
                    return;
                }
                this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            },
            enumerable: true,
            configurable: true
        });
        return DefaultLoadingScreen;
    }());
    BABYLON.DefaultLoadingScreen = DefaultLoadingScreen;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.loadingScreen.js.map

var BABYLON;
(function (BABYLON) {
    var SceneLoaderProgressEvent = /** @class */ (function () {
        function SceneLoaderProgressEvent(lengthComputable, loaded, total) {
            this.lengthComputable = lengthComputable;
            this.loaded = loaded;
            this.total = total;
        }
        SceneLoaderProgressEvent.FromProgressEvent = function (event) {
            return new SceneLoaderProgressEvent(event.lengthComputable, event.loaded, event.total);
        };
        return SceneLoaderProgressEvent;
    }());
    BABYLON.SceneLoaderProgressEvent = SceneLoaderProgressEvent;
    var SceneLoader = /** @class */ (function () {
        function SceneLoader() {
        }
        Object.defineProperty(SceneLoader, "NO_LOGGING", {
            get: function () {
                return 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "MINIMAL_LOGGING", {
            get: function () {
                return 1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "SUMMARY_LOGGING", {
            get: function () {
                return 2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "DETAILED_LOGGING", {
            get: function () {
                return 3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "ForceFullSceneLoadingForIncremental", {
            get: function () {
                return SceneLoader._ForceFullSceneLoadingForIncremental;
            },
            set: function (value) {
                SceneLoader._ForceFullSceneLoadingForIncremental = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "ShowLoadingScreen", {
            get: function () {
                return SceneLoader._ShowLoadingScreen;
            },
            set: function (value) {
                SceneLoader._ShowLoadingScreen = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "loggingLevel", {
            get: function () {
                return SceneLoader._loggingLevel;
            },
            set: function (value) {
                SceneLoader._loggingLevel = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneLoader, "CleanBoneMatrixWeights", {
            get: function () {
                return SceneLoader._CleanBoneMatrixWeights;
            },
            set: function (value) {
                SceneLoader._CleanBoneMatrixWeights = value;
            },
            enumerable: true,
            configurable: true
        });
        SceneLoader._getDefaultPlugin = function () {
            return SceneLoader._registeredPlugins[".babylon"];
        };
        SceneLoader._getPluginForExtension = function (extension) {
            var registeredPlugin = SceneLoader._registeredPlugins[extension];
            if (registeredPlugin) {
                return registeredPlugin;
            }
            BABYLON.Tools.Warn("Unable to find a plugin to load " + extension + " files. Trying to use .babylon default plugin.");
            return SceneLoader._getDefaultPlugin();
        };
        SceneLoader._getPluginForDirectLoad = function (data) {
            for (var extension in SceneLoader._registeredPlugins) {
                var plugin = SceneLoader._registeredPlugins[extension].plugin;
                if (plugin.canDirectLoad && plugin.canDirectLoad(data)) {
                    return SceneLoader._registeredPlugins[extension];
                }
            }
            return SceneLoader._getDefaultPlugin();
        };
        SceneLoader._getPluginForFilename = function (sceneFilename) {
            if (sceneFilename.name) {
                sceneFilename = sceneFilename.name;
            }
            var queryStringPosition = sceneFilename.indexOf("?");
            if (queryStringPosition !== -1) {
                sceneFilename = sceneFilename.substring(0, queryStringPosition);
            }
            var dotPosition = sceneFilename.lastIndexOf(".");
            var extension = sceneFilename.substring(dotPosition, sceneFilename.length).toLowerCase();
            return SceneLoader._getPluginForExtension(extension);
        };
        // use babylon file loader directly if sceneFilename is prefixed with "data:"
        SceneLoader._getDirectLoad = function (sceneFilename) {
            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                return sceneFilename.substr(5);
            }
            return null;
        };
        SceneLoader._loadData = function (rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, onDispose, pluginExtension) {
            var directLoad = SceneLoader._getDirectLoad(sceneFilename);
            var registeredPlugin = pluginExtension ? SceneLoader._getPluginForExtension(pluginExtension) : (directLoad ? SceneLoader._getPluginForDirectLoad(sceneFilename) : SceneLoader._getPluginForFilename(sceneFilename));
            var plugin;
            if (registeredPlugin.plugin.createPlugin) {
                plugin = registeredPlugin.plugin.createPlugin();
            }
            else {
                plugin = registeredPlugin.plugin;
            }
            var useArrayBuffer = registeredPlugin.isBinary;
            var database;
            SceneLoader.OnPluginActivatedObservable.notifyObservers(plugin);
            var dataCallback = function (data, responseURL) {
                if (scene.isDisposed) {
                    onError("Scene has been disposed");
                    return;
                }
                scene.database = database;
                onSuccess(plugin, data, responseURL);
            };
            var request = null;
            var pluginDisposed = false;
            var onDisposeObservable = plugin.onDisposeObservable;
            if (onDisposeObservable) {
                onDisposeObservable.add(function () {
                    pluginDisposed = true;
                    if (request) {
                        request.abort();
                        request = null;
                    }
                    onDispose();
                });
            }
            var manifestChecked = function () {
                if (pluginDisposed) {
                    return;
                }
                var url = rootUrl + sceneFilename;
                request = BABYLON.Tools.LoadFile(url, dataCallback, onProgress ? function (event) {
                    onProgress(SceneLoaderProgressEvent.FromProgressEvent(event));
                } : undefined, database, useArrayBuffer, function (request, exception) {
                    onError("Failed to load scene." + (exception ? "" : " " + exception.message), exception);
                });
            };
            if (directLoad) {
                dataCallback(directLoad);
                return plugin;
            }
            if (rootUrl.indexOf("file:") === -1) {
                if (scene.getEngine().enableOfflineSupport) {
                    // Checking if a manifest file has been set for this scene and if offline mode has been requested
                    database = new BABYLON.Database(rootUrl + sceneFilename, manifestChecked);
                }
                else {
                    manifestChecked();
                }
            }
            else {
                var fileOrString = sceneFilename;
                if (fileOrString.name) {
                    request = BABYLON.Tools.ReadFile(fileOrString, dataCallback, onProgress, useArrayBuffer);
                }
                else if (BABYLON.FilesInput.FilesToLoad[sceneFilename]) {
                    request = BABYLON.Tools.ReadFile(BABYLON.FilesInput.FilesToLoad[sceneFilename], dataCallback, onProgress, useArrayBuffer);
                }
                else {
                    onError("Unable to find file named " + sceneFilename);
                }
            }
            return plugin;
        };
        // Public functions
        SceneLoader.GetPluginForExtension = function (extension) {
            return SceneLoader._getPluginForExtension(extension).plugin;
        };
        SceneLoader.IsPluginForExtensionAvailable = function (extension) {
            return !!SceneLoader._registeredPlugins[extension];
        };
        SceneLoader.RegisterPlugin = function (plugin) {
            if (typeof plugin.extensions === "string") {
                var extension = plugin.extensions;
                SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                    plugin: plugin,
                    isBinary: false
                };
            }
            else {
                var extensions = plugin.extensions;
                Object.keys(extensions).forEach(function (extension) {
                    SceneLoader._registeredPlugins[extension.toLowerCase()] = {
                        plugin: plugin,
                        isBinary: extensions[extension].isBinary
                    };
                });
            }
        };
        /**
        * Import meshes into a scene
        * @param meshNames an array of mesh names, a single mesh name, or empty string for all meshes that filter what meshes are imported
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with a list of imported meshes, particleSystems, and skeletons when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        SceneLoader.ImportMesh = function (meshNames, rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension) {
            if (onSuccess === void 0) { onSuccess = null; }
            if (onProgress === void 0) { onProgress = null; }
            if (onError === void 0) { onError = null; }
            if (pluginExtension === void 0) { pluginExtension = null; }
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                BABYLON.Tools.Error("Wrong sceneFilename parameter");
                return null;
            }
            var loadingToken = {};
            scene._addPendingData(loadingToken);
            var disposeHandler = function () {
                scene._removePendingData(loadingToken);
            };
            var errorHandler = function (message, exception) {
                var errorMessage = "Unable to import meshes from " + rootUrl + sceneFilename + ": " + message;
                if (onError) {
                    onError(scene, errorMessage, exception);
                }
                else {
                    BABYLON.Tools.Error(errorMessage);
                    // should the exception be thrown?
                }
                disposeHandler();
            };
            var progressHandler = onProgress ? function (event) {
                try {
                    onProgress(event);
                }
                catch (e) {
                    errorHandler("Error in onProgress callback", e);
                }
            } : undefined;
            var successHandler = function (meshes, particleSystems, skeletons) {
                scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                if (onSuccess) {
                    try {
                        onSuccess(meshes, particleSystems, skeletons);
                    }
                    catch (e) {
                        errorHandler("Error in onSuccess callback", e);
                    }
                }
                scene._removePendingData(loadingToken);
            };
            return SceneLoader._loadData(rootUrl, sceneFilename, scene, function (plugin, data, responseURL) {
                if (plugin.rewriteRootURL) {
                    rootUrl = plugin.rewriteRootURL(rootUrl, responseURL);
                }
                if (plugin.importMesh) {
                    var syncedPlugin = plugin;
                    var meshes = new Array();
                    var particleSystems = new Array();
                    var skeletons = new Array();
                    if (!syncedPlugin.importMesh(meshNames, scene, data, rootUrl, meshes, particleSystems, skeletons, errorHandler)) {
                        return;
                    }
                    scene.loadingPluginName = plugin.name;
                    successHandler(meshes, particleSystems, skeletons);
                }
                else {
                    var asyncedPlugin = plugin;
                    asyncedPlugin.importMeshAsync(meshNames, scene, data, rootUrl, function (meshes, particleSystems, skeletons) {
                        scene.loadingPluginName = plugin.name;
                        successHandler(meshes, particleSystems, skeletons);
                    }, progressHandler, errorHandler);
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        };
        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        SceneLoader.Load = function (rootUrl, sceneFilename, engine, onSuccess, onProgress, onError, pluginExtension) {
            if (onSuccess === void 0) { onSuccess = null; }
            if (onProgress === void 0) { onProgress = null; }
            if (onError === void 0) { onError = null; }
            if (pluginExtension === void 0) { pluginExtension = null; }
            return SceneLoader.Append(rootUrl, sceneFilename, new BABYLON.Scene(engine), onSuccess, onProgress, onError, pluginExtension);
        };
        /**
        * Append a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param scene is the instance of BABYLON.Scene to append to
        * @param onSuccess a callback with the scene when import succeeds
        * @param onProgress a callback with a progress event for each file being loaded
        * @param onError a callback with the scene, a message, and possibly an exception when import fails
        */
        SceneLoader.Append = function (rootUrl, sceneFilename, scene, onSuccess, onProgress, onError, pluginExtension) {
            if (onSuccess === void 0) { onSuccess = null; }
            if (onProgress === void 0) { onProgress = null; }
            if (onError === void 0) { onError = null; }
            if (pluginExtension === void 0) { pluginExtension = null; }
            if (sceneFilename.substr && sceneFilename.substr(0, 1) === "/") {
                BABYLON.Tools.Error("Wrong sceneFilename parameter");
                return null;
            }
            if (SceneLoader.ShowLoadingScreen) {
                scene.getEngine().displayLoadingUI();
            }
            var loadingToken = {};
            scene._addPendingData(loadingToken);
            var disposeHandler = function () {
                scene._removePendingData(loadingToken);
                scene.getEngine().hideLoadingUI();
            };
            var errorHandler = function (message, exception) {
                var errorMessage = "Unable to load from " + rootUrl + sceneFilename + (message ? ": " + message : "");
                if (onError) {
                    onError(scene, errorMessage, exception);
                }
                else {
                    BABYLON.Tools.Error(errorMessage);
                    // should the exception be thrown?
                }
                disposeHandler();
            };
            var progressHandler = onProgress ? function (event) {
                try {
                    onProgress(event);
                }
                catch (e) {
                    errorHandler("Error in onProgress callback", e);
                }
            } : undefined;
            var successHandler = function () {
                if (onSuccess) {
                    try {
                        onSuccess(scene);
                    }
                    catch (e) {
                        errorHandler("Error in onSuccess callback", e);
                    }
                }
                scene._removePendingData(loadingToken);
            };
            return SceneLoader._loadData(rootUrl, sceneFilename, scene, function (plugin, data, responseURL) {
                if (plugin.load) {
                    var syncedPlugin = plugin;
                    if (!syncedPlugin.load(scene, data, rootUrl, errorHandler)) {
                        return;
                    }
                    scene.loadingPluginName = plugin.name;
                    successHandler();
                }
                else {
                    var asyncedPlugin = plugin;
                    asyncedPlugin.loadAsync(scene, data, rootUrl, function () {
                        scene.loadingPluginName = plugin.name;
                        successHandler();
                    }, progressHandler, errorHandler);
                }
                if (SceneLoader.ShowLoadingScreen) {
                    scene.executeWhenReady(function () {
                        scene.getEngine().hideLoadingUI();
                    });
                }
            }, progressHandler, errorHandler, disposeHandler, pluginExtension);
        };
        // Flags
        SceneLoader._ForceFullSceneLoadingForIncremental = false;
        SceneLoader._ShowLoadingScreen = true;
        SceneLoader._CleanBoneMatrixWeights = false;
        SceneLoader._loggingLevel = SceneLoader.NO_LOGGING;
        // Members
        SceneLoader.OnPluginActivatedObservable = new BABYLON.Observable();
        SceneLoader._registeredPlugins = {};
        return SceneLoader;
    }());
    BABYLON.SceneLoader = SceneLoader;
    ;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.sceneLoader.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var parseMaterialById = function (id, parsedData, scene, rootUrl) {
        for (var index = 0, cache = parsedData.materials.length; index < cache; index++) {
            var parsedMaterial = parsedData.materials[index];
            if (parsedMaterial.id === id) {
                return BABYLON.Material.Parse(parsedMaterial, scene, rootUrl);
            }
        }
        return null;
    };
    var isDescendantOf = function (mesh, names, hierarchyIds) {
        for (var i in names) {
            if (mesh.name === names[i]) {
                hierarchyIds.push(mesh.id);
                return true;
            }
        }
        if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
            hierarchyIds.push(mesh.id);
            return true;
        }
        return false;
    };
    var logOperation = function (operation, producer) {
        return operation + " of " + (producer ? producer.file + " from " + producer.name + " version: " + producer.version + ", exporter version: " + producer.exporter_version : "unknown");
    };
    BABYLON.SceneLoader.RegisterPlugin({
        name: "babylon.js",
        extensions: ".babylon",
        canDirectLoad: function (data) {
            if (data.indexOf("babylon") !== -1) {
                return true;
            }
            return false;
        },
        importMesh: function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons, onError) {
            // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
            // when SceneLoader.debugLogging = true (default), or exception encountered.
            // Everything stored in var log instead of writing separate lines to support only writing in exception,
            // and avoid problems with multiple concurrent .babylon loads.
            var log = "importMesh has failed JSON parse";
            try {
                var parsedData = JSON.parse(data);
                log = "";
                var fullDetails = BABYLON.SceneLoader.loggingLevel === BABYLON.SceneLoader.DETAILED_LOGGING;
                if (!meshesNames) {
                    meshesNames = null;
                }
                else if (!Array.isArray(meshesNames)) {
                    meshesNames = [meshesNames];
                }
                var hierarchyIds = new Array();
                if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                    var loadedSkeletonsIds = [];
                    var loadedMaterialsIds = [];
                    var index;
                    var cache;
                    for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                        var parsedMesh = parsedData.meshes[index];
                        if (meshesNames === null || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                            if (meshesNames !== null) {
                                // Remove found mesh name from list.
                                delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                            }
                            //Geometry?
                            if (parsedMesh.geometryId !== undefined && parsedMesh.geometryId !== null) {
                                //does the file contain geometries?
                                if (parsedData.geometries !== undefined && parsedData.geometries !== null) {
                                    //find the correct geometry and add it to the scene
                                    var found = false;
                                    ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"].forEach(function (geometryType) {
                                        if (found === true || !parsedData.geometries[geometryType] || !(Array.isArray(parsedData.geometries[geometryType]))) {
                                            return;
                                        }
                                        else {
                                            parsedData.geometries[geometryType].forEach(function (parsedGeometryData) {
                                                if (parsedGeometryData.id === parsedMesh.geometryId) {
                                                    switch (geometryType) {
                                                        case "boxes":
                                                            BABYLON.BoxGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "spheres":
                                                            BABYLON.SphereGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "cylinders":
                                                            BABYLON.CylinderGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "toruses":
                                                            BABYLON.TorusGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "grounds":
                                                            BABYLON.GroundGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "planes":
                                                            BABYLON.PlaneGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "torusKnots":
                                                            BABYLON.TorusKnotGeometry.Parse(parsedGeometryData, scene);
                                                            break;
                                                        case "vertexData":
                                                            BABYLON.Geometry.Parse(parsedGeometryData, scene, rootUrl);
                                                            break;
                                                    }
                                                    found = true;
                                                }
                                            });
                                        }
                                    });
                                    if (found === false) {
                                        BABYLON.Tools.Warn("Geometry not found for mesh " + parsedMesh.id);
                                    }
                                }
                            }
                            // Material ?
                            if (parsedMesh.materialId) {
                                var materialFound = (loadedMaterialsIds.indexOf(parsedMesh.materialId) !== -1);
                                if (materialFound === false && parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                                    for (var multimatIndex = 0, multimatCache = parsedData.multiMaterials.length; multimatIndex < multimatCache; multimatIndex++) {
                                        var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                        if (parsedMultiMaterial.id === parsedMesh.materialId) {
                                            for (var matIndex = 0, matCache = parsedMultiMaterial.materials.length; matIndex < matCache; matIndex++) {
                                                var subMatId = parsedMultiMaterial.materials[matIndex];
                                                loadedMaterialsIds.push(subMatId);
                                                var mat = parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                                log += "\n\tMaterial " + mat.toString(fullDetails);
                                            }
                                            loadedMaterialsIds.push(parsedMultiMaterial.id);
                                            var mmat = BABYLON.Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                                            materialFound = true;
                                            log += "\n\tMulti-Material " + mmat.toString(fullDetails);
                                            break;
                                        }
                                    }
                                }
                                if (materialFound === false) {
                                    loadedMaterialsIds.push(parsedMesh.materialId);
                                    var mat = parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl);
                                    if (!mat) {
                                        BABYLON.Tools.Warn("Material not found for mesh " + parsedMesh.id);
                                    }
                                    else {
                                        log += "\n\tMaterial " + mat.toString(fullDetails);
                                    }
                                }
                            }
                            // Skeleton ?
                            if (parsedMesh.skeletonId > -1 && parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
                                var skeletonAlreadyLoaded = (loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1);
                                if (skeletonAlreadyLoaded === false) {
                                    for (var skeletonIndex = 0, skeletonCache = parsedData.skeletons.length; skeletonIndex < skeletonCache; skeletonIndex++) {
                                        var parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                        if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                            var skeleton = BABYLON.Skeleton.Parse(parsedSkeleton, scene);
                                            skeletons.push(skeleton);
                                            loadedSkeletonsIds.push(parsedSkeleton.id);
                                            log += "\n\tSkeleton " + skeleton.toString(fullDetails);
                                        }
                                    }
                                }
                            }
                            var mesh = BABYLON.Mesh.Parse(parsedMesh, scene, rootUrl);
                            meshes.push(mesh);
                            log += "\n\tMesh " + mesh.toString(fullDetails);
                        }
                    }
                    // Connecting parents
                    var currentMesh;
                    for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                        currentMesh = scene.meshes[index];
                        if (currentMesh._waitingParentId) {
                            currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                            currentMesh._waitingParentId = null;
                        }
                    }
                    // freeze and compute world matrix application
                    for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                        currentMesh = scene.meshes[index];
                        if (currentMesh._waitingFreezeWorldMatrix) {
                            currentMesh.freezeWorldMatrix();
                            currentMesh._waitingFreezeWorldMatrix = null;
                        }
                        else {
                            currentMesh.computeWorldMatrix(true);
                        }
                    }
                }
                // Particles
                if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                    for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            particleSystems.push(BABYLON.ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
                return true;
            }
            catch (err) {
                var msg = logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + log;
                if (onError) {
                    onError(msg, err);
                }
                else {
                    BABYLON.Tools.Log(msg);
                    throw err;
                }
            }
            finally {
                if (log !== null && BABYLON.SceneLoader.loggingLevel !== BABYLON.SceneLoader.NO_LOGGING) {
                    BABYLON.Tools.Log(logOperation("importMesh", parsedData ? parsedData.producer : "Unknown") + (BABYLON.SceneLoader.loggingLevel !== BABYLON.SceneLoader.MINIMAL_LOGGING ? log : ""));
                }
            }
            return false;
        },
        load: function (scene, data, rootUrl, onError) {
            // Entire method running in try block, so ALWAYS logs as far as it got, only actually writes details
            // when SceneLoader.debugLogging = true (default), or exception encountered.
            // Everything stored in var log instead of writing separate lines to support only writing in exception,
            // and avoid problems with multiple concurrent .babylon loads.
            var log = "importScene has failed JSON parse";
            try {
                var parsedData = JSON.parse(data);
                log = "";
                var fullDetails = BABYLON.SceneLoader.loggingLevel === BABYLON.SceneLoader.DETAILED_LOGGING;
                // Scene
                if (parsedData.useDelayedTextureLoading !== undefined && parsedData.useDelayedTextureLoading !== null) {
                    scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental;
                }
                if (parsedData.autoClear !== undefined && parsedData.autoClear !== null) {
                    scene.autoClear = parsedData.autoClear;
                }
                if (parsedData.clearColor !== undefined && parsedData.clearColor !== null) {
                    scene.clearColor = BABYLON.Color4.FromArray(parsedData.clearColor);
                }
                if (parsedData.ambientColor !== undefined && parsedData.ambientColor !== null) {
                    scene.ambientColor = BABYLON.Color3.FromArray(parsedData.ambientColor);
                }
                if (parsedData.gravity !== undefined && parsedData.gravity !== null) {
                    scene.gravity = BABYLON.Vector3.FromArray(parsedData.gravity);
                }
                // Fog
                if (parsedData.fogMode && parsedData.fogMode !== 0) {
                    scene.fogMode = parsedData.fogMode;
                    scene.fogColor = BABYLON.Color3.FromArray(parsedData.fogColor);
                    scene.fogStart = parsedData.fogStart;
                    scene.fogEnd = parsedData.fogEnd;
                    scene.fogDensity = parsedData.fogDensity;
                    log += "\tFog mode for scene:  ";
                    switch (scene.fogMode) {
                        // getters not compiling, so using hardcoded
                        case 1:
                            log += "exp\n";
                            break;
                        case 2:
                            log += "exp2\n";
                            break;
                        case 3:
                            log += "linear\n";
                            break;
                    }
                }
                //Physics
                if (parsedData.physicsEnabled) {
                    var physicsPlugin;
                    if (parsedData.physicsEngine === "cannon") {
                        physicsPlugin = new BABYLON.CannonJSPlugin();
                    }
                    else if (parsedData.physicsEngine === "oimo") {
                        physicsPlugin = new BABYLON.OimoJSPlugin();
                    }
                    log = "\tPhysics engine " + (parsedData.physicsEngine ? parsedData.physicsEngine : "oimo") + " enabled\n";
                    //else - default engine, which is currently oimo
                    var physicsGravity = parsedData.physicsGravity ? BABYLON.Vector3.FromArray(parsedData.physicsGravity) : null;
                    scene.enablePhysics(physicsGravity, physicsPlugin);
                }
                // Metadata
                if (parsedData.metadata !== undefined && parsedData.metadata !== null) {
                    scene.metadata = parsedData.metadata;
                }
                //collisions, if defined. otherwise, default is true
                if (parsedData.collisionsEnabled !== undefined && parsedData.collisionsEnabled !== null) {
                    scene.collisionsEnabled = parsedData.collisionsEnabled;
                }
                scene.workerCollisions = !!parsedData.workerCollisions;
                var index;
                var cache;
                // Lights
                if (parsedData.lights !== undefined && parsedData.lights !== null) {
                    for (index = 0, cache = parsedData.lights.length; index < cache; index++) {
                        var parsedLight = parsedData.lights[index];
                        var light = BABYLON.Light.Parse(parsedLight, scene);
                        if (light) {
                            log += (index === 0 ? "\n\tLights:" : "");
                            log += "\n\t\t" + light.toString(fullDetails);
                        }
                    }
                }
                // Animations
                if (parsedData.animations !== undefined && parsedData.animations !== null) {
                    for (index = 0, cache = parsedData.animations.length; index < cache; index++) {
                        var parsedAnimation = parsedData.animations[index];
                        var animation = BABYLON.Animation.Parse(parsedAnimation);
                        scene.animations.push(animation);
                        log += (index === 0 ? "\n\tAnimations:" : "");
                        log += "\n\t\t" + animation.toString(fullDetails);
                    }
                }
                if (parsedData.autoAnimate) {
                    scene.beginAnimation(scene, parsedData.autoAnimateFrom, parsedData.autoAnimateTo, parsedData.autoAnimateLoop, parsedData.autoAnimateSpeed || 1.0);
                }
                // Materials
                if (parsedData.materials !== undefined && parsedData.materials !== null) {
                    for (index = 0, cache = parsedData.materials.length; index < cache; index++) {
                        var parsedMaterial = parsedData.materials[index];
                        var mat = BABYLON.Material.Parse(parsedMaterial, scene, rootUrl);
                        log += (index === 0 ? "\n\tMaterials:" : "");
                        log += "\n\t\t" + mat.toString(fullDetails);
                    }
                }
                if (parsedData.multiMaterials !== undefined && parsedData.multiMaterials !== null) {
                    for (index = 0, cache = parsedData.multiMaterials.length; index < cache; index++) {
                        var parsedMultiMaterial = parsedData.multiMaterials[index];
                        var mmat = BABYLON.Material.ParseMultiMaterial(parsedMultiMaterial, scene);
                        log += (index === 0 ? "\n\tMultiMaterials:" : "");
                        log += "\n\t\t" + mmat.toString(fullDetails);
                    }
                }
                // Morph targets
                if (parsedData.morphTargetManagers !== undefined && parsedData.morphTargetManagers !== null) {
                    for (var _i = 0, _a = parsedData.morphTargetManagers; _i < _a.length; _i++) {
                        var managerData = _a[_i];
                        BABYLON.MorphTargetManager.Parse(managerData, scene);
                    }
                }
                // Skeletons
                if (parsedData.skeletons !== undefined && parsedData.skeletons !== null) {
                    for (index = 0, cache = parsedData.skeletons.length; index < cache; index++) {
                        var parsedSkeleton = parsedData.skeletons[index];
                        var skeleton = BABYLON.Skeleton.Parse(parsedSkeleton, scene);
                        log += (index === 0 ? "\n\tSkeletons:" : "");
                        log += "\n\t\t" + skeleton.toString(fullDetails);
                    }
                }
                // Geometries
                var geometries = parsedData.geometries;
                if (geometries !== undefined && geometries !== null) {
                    // Boxes
                    var boxes = geometries.boxes;
                    if (boxes !== undefined && boxes !== null) {
                        for (index = 0, cache = boxes.length; index < cache; index++) {
                            var parsedBox = boxes[index];
                            BABYLON.BoxGeometry.Parse(parsedBox, scene);
                        }
                    }
                    // Spheres
                    var spheres = geometries.spheres;
                    if (spheres !== undefined && spheres !== null) {
                        for (index = 0, cache = spheres.length; index < cache; index++) {
                            var parsedSphere = spheres[index];
                            BABYLON.SphereGeometry.Parse(parsedSphere, scene);
                        }
                    }
                    // Cylinders
                    var cylinders = geometries.cylinders;
                    if (cylinders !== undefined && cylinders !== null) {
                        for (index = 0, cache = cylinders.length; index < cache; index++) {
                            var parsedCylinder = cylinders[index];
                            BABYLON.CylinderGeometry.Parse(parsedCylinder, scene);
                        }
                    }
                    // Toruses
                    var toruses = geometries.toruses;
                    if (toruses !== undefined && toruses !== null) {
                        for (index = 0, cache = toruses.length; index < cache; index++) {
                            var parsedTorus = toruses[index];
                            BABYLON.TorusGeometry.Parse(parsedTorus, scene);
                        }
                    }
                    // Grounds
                    var grounds = geometries.grounds;
                    if (grounds !== undefined && grounds !== null) {
                        for (index = 0, cache = grounds.length; index < cache; index++) {
                            var parsedGround = grounds[index];
                            BABYLON.GroundGeometry.Parse(parsedGround, scene);
                        }
                    }
                    // Planes
                    var planes = geometries.planes;
                    if (planes !== undefined && planes !== null) {
                        for (index = 0, cache = planes.length; index < cache; index++) {
                            var parsedPlane = planes[index];
                            BABYLON.PlaneGeometry.Parse(parsedPlane, scene);
                        }
                    }
                    // TorusKnots
                    var torusKnots = geometries.torusKnots;
                    if (torusKnots !== undefined && torusKnots !== null) {
                        for (index = 0, cache = torusKnots.length; index < cache; index++) {
                            var parsedTorusKnot = torusKnots[index];
                            BABYLON.TorusKnotGeometry.Parse(parsedTorusKnot, scene);
                        }
                    }
                    // VertexData
                    var vertexData = geometries.vertexData;
                    if (vertexData !== undefined && vertexData !== null) {
                        for (index = 0, cache = vertexData.length; index < cache; index++) {
                            var parsedVertexData = vertexData[index];
                            BABYLON.Geometry.Parse(parsedVertexData, scene, rootUrl);
                        }
                    }
                }
                // Transform nodes
                if (parsedData.transformNodes !== undefined && parsedData.transformNodes !== null) {
                    for (index = 0, cache = parsedData.transformNodes.length; index < cache; index++) {
                        var parsedTransformNode = parsedData.transformNodes[index];
                        BABYLON.TransformNode.Parse(parsedTransformNode, scene, rootUrl);
                    }
                }
                // Meshes
                if (parsedData.meshes !== undefined && parsedData.meshes !== null) {
                    for (index = 0, cache = parsedData.meshes.length; index < cache; index++) {
                        var parsedMesh = parsedData.meshes[index];
                        var mesh = BABYLON.Mesh.Parse(parsedMesh, scene, rootUrl);
                        log += (index === 0 ? "\n\tMeshes:" : "");
                        log += "\n\t\t" + mesh.toString(fullDetails);
                    }
                }
                // Cameras
                if (parsedData.cameras !== undefined && parsedData.cameras !== null) {
                    for (index = 0, cache = parsedData.cameras.length; index < cache; index++) {
                        var parsedCamera = parsedData.cameras[index];
                        var camera = BABYLON.Camera.Parse(parsedCamera, scene);
                        log += (index === 0 ? "\n\tCameras:" : "");
                        log += "\n\t\t" + camera.toString(fullDetails);
                    }
                }
                if (parsedData.activeCameraID !== undefined && parsedData.activeCameraID !== null) {
                    scene.setActiveCameraByID(parsedData.activeCameraID);
                }
                // Browsing all the graph to connect the dots
                for (index = 0, cache = scene.cameras.length; index < cache; index++) {
                    var camera = scene.cameras[index];
                    if (camera._waitingParentId) {
                        camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                        camera._waitingParentId = null;
                    }
                }
                for (index = 0, cache = scene.lights.length; index < cache; index++) {
                    var light_1 = scene.lights[index];
                    if (light_1 && light_1._waitingParentId) {
                        light_1.parent = scene.getLastEntryByID(light_1._waitingParentId);
                        light_1._waitingParentId = null;
                    }
                }
                // Sounds
                var loadedSounds = [];
                var loadedSound;
                if (BABYLON.AudioEngine && parsedData.sounds !== undefined && parsedData.sounds !== null) {
                    for (index = 0, cache = parsedData.sounds.length; index < cache; index++) {
                        var parsedSound = parsedData.sounds[index];
                        if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                            if (!parsedSound.url)
                                parsedSound.url = parsedSound.name;
                            if (!loadedSounds[parsedSound.url]) {
                                loadedSound = BABYLON.Sound.Parse(parsedSound, scene, rootUrl);
                                loadedSounds[parsedSound.url] = loadedSound;
                            }
                            else {
                                BABYLON.Sound.Parse(parsedSound, scene, rootUrl, loadedSounds[parsedSound.url]);
                            }
                        }
                        else {
                            new BABYLON.Sound(parsedSound.name, null, scene);
                        }
                    }
                }
                loadedSounds = [];
                // Connect parents & children and parse actions
                for (index = 0, cache = scene.transformNodes.length; index < cache; index++) {
                    var transformNode = scene.transformNodes[index];
                    if (transformNode._waitingParentId) {
                        transformNode.parent = scene.getLastEntryByID(transformNode._waitingParentId);
                        transformNode._waitingParentId = null;
                    }
                }
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    var mesh = scene.meshes[index];
                    if (mesh._waitingParentId) {
                        mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                        mesh._waitingParentId = null;
                    }
                    if (mesh._waitingActions) {
                        BABYLON.ActionManager.Parse(mesh._waitingActions, mesh, scene);
                        mesh._waitingActions = null;
                    }
                }
                // freeze world matrix application
                for (index = 0, cache = scene.meshes.length; index < cache; index++) {
                    var currentMesh = scene.meshes[index];
                    if (currentMesh._waitingFreezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingFreezeWorldMatrix = null;
                    }
                    else {
                        currentMesh.computeWorldMatrix(true);
                    }
                }
                // Particles Systems
                if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
                    for (index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        BABYLON.ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
                    }
                }
                // Environment texture
                if (parsedData.environmentTexture !== undefined && parsedData.environmentTexture !== null) {
                    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(rootUrl + parsedData.environmentTexture, scene);
                    if (parsedData.createDefaultSkybox === true) {
                        var skyboxScale = (scene.activeCamera !== undefined && scene.activeCamera !== null) ? (scene.activeCamera.maxZ - scene.activeCamera.minZ) / 2 : 1000;
                        var skyboxBlurLevel = parsedData.skyboxBlurLevel || 0;
                        scene.createDefaultSkybox(undefined, true, skyboxScale, skyboxBlurLevel);
                    }
                }
                // Lens flares
                if (parsedData.lensFlareSystems !== undefined && parsedData.lensFlareSystems !== null) {
                    for (index = 0, cache = parsedData.lensFlareSystems.length; index < cache; index++) {
                        var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                        BABYLON.LensFlareSystem.Parse(parsedLensFlareSystem, scene, rootUrl);
                    }
                }
                // Shadows
                if (parsedData.shadowGenerators !== undefined && parsedData.shadowGenerators !== null) {
                    for (index = 0, cache = parsedData.shadowGenerators.length; index < cache; index++) {
                        var parsedShadowGenerator = parsedData.shadowGenerators[index];
                        BABYLON.ShadowGenerator.Parse(parsedShadowGenerator, scene);
                    }
                }
                // Lights exclusions / inclusions
                for (index = 0, cache = scene.lights.length; index < cache; index++) {
                    var light_2 = scene.lights[index];
                    // Excluded check
                    if (light_2._excludedMeshesIds.length > 0) {
                        for (var excludedIndex = 0; excludedIndex < light_2._excludedMeshesIds.length; excludedIndex++) {
                            var excludedMesh = scene.getMeshByID(light_2._excludedMeshesIds[excludedIndex]);
                            if (excludedMesh) {
                                light_2.excludedMeshes.push(excludedMesh);
                            }
                        }
                        light_2._excludedMeshesIds = [];
                    }
                    // Included check
                    if (light_2._includedOnlyMeshesIds.length > 0) {
                        for (var includedOnlyIndex = 0; includedOnlyIndex < light_2._includedOnlyMeshesIds.length; includedOnlyIndex++) {
                            var includedOnlyMesh = scene.getMeshByID(light_2._includedOnlyMeshesIds[includedOnlyIndex]);
                            if (includedOnlyMesh) {
                                light_2.includedOnlyMeshes.push(includedOnlyMesh);
                            }
                        }
                        light_2._includedOnlyMeshesIds = [];
                    }
                }
                // Actions (scene)
                if (parsedData.actions !== undefined && parsedData.actions !== null) {
                    BABYLON.ActionManager.Parse(parsedData.actions, null, scene);
                }
                // Finish
                return true;
            }
            catch (err) {
                var msg = logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + log;
                if (onError) {
                    onError(msg, err);
                }
                else {
                    BABYLON.Tools.Log(msg);
                    throw err;
                }
            }
            finally {
                if (log !== null && BABYLON.SceneLoader.loggingLevel !== BABYLON.SceneLoader.NO_LOGGING) {
                    BABYLON.Tools.Log(logOperation("importScene", parsedData ? parsedData.producer : "Unknown") + (BABYLON.SceneLoader.loggingLevel !== BABYLON.SceneLoader.MINIMAL_LOGGING ? log : ""));
                }
            }
            return false;
        }
    });
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.babylonFileLoader.js.map

var BABYLON;
(function (BABYLON) {
    var FilesInput = /** @class */ (function () {
        function FilesInput(engine, scene, sceneLoadedCallback, progressCallback, additionalRenderLoopLogicCallback, textureLoadingCallback, startingProcessingFilesCallback, onReloadCallback, errorCallback) {
            this.onProcessFileCallback = function () { return true; };
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
        FilesInput.prototype.monitorElementForDragNDrop = function (elementToMonitor) {
            var _this = this;
            if (elementToMonitor) {
                this._elementToMonitor = elementToMonitor;
                this._dragEnterHandler = function (e) { _this.drag(e); };
                this._dragOverHandler = function (e) { _this.drag(e); };
                this._dropHandler = function (e) { _this.drop(e); };
                this._elementToMonitor.addEventListener("dragenter", this._dragEnterHandler, false);
                this._elementToMonitor.addEventListener("dragover", this._dragOverHandler, false);
                this._elementToMonitor.addEventListener("drop", this._dropHandler, false);
            }
        };
        FilesInput.prototype.dispose = function () {
            if (!this._elementToMonitor) {
                return;
            }
            this._elementToMonitor.removeEventListener("dragenter", this._dragEnterHandler);
            this._elementToMonitor.removeEventListener("dragover", this._dragOverHandler);
            this._elementToMonitor.removeEventListener("drop", this._dropHandler);
        };
        FilesInput.prototype.renderFunction = function () {
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
        FilesInput.prototype._traverseFolder = function (folder, files, remaining, callback) {
            var _this = this;
            var reader = folder.createReader();
            var relativePath = folder.fullPath.replace(/^\//, "").replace(/(.+?)\/?$/, "$1/");
            reader.readEntries(function (entries) {
                remaining.count += entries.length;
                for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                    var entry = entries_1[_i];
                    if (entry.isFile) {
                        entry.file(function (file) {
                            file.correctName = relativePath + file.name;
                            files.push(file);
                            if (--remaining.count === 0) {
                                callback();
                            }
                        });
                    }
                    else if (entry.isDirectory) {
                        _this._traverseFolder(entry, files, remaining, callback);
                    }
                }
                if (--remaining.count) {
                    callback();
                }
            });
        };
        FilesInput.prototype._processFiles = function (files) {
            for (var i = 0; i < files.length; i++) {
                var name = files[i].correctName.toLowerCase();
                var extension = name.split('.').pop();
                if (!this.onProcessFileCallback(files[i], name, extension)) {
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
        };
        FilesInput.prototype.loadFiles = function (event) {
            var _this = this;
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
                var files_1 = new Array();
                var folders = [];
                var items = event.dataTransfer ? event.dataTransfer.items : null;
                for (var i = 0; i < this._filesToLoad.length; i++) {
                    var fileToLoad = this._filesToLoad[i];
                    var name_1 = fileToLoad.name.toLowerCase();
                    var entry = void 0;
                    fileToLoad.correctName = name_1;
                    if (items) {
                        var item = items[i];
                        if (item.getAsEntry) {
                            entry = item.getAsEntry();
                        }
                        else if (item.webkitGetAsEntry) {
                            entry = item.webkitGetAsEntry();
                        }
                    }
                    if (!entry) {
                        files_1.push(fileToLoad);
                    }
                    else {
                        if (entry.isDirectory) {
                            folders.push(entry);
                        }
                        else {
                            files_1.push(fileToLoad);
                        }
                    }
                }
                if (folders.length === 0) {
                    this._processFiles(files_1);
                    this._processReload();
                }
                else {
                    var remaining = { count: folders.length };
                    for (var _i = 0, folders_1 = folders; _i < folders_1.length; _i++) {
                        var folder = folders_1[_i];
                        this._traverseFolder(folder, files_1, remaining, function () {
                            _this._processFiles(files_1);
                            if (remaining.count === 0) {
                                _this._processReload();
                            }
                        });
                    }
                }
            }
        };
        FilesInput.prototype._processReload = function () {
            if (this._onReloadCallback) {
                this._onReloadCallback(this._sceneFileToLoad);
            }
            else {
                this.reload();
            }
        };
        FilesInput.prototype.reload = function () {
            var _this = this;
            // If a scene file has been provided
            if (this._sceneFileToLoad) {
                if (this._currentScene) {
                    if (BABYLON.Tools.errorsCount > 0) {
                        BABYLON.Tools.ClearLogCache();
                    }
                    this._engine.stopRenderLoop();
                    this._currentScene.dispose();
                }
                BABYLON.SceneLoader.Load("file:", this._sceneFileToLoad, this._engine, function (newScene) {
                    _this._currentScene = newScene;
                    if (_this._sceneLoadedCallback) {
                        _this._sceneLoadedCallback(_this._sceneFileToLoad, _this._currentScene);
                    }
                    // Wait for textures and shaders to be ready
                    _this._currentScene.executeWhenReady(function () {
                        _this._engine.runRenderLoop(function () {
                            _this.renderFunction();
                        });
                    });
                }, function (progress) {
                    if (_this._progressCallback) {
                        _this._progressCallback(progress);
                    }
                }, function (scene, message) {
                    _this._currentScene = scene;
                    if (_this._errorCallback) {
                        _this._errorCallback(_this._sceneFileToLoad, _this._currentScene, message);
                    }
                });
            }
            else {
                BABYLON.Tools.Error("Please provide a valid .babylon file.");
            }
        };
        FilesInput.FilesToLoad = {};
        return FilesInput;
    }());
    BABYLON.FilesInput = FilesInput;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.filesInput.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var DefaultLoadingScreen = BABYLON.DefaultLoadingScreen;
var SceneLoaderProgressEvent = BABYLON.SceneLoaderProgressEvent;
var SceneLoader = BABYLON.SceneLoader;
var FilesInput = BABYLON.FilesInput;

export { DefaultLoadingScreen,SceneLoaderProgressEvent,SceneLoader,FilesInput };