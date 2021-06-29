import * as React from "react";
import { GlobalState } from "../globalState";

import { Engine } from "babylonjs/Engines/engine";
import { WebGPUEngine } from "babylonjs/Engines/webgpuEngine";
import { SceneLoader } from "babylonjs/Loading/sceneLoader";
import { GLTFFileLoader } from "babylonjs-loaders/glTF/glTFFileLoader";
import { Scene } from "babylonjs/scene";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { ArcRotateCamera } from "babylonjs/Cameras/arcRotateCamera";
import { FramingBehavior } from "babylonjs/Behaviors/Cameras/framingBehavior";
import { EnvironmentTools } from "../tools/environmentTools";
import { Tools } from "babylonjs/Misc/tools";
import { FilesInput } from "babylonjs/Misc/filesInput";
import { Animation } from "babylonjs/Animations/animation";
import { PBRBaseMaterial, PBRMaterial, StringTools, Texture } from "babylonjs";
import { Mesh } from "babylonjs/Meshes/mesh";

require("../scss/renderingZone.scss");

function isTextureAsset(name: string): boolean {
    var queryStringIndex = name.indexOf("?");
    if (queryStringIndex !== -1) {
        name = name.substring(0, queryStringIndex);
    }

    return (
        StringTools.EndsWith(name, ".ktx") ||
        StringTools.EndsWith(name, ".ktx2") ||
        StringTools.EndsWith(name, ".png") ||
        StringTools.EndsWith(name, ".jpg") ||
        StringTools.EndsWith(name, ".jpeg")
    );
}

interface IRenderingZoneProps {
    globalState: GlobalState;
    assetUrl?: string;
    autoRotate?: boolean;
    cameraPosition?: Vector3;
    expanded: boolean;
}

export class RenderingZone extends React.Component<IRenderingZoneProps> {
    private _currentPluginName?: string;
    private _engine: Engine;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;

    public constructor(props: IRenderingZoneProps) {
        super(props);
    }

    async initEngine() {
        let useWebGPU = location.href.indexOf("webgpu") !== -1 && !!navigator.gpu;

        this._canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        if (useWebGPU) {
            this._engine = new WebGPUEngine(this._canvas, {
                deviceDescriptor: {
                    requiredFeatures: [
                        "texture-compression-bc",
                        "timestamp-query",
                        "pipeline-statistics-query",
                        "depth-clamping",
                        "depth24unorm-stencil8",
                        "depth32float-stencil8"
                    ]
            }});
            await (this._engine as WebGPUEngine).initAsync();
        } else {
            this._engine = new Engine(this._canvas, true, { premultipliedAlpha: false, preserveDrawingBuffer: true });
        }

        this._engine.loadingUIBackgroundColor = "#2A2342";

        // Resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        this.loadAsset();

        // File inputs
        let filesInput = new FilesInput(
            this._engine,
            null,
            (sceneFile: File, scene: Scene) => {
                this._scene = scene;
                this.onSceneLoaded(sceneFile.name);
            },
            null,
            null,
            null,
            () => {
                Tools.ClearLogCache();
                if (this._scene) {
                    this.props.globalState.isDebugLayerEnabled = this.props.globalState.currentScene.debugLayer.isVisible();

                    if (this.props.globalState.isDebugLayerEnabled) {
                        this._scene.debugLayer.hide();
                    }
                }
            },
            null,
            (file, scene, message) => {
                this.props.globalState.onError.notifyObservers({ message: message });
            }
        );

        filesInput.onProcessFileCallback = (file, name, extension, setSceneFileToLoad) => {
            if (filesInput.filesToLoad && filesInput.filesToLoad.length === 1 && extension) {
                switch (extension.toLowerCase()) {
                    case "dds":
                    case "env":
                    case "hdr": {
                        FilesInput.FilesToLoad[name] = file;
                        EnvironmentTools.SkyboxPath = "file:" + (file as any).correctName;
                        return false;
                    }
                    default: {
                        if (isTextureAsset(name)) {
                            setSceneFileToLoad(file);
                        }

                        break;
                    }
                }
            }

            return true;
        };

        filesInput.loadAsync = (sceneFile, onProgress) => {
            const filesToLoad = filesInput.filesToLoad;
            if (filesToLoad.length === 1) {
                const fileName = (filesToLoad[0] as any).correctName;
                if (isTextureAsset(fileName)) {
                    return Promise.resolve(this.loadTextureAsset(`file:${fileName}`));
                }
            }

            return SceneLoader.LoadAsync("file:", sceneFile, this._engine, onProgress);
        };

        filesInput.monitorElementForDragNDrop(this._canvas);

        this.props.globalState.filesInput = filesInput;

        window.addEventListener("keydown", (event) => {
            // Press R to reload
            if (event.keyCode === 82 && event.target && (event.target as HTMLElement).nodeName !== "INPUT" && this._scene) {
                if (this.props.assetUrl) {
                    this.loadAssetFromUrl();
                } else {
                    filesInput.reload();
                }
            }
        });
    }

    prepareCamera() {
        // Attach camera to canvas inputs
        if (!this._scene.activeCamera) {
            this._scene.createDefaultCamera(true);

            const camera = this._scene.activeCamera! as ArcRotateCamera;

            if (this._currentPluginName === "gltf") {
                // glTF assets use a +Z forward convention while the default camera faces +Z. Rotate the camera to look at the front of the asset.
                camera.alpha += Math.PI;
            }

            // Enable camera's behaviors
            camera.useFramingBehavior = true;

            var framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            if (this._scene.meshes.length) {
                camera.lowerRadiusLimit = null;

                var worldExtends = this._scene.getWorldExtends(function (mesh) {
                    return mesh.isVisible && mesh.isEnabled();
                });
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
            }

            if (this.props.autoRotate) {
                camera.useAutoRotationBehavior = true;
            }

            if (this.props.cameraPosition) {
                camera.setPosition(this.props.cameraPosition);
            }

            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;

            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;
        }

        this._scene.activeCamera!.attachControl();
    }

    handleErrors() {
        // In case of error during loading, meshes will be empty and clearColor is set to red
        if (this._scene.meshes.length === 0 && this._scene.clearColor.r === 1 && this._scene.clearColor.g === 0 && this._scene.clearColor.b === 0) {
            this._canvas.style.opacity = "0";
            this.props.globalState.onError.notifyObservers({ scene: this._scene, message: "No mesh found in your scene" });
        } else {
            if (Tools.errorsCount > 0) {
                this.props.globalState.onError.notifyObservers({ scene: this._scene, message: "Scene loaded but several errors were found" });
            }
            //    this._canvas.style.opacity = "1";
            let camera = this._scene.activeCamera! as ArcRotateCamera;
            if (camera.keysUp) {
                camera.keysUp.push(90); // Z
                camera.keysUp.push(87); // W
                camera.keysDown.push(83); // S
                camera.keysLeft.push(65); // A
                camera.keysLeft.push(81); // Q
                camera.keysRight.push(69); // E
                camera.keysRight.push(68); // D
            }
        }
    }

    prepareLighting() {
        if (this._currentPluginName === "gltf") {
            if (!this._scene.environmentTexture) {
                this._scene.environmentTexture = EnvironmentTools.LoadSkyboxPathTexture(this._scene);
            }

            if (this._scene.environmentTexture && this.props.globalState.skybox) {
                this._scene.createDefaultSkybox(this._scene.environmentTexture, true, (this._scene.activeCamera!.maxZ - this._scene.activeCamera!.minZ) / 2, 0.3, false);
            }
        } else {
            var pbrPresent = false;
            for (const material of this._scene.materials) {
                if (material instanceof PBRBaseMaterial) {
                    pbrPresent = true;
                    break;
                }
            }

            if (pbrPresent) {
                if (!this._scene.environmentTexture) {
                    this._scene.environmentTexture = EnvironmentTools.LoadSkyboxPathTexture(this._scene);
                }
            } else {
                this._scene.createDefaultLight();
            }
        }
    }

    onSceneLoaded(filename: string) {
        this._engine.clearInternalTexturesCache();

        this._scene.skipFrustumClipping = true;

        this.props.globalState.onSceneLoaded.notifyObservers({ scene: this._scene, filename: filename });

        this.prepareCamera();
        this.prepareLighting();
        this.handleErrors();

        if (this.props.globalState.isDebugLayerEnabled) {
            this.props.globalState.showDebugLayer();
        }

        delete this._currentPluginName;
    }

    loadTextureAsset(url: string): Scene {
        const scene = new Scene(this._engine);
        const plane = Mesh.CreatePlane("plane", 1, scene);

        const texture = new Texture(url, scene, undefined, undefined, Texture.NEAREST_LINEAR, () => {
            const size = texture.getBaseSize();
            if (size.width > size.height) {
                plane.scaling.y = size.height / size.width;
            } else {
                plane.scaling.x = size.width / size.height;
            }

            texture.gammaSpace = true;
            texture.hasAlpha = true;
            texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            texture.wrapV = Texture.CLAMP_ADDRESSMODE;

            scene.debugLayer.show();
            scene.debugLayer.select(texture, "PREVIEW");
        }, (message, exception) => {
            this.props.globalState.onError.notifyObservers({ scene: scene, message: message || exception.message || "Failed to load texture" });
        });

        const material = new PBRMaterial("unlit", scene);
        material.unlit = true;
        material.albedoTexture = texture;
        material.alphaMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
        plane.material = material;

        return scene;
    }

    loadAssetFromUrl() {
        const assetUrl = this.props.assetUrl!;
        const rootUrl = Tools.GetFolderPath(assetUrl);
        const fileName = Tools.GetFilename(assetUrl);

        const promise = isTextureAsset(assetUrl)
            ? Promise.resolve(this.loadTextureAsset(assetUrl))
            : SceneLoader.LoadAsync(rootUrl, fileName, this._engine);

        promise
            .then((scene) => {
                if (this._scene) {
                    this._scene.dispose();
                }

                this._scene = scene;

                this.onSceneLoaded(fileName);

                scene.whenReadyAsync().then(() => {
                    this._engine.runRenderLoop(() => {
                        scene.render();
                    });
                });
            })
            .catch((reason) => {
                this.props.globalState.onError.notifyObservers({ message: reason.message });
            });
    }

    loadAsset() {
        if (this.props.assetUrl) {
            this.loadAssetFromUrl();
            return;
        }
    }

    componentDidMount() {
        if (!Engine.isSupported()) {
            return;
        }

        Engine.ShadersRepository = "/src/Shaders/";

        // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
        Animation.AllowMatricesInterpolation = true;

        // Setting up some GLTF values
        GLTFFileLoader.IncrementalLoading = false;
        this.props.globalState.glTFLoaderExtensions = {};
        SceneLoader.OnPluginActivatedObservable.add((plugin) => {
            this._currentPluginName = plugin.name;
            if (this._currentPluginName === "gltf") {
                let loader = plugin as GLTFFileLoader;

                loader.validate = true;

                loader.onExtensionLoadedObservable.add((extension: import("babylonjs-loaders/glTF/index").IGLTFLoaderExtension) => {       
                    this.props.globalState.glTFLoaderExtensions[extension.name] = extension;
                });

                loader.onValidatedObservable.add((results) => {
                    if (results.issues.numErrors > 0) {
                        this.props.globalState.showDebugLayer();
                    }
                });
            }
        });

        this.initEngine();
    }

    shouldComponentUpdate(nextProps: IRenderingZoneProps) {
        if (nextProps.expanded !== this.props.expanded) {
            setTimeout(() => this._engine.resize());
            return true;
        }
        return false;
    }

    public render() {
        return (
            <div id="canvasZone" className={this.props.expanded ? "expanded" : ""}>
                <canvas id="renderCanvas" touch-action="none" onContextMenu={(evt) => evt.preventDefault()}></canvas>
            </div>
        );
    }
}
