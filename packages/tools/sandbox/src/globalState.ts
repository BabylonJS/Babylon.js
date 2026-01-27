import type { FilesInput, IDisposable, Nullable, Scene, Vector3 } from "core/index";
import { Observable } from "core/Misc/observable";

type InspectorV2Module = typeof import("inspector-v2/legacy/legacy") & typeof import("inspector-v2/index");

export class GlobalState {
    private _inspectorToken: Nullable<IDisposable> = null;

    public currentScene: Scene;
    public onSceneLoaded = new Observable<{ scene: Scene; filename: string }>();
    public onError = new Observable<{ scene?: Scene; message?: string }>();
    public onEnvironmentChanged = new Observable<string>();
    public onRequestClickInterceptor = new Observable<void>();
    public onClickInterceptorClicked = new Observable<void>();
    public glTFLoaderExtensions: { [key: string]: import("loaders/glTF/index").IGLTFLoaderExtension } = {};
    public onFilesInputReady = new Observable<void>();

    public filesInput: FilesInput;
    public isDebugLayerEnabled = false;

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

    public showDebugLayer() {
        if (!this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = true;
            if (this.currentScene) {
                const inspectorV2Module: InspectorV2Module | undefined = (<any>globalThis).INSPECTOR;
                if (inspectorV2Module?.ShowInspector) {
                    this._inspectorToken = inspectorV2Module.ShowInspector(this.currentScene);
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
