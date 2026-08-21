import { type Camera, type FilesInput, type IDisposable, type Nullable, type Scene, type Vector3 } from "core/index";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Observable } from "core/Misc/observable";
import { CameraPresetManager } from "./tools/cameraPresetManager";
import { TryMakeCameraPresetInspectorServiceDefinition } from "./tools/cameraPresetInspectorService";

export type InspectorV2Module = typeof import("inspector/legacy/legacy") & typeof import("inspector/index");
export type SandboxSceneLoadKind = "scene" | "texture";
export type SandboxSceneLoadedInfo = { scene: Scene; filename: string; loadKind: SandboxSceneLoadKind };
export type SandboxCameraUrlNumericOverrides = { minZ: number; lowerRadiusLimit?: number } | { minZ?: number; lowerRadiusLimit: number };

export class GlobalState {
    private _inspectorToken: Nullable<IDisposable> = null;
    private _cameraUrlNumericOverrides: { minZ?: number; lowerRadiusLimit?: number } = {};
    private _suppressCameraPresetForNextModelLoad = false;

    public currentScene: Scene;
    public currentSceneLoadKind: SandboxSceneLoadKind = "scene";
    public currentSceneHadCameras = false;
    public onSceneLoaded = new Observable<SandboxSceneLoadedInfo>();
    public onCameraChanged = new Observable<Camera>();
    public onError = new Observable<{ scene?: Scene; message?: string }>();
    public onEnvironmentChanged = new Observable<string>();
    public onRequestClickInterceptor = new Observable<void>();
    public onClickInterceptorClicked = new Observable<void>();
    public glTFLoaderExtensions: { [key: string]: import("loaders/glTF/index").IGLTFLoaderExtension } = {};
    public onFilesInputReady = new Observable<void>();

    public filesInput: FilesInput;
    public isDebugLayerEnabled = false;
    public readonly cameraPresetManager = new CameraPresetManager(undefined, undefined, (message, scene) => {
        this.onError.notifyObservers({ scene, message });
    });

    public commerceMode = false;

    public assetUrl?: string;
    public autoRotate = false;
    public cameraPosition?: Vector3;
    public skybox = true;
    public toneMapping?: number;

    public reflector?: {
        hostname: string;
        port: number;
    };

    public get version(): string {
        return this._versionInfo.version;
    }

    constructor(private readonly _versionInfo: { version: string; bundles: string[] }) {}

    public setCameraUrlNumericOverrides(overrides: SandboxCameraUrlNumericOverrides): void {
        this._cameraUrlNumericOverrides = { ...this._cameraUrlNumericOverrides, ...overrides };
    }

    public suppressCameraPresetForNextModelLoad(): void {
        this._suppressCameraPresetForNextModelLoad = true;
    }

    private _consumeCameraPresetSuppression(): boolean {
        const suppressCameraPreset = this._suppressCameraPresetForNextModelLoad;
        this._suppressCameraPresetForNextModelLoad = false;
        return suppressCameraPreset;
    }

    public applyCameraConfigurationForLoad(scene: Scene, loadKind: SandboxSceneLoadKind): Camera | null {
        if (loadKind !== "scene") {
            return null;
        }

        const presetCamera = this._consumeCameraPresetSuppression() ? null : this.cameraPresetManager.applyActivePreset(scene);
        const activeCamera = scene.activeCamera;
        if (activeCamera) {
            if (this._cameraUrlNumericOverrides.minZ !== undefined) {
                activeCamera.minZ = this._cameraUrlNumericOverrides.minZ;
            }
            if (this._cameraUrlNumericOverrides.lowerRadiusLimit !== undefined && activeCamera instanceof ArcRotateCamera) {
                activeCamera.lowerRadiusLimit = this._cameraUrlNumericOverrides.lowerRadiusLimit;
            }
        }

        return presetCamera;
    }

    public showDebugLayer() {
        if (!this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = true;
            if (this.currentScene) {
                const inspectorV2Module = (globalThis as typeof globalThis & { INSPECTOR?: Partial<InspectorV2Module> }).INSPECTOR;
                if (typeof inspectorV2Module?.ShowInspector === "function") {
                    const cameraPresetServiceDefinition = TryMakeCameraPresetInspectorServiceDefinition(this.cameraPresetManager, inspectorV2Module);
                    this._inspectorToken = cameraPresetServiceDefinition
                        ? inspectorV2Module.ShowInspector(this.currentScene, { serviceDefinitions: [cameraPresetServiceDefinition] })
                        : inspectorV2Module.ShowInspector(this.currentScene);
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.currentScene.debugLayer.show();
                }
            }
        }
    }

    public hideDebugLayer() {
        if (this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = false;
            if (this.currentScene) {
                if (this._inspectorToken) {
                    this._inspectorToken.dispose();
                    this._inspectorToken = null;
                } else {
                    this.currentScene.debugLayer.hide();
                }
            }
        }
    }
}
