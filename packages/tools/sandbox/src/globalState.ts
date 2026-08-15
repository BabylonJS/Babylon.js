import { type Camera, type FilesInput, type IDisposable, type Nullable, type Scene, type Vector3 } from "core/index";
import { Observable } from "core/Misc/observable";
import { CameraPresetManager } from "./tools/cameraPresetManager";
import { MakeCameraPresetInspectorServiceDefinition } from "./tools/cameraPresetInspectorService";

export type InspectorV2Module = typeof import("inspector/legacy/legacy") & typeof import("inspector/index");
export type SandboxSceneLoadKind = "scene" | "texture";
export type SandboxSceneLoadedInfo = { scene: Scene; filename: string; loadKind: SandboxSceneLoadKind };

export class GlobalState {
    private _inspectorToken: Nullable<IDisposable> = null;

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
    public cameraPresetOverrideFromUrl = false;
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

    public showDebugLayer() {
        if (!this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = true;
            if (this.currentScene) {
                const inspectorV2Module: InspectorV2Module | undefined = (<any>globalThis).INSPECTOR;
                if (inspectorV2Module?.ShowInspector) {
                    this._inspectorToken = inspectorV2Module.ShowInspector(this.currentScene, {
                        serviceDefinitions: [MakeCameraPresetInspectorServiceDefinition(this, inspectorV2Module)],
                    });
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
