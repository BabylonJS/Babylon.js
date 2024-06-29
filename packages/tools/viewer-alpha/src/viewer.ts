import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { AbstractEngine } from "core/Engines";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { SceneLoader } from "core/Loading/sceneLoader";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Color4 } from "core/Maths/math";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import type { AssetContainer } from "core/assetContainer";
import type { IDisposable } from "core/scene";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

import "loaders/glTF/2.0";

import { AsyncLock } from "./asyncLock";

//copy/paste from scene helpers
function createDefaultSkybox(scene: Scene, reflectionTexture: BaseTexture, scale: number, blur: number) {
    const hdrSkybox = CreateBox("hdrSkyBox", { size: scale }, scene);
    const hdrSkyboxMaterial = new PBRMaterial("skyBox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = reflectionTexture;
    if (hdrSkyboxMaterial.reflectionTexture) {
        hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    }
    hdrSkyboxMaterial.microSurface = 1.0 - blur;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkyboxMaterial.twoSidedLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.isPickable = false;
    hdrSkybox.infiniteDistance = true;
    hdrSkybox.ignoreCameraMaxZ = true;

    return hdrSkybox;
}

export const defaultViewerOptions = {
    backgroundColor: new Color4(0.1, 0.1, 0.2, 1.0),
} as const;

export type ViewerOptions = Partial<
    typeof defaultViewerOptions &
        Readonly<{
            onInitialized: (details: { scene: Scene; camera: ArcRotateCamera }) => void;
        }>
>;

export class Viewer implements IDisposable {
    private readonly _scene: Scene;
    private readonly _camera: ArcRotateCamera;

    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _assetContainer: Nullable<AssetContainer> = null;
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _environment: Nullable<IDisposable> = null;
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    public constructor(
        private readonly _engine: AbstractEngine,
        options?: ViewerOptions
    ) {
        const finalOptions = { ...defaultViewerOptions, ...options };
        this._scene = new Scene(this._engine);
        this._scene.clearColor = finalOptions.backgroundColor;
        this._camera = new ArcRotateCamera("camera1", 0, 0, 1, Vector3.Zero(), this._scene);
        this._camera.attachControl();
        this._reframeCamera(); // set default camera values

        // render at least back ground. Maybe we can only run renderloop when a mesh is loaded. What to render until then?
        this._engine.runRenderLoop(() => {
            this._scene.render();
        });

        options?.onInitialized?.({ scene: this._scene, camera: this._camera });
    }

    public async loadModelAsync(url: string, abortSignal?: AbortSignal): Promise<void> {
        if (this._isDisposed) {
            throw new Error("Viewer is disposed");
        }

        this._loadModelAbortController?.abort();
        const abortController = (this._loadModelAbortController = new AbortController());

        const throwIfAborted = () => {
            // External cancellation
            abortSignal?.throwIfAborted();

            // Internal cancellation
            abortController.signal.throwIfAborted();
        };

        await this._loadModelLock.lockAsync(async () => {
            throwIfAborted();
            this._assetContainer?.dispose();
            this._assetContainer = await SceneLoader.LoadAssetContainerAsync("", url, this._scene);
            this._assetContainer.addAllToScene();
            this._reframeCamera();
        });
    }

    public async loadEnvironmentAsync(url: Nullable<string | undefined>): Promise<void> {
        if (this._isDisposed) {
            throw new Error("Viewer is disposed");
        }

        this._loadEnvironmentAbortController?.abort();
        const abortController = (this._loadEnvironmentAbortController = new AbortController());

        const throwIfAborted = () => {
            // External cancellation
            abortController.signal.throwIfAborted();

            // Internal cancellation
            abortController.signal.throwIfAborted();
        };

        await this._loadEnvironmentLock.lockAsync(async () => {
            throwIfAborted();
            this._environment?.dispose();
            this._environment = await new Promise<IDisposable>((resolve, reject) => {
                if (!url) {
                    const light = new HemisphericLight("hemilight", Vector3.Up(), this._scene);
                    this._scene.autoClear = true;
                    resolve(light);
                } else {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(url, this._scene);
                    this._scene.environmentTexture = cubeTexture;
                    const skybox = createDefaultSkybox(this._scene, cubeTexture.clone(), (this._camera.maxZ - this._camera.minZ) / 2, 0.3);
                    this._scene.autoClear = false;

                    const successObserver = cubeTexture.onLoadObservable.addOnce(() => {
                        successObserver.remove();
                        errorObserver.remove();
                        resolve({
                            dispose() {
                                cubeTexture.dispose();
                                skybox.dispose();
                            },
                        });
                    });

                    const errorObserver = Texture.OnTextureLoadErrorObservable.add((texture) => {
                        if (texture === cubeTexture) {
                            successObserver.remove();
                            errorObserver.remove();
                            reject(new Error("Failed to load environment texture"));
                        }
                    });
                }
            });
        });
    }

    public dispose(): void {
        this._scene.dispose();
        this._isDisposed = true;
    }

    // copy/paste from sandbox and scene helpers
    private _reframeCamera(): void {
        // Enable camera's behaviors
        this._camera.useFramingBehavior = true;
        const framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        let radius = 1;
        if (this._scene.meshes.length) {
            // get bounds and prepare framing/camera radius from its values
            this._camera.lowerRadiusLimit = null;

            const worldExtends = this._scene.getWorldExtends(function (mesh) {
                return mesh.isVisible && mesh.isEnabled();
            });
            framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);

            const worldSize = worldExtends.max.subtract(worldExtends.min);
            const worldCenter = worldExtends.min.add(worldSize.scale(0.5));

            radius = worldSize.length() * 1.2;

            if (!isFinite(radius)) {
                radius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }

            this._camera.setTarget(worldCenter);
        }
        this._camera.lowerRadiusLimit = radius * 0.01;
        this._camera.wheelPrecision = 100 / radius;
        this._camera.alpha = Math.PI / 2;
        this._camera.beta = Math.PI / 2;
        this._camera.radius = radius;
        this._camera.minZ = radius * 0.01;
        this._camera.maxZ = radius * 1000;
        this._camera.speed = radius * 0.2;
        this._camera.useAutoRotationBehavior = true;
        this._camera.pinchPrecision = 200 / this._camera.radius;
        this._camera.upperRadiusLimit = 5 * this._camera.radius;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;
    }
}
