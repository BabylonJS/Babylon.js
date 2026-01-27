/* eslint-disable github/no-then */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import type { GlobalState } from "../globalState";

import { Engine } from "core/Engines/engine";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { SceneLoader } from "core/Loading/sceneLoader";
import { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import { Scene } from "core/scene";
import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { EnvironmentTools } from "../tools/environmentTools";
import { Tools } from "core/Misc/tools";
import { FilesInput } from "core/Misc/filesInput";
import { Animation } from "core/Animations/animation";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";

import "core/Helpers/sceneHelpers";

import "../scss/renderingZone.scss";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { Texture } from "core/Materials/Textures/texture";
import type { ITextureCreationOptions } from "core/Materials/Textures/texture";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { setOpenGLOrientationForUV, useOpenGLOrientationForUV } from "core/Compat/compatibilityOptions";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";

function GetFileExtension(str: string): string {
    return str.split(".").pop() || "";
}

function IsTextureAsset(extension: string): boolean {
    switch (extension.toLowerCase()) {
        case "ktx":
        case "ktx2":
        case "png":
        case "jpg":
        case "jpeg":
        case "webp": {
            return true;
        }
    }

    return false;
}

interface IRenderingZoneProps {
    globalState: GlobalState;
    expanded: boolean;
    onEngineCreated?: (engine: AbstractEngine) => void;
}

/**
 * RenderingZone component
 */
export class RenderingZone extends React.Component<IRenderingZoneProps> {
    private _currentPluginName?: string;
    private _engine: AbstractEngine;
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _restoreInspector = false;

    public constructor(props: IRenderingZoneProps) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    async initEngine() {
        const useWebGPU = location.href.indexOf("webgpu") !== -1 && !!(navigator as any).gpu;
        const antialias = true;

        this._canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
        if (useWebGPU) {
            this._engine = new WebGPUEngine(this._canvas, {
                enableAllFeatures: true,
                setMaximumLimits: true,
                antialias,
                useHighPrecisionMatrix: true,
            });
            await (this._engine as WebGPUEngine).initAsync();
        } else {
            this._engine = new Engine(this._canvas, antialias, {
                useHighPrecisionMatrix: true,
                premultipliedAlpha: false,
                preserveDrawingBuffer: true,
                antialias: antialias,
            });
        }

        this.props.onEngineCreated && this.props.onEngineCreated(this._engine);

        this._engine.loadingUIBackgroundColor = "#2A2342";

        // Resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

        this.loadAsset();

        // File inputs
        const filesInput = new FilesInput(
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
                    if (this.props.globalState.isDebugLayerEnabled) {
                        this.props.globalState.hideDebugLayer();
                        this._restoreInspector = true;
                    }
                }
            },
            () => {
                // Ensure we stop any existing render loop when reloading, because if there was a previous scene loaded from the URL
                // the filesInput will not know about it, and so it won't call stopRenderLoop.
                this._engine.stopRenderLoop();
                filesInput.reload();
            },
            (file, scene, message) => {
                this.props.globalState.onError.notifyObservers({ message: message });
            },
            false,
            true
        );

        filesInput.onProcessFileCallback = (file, name, extension, setSceneFileToLoad) => {
            if (filesInput.filesToLoad && filesInput.filesToLoad.length === 1 && extension) {
                switch (extension.toLowerCase()) {
                    case "dds":
                    case "env":
                    case "exr":
                    case "hdr": {
                        FilesInput.FilesToLoad[name] = file;
                        EnvironmentTools.SkyboxPath = "file:" + (file as any).correctName;
                        EnvironmentTools.ResetEnvironmentTexture();
                        return false;
                    }
                    default: {
                        if (IsTextureAsset(extension)) {
                            setSceneFileToLoad(file);
                        }

                        break;
                    }
                }
            }

            return true;
        };

        filesInput.loadAsync = async (sceneFile, onProgress) => {
            const filesToLoad = filesInput.filesToLoad;
            if (filesToLoad.length === 1) {
                const fileName = (filesToLoad[0] as any).correctName as string;
                const fileExtension = GetFileExtension(fileName);
                if (IsTextureAsset(fileExtension)) {
                    return await Promise.resolve(this.loadTextureAsset(`file:${fileName}`));
                }
            }

            this._engine.clearInternalTexturesCache();

            return await SceneLoader.LoadAsync("file:", sceneFile, this._engine, onProgress);
        };

        filesInput.monitorElementForDragNDrop(this._canvas);

        this.props.globalState.filesInput = filesInput;
        this.props.globalState.onFilesInputReady.notifyObservers();

        window.addEventListener("keydown", (event) => {
            // Press R to reload
            if (event.keyCode === 82 && event.target && (event.target as HTMLElement).nodeName !== "INPUT" && this._scene) {
                if (this.props.globalState.assetUrl) {
                    this.loadAssetFromUrl(this.props.globalState.assetUrl);
                } else {
                    filesInput.reload();
                }
            }
        });
    }

    prepareCamera() {
        let camera = this._scene.activeCamera as ArcRotateCamera;
        // Attach camera to canvas inputs
        if (!camera) {
            this._scene.createDefaultCamera(true);

            camera = this._scene.activeCamera! as ArcRotateCamera;

            if (this._currentPluginName === "gltf" || this._currentPluginName === "obj") {
                // glTF assets use a +Z forward convention while the default camera faces +Z. Rotate the camera to look at the front of the asset.
                // We do this same for obj as it matches other viewers, but obj does not specify a forward convention.
                camera.alpha += Math.PI;
            }

            // Enable camera's behaviors
            camera.useFramingBehavior = true;

            const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior;
            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            if (this._scene.meshes.length) {
                camera.lowerRadiusLimit = null;

                const worldExtends = this._scene.getWorldExtends(function (mesh) {
                    return mesh.isVisible && mesh.isEnabled();
                });
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
            }

            if (this.props.globalState.autoRotate) {
                camera.useAutoRotationBehavior = true;
            }

            camera.pinchPrecision = 200 / camera.radius;
            camera.upperRadiusLimit = 5 * camera.radius;

            camera.wheelDeltaPercentage = 0.01;
            camera.pinchDeltaPercentage = 0.01;

            if (this.props.globalState.cameraPosition) {
                camera.lowerRadiusLimit = null;
                camera.setPosition(this.props.globalState.cameraPosition);
                camera.lowerRadiusLimit = camera.radius;
            }
        }

        camera.attachControl();
        return camera;
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
            const camera = this._scene.activeCamera! as ArcRotateCamera;
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
            let pbrPresent = false;
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
        this._scene.skipFrustumClipping = true;

        if (this.props.globalState.toneMapping !== undefined) {
            this._scene.imageProcessingConfiguration.toneMappingEnabled = true;
            this._scene.imageProcessingConfiguration.toneMappingType = this.props.globalState.toneMapping;
        } else if (this.props.globalState.commerceMode) {
            this._scene.imageProcessingConfiguration.toneMappingEnabled = true;
            this._scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;
        }

        this.props.globalState.onSceneLoaded.notifyObservers({ scene: this._scene, filename: filename });

        const camera = this.prepareCamera();
        this.prepareLighting();
        this.handleErrors();

        if (this._restoreInspector) {
            this._restoreInspector = false;
            this.props.globalState.showDebugLayer();
        }

        this._scene.executeWhenReady(() => {
            this._engine.runRenderLoop(() => {
                // NOTE: this logic to adjust camera parameters based on radius is copied in viewer.ts.
                // Please keep them in sync.
                // Adapt the camera sensibility based on the distance to the object
                camera.panningSensibility = 5000 / camera.radius;
                // Update the camera speed based on the camera's distance from the target.
                // TODO: This makes mouse wheel zooming behave well, but makes mouse based rotation a bit worse.
                camera.speed = camera.radius * 0.2;
                this._scene.render();
            });
        });

        delete this._currentPluginName;
    }

    loadTextureAsset(url: string): Scene {
        const scene = new Scene(this._engine);

        const prevousUseOpenGLOrientationForUV = useOpenGLOrientationForUV;
        setOpenGLOrientationForUV(true);
        const plane = CreatePlane("plane", { size: 1 }, scene);
        setOpenGLOrientationForUV(prevousUseOpenGLOrientationForUV);

        const options: ITextureCreationOptions = {
            invertY: false,
            samplingMode: Texture.NEAREST_LINEAR,
            onLoad: () => {
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
            },
            onError: (message, exception) => {
                this.props.globalState.onError.notifyObservers({ scene: scene, message: message || exception.message || "Failed to load texture" });
            },
        };

        const texture = new Texture(url, scene, options);
        const material = new PBRMaterial("unlit", scene);
        material.unlit = true;
        material.albedoTexture = texture;
        material.alphaMode = PBRMaterial.PBRMATERIAL_ALPHABLEND;
        plane.material = material;

        return scene;
    }

    loadAssetFromUrl(assetUrl: string) {
        const rootUrl = Tools.GetFolderPath(assetUrl);
        const fileName = Tools.GetFilename(assetUrl);
        const fileExtension = GetFileExtension(fileName);

        this._engine.clearInternalTexturesCache();

        const promise = IsTextureAsset(fileExtension) ? Promise.resolve(this.loadTextureAsset(assetUrl)) : SceneLoader.LoadAsync(rootUrl, fileName, this._engine);

        promise
            .then((scene) => {
                if (this._scene) {
                    this._scene.dispose();
                }

                this._scene = scene;

                this.onSceneLoaded(fileName);
            })
            .catch((reason) => {
                this.props.globalState.onError.notifyObservers({ message: reason.message });
            });
    }

    loadAsset() {
        if (this.props.globalState.assetUrl) {
            this.loadAssetFromUrl(this.props.globalState.assetUrl);
            return;
        }
    }

    override componentDidMount() {
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
                const loader = plugin as GLTFFileLoader;
                loader.transparencyAsCoverage = this.props.globalState.commerceMode;

                loader.validate = true;

                loader.onExtensionLoadedObservable.add((extension: import("loaders/glTF/index").IGLTFLoaderExtension) => {
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

    override shouldComponentUpdate(nextProps: IRenderingZoneProps) {
        if (nextProps.expanded !== this.props.expanded) {
            setTimeout(() => this._engine.resize());
            return true;
        }
        return false;
    }

    public override render() {
        return (
            <div id="canvasZone" className={this.props.expanded ? "expanded" : ""}>
                <canvas id="renderCanvas" touch-action="none" onContextMenu={(evt) => evt.preventDefault()}></canvas>
            </div>
        );
    }
}
