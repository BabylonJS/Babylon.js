import type { Vector3 } from "core/Maths/math.vector";
import type { FilesInput } from "core/Misc/filesInput";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

type InspectorV2Module = typeof import("inspector-v2/legacy/legacy") & typeof import("inspector-v2/index");

export class GlobalState {
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

    private readonly _inspectorV2ModulePromise: Promise<InspectorV2Module | undefined>;

    constructor(private readonly _versionInfo: { version: string; bundles: string[] }) {
        this._inspectorV2ModulePromise = new Promise((resolve) => {
            if (!this._isInspectorV2Supported) {
                resolve(undefined);
                return;
            }

            const checkGlobals = () => {
                const inspectorV2Module: InspectorV2Module | undefined = (<any>globalThis).INSPECTOR;
                if (inspectorV2Module?.DetachInspectorGlobals) {
                    inspectorV2Module.DetachInspectorGlobals();
                    resolve(inspectorV2Module);
                } else {
                    setTimeout(checkGlobals, 50);
                }
            };
            checkGlobals();
        });
        this.onSceneLoaded.addOnce(async () => await this.refreshDebugLayerAsync());
    }

    private async _showInspectorV1Async() {
        const inspectorV2Module = await this._inspectorV2ModulePromise;
        inspectorV2Module?.DetachInspectorGlobals();
        await this.currentScene.debugLayer.show();
    }

    private async _showInspectorV2Async() {
        const inspectorV2Module = await this._inspectorV2ModulePromise;
        inspectorV2Module?.AttachInspectorGlobals();
        inspectorV2Module?.Inspector.Show(this.currentScene, {});
    }

    public showDebugLayer() {
        if (!this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = true;
            if (this.currentScene) {
                if (this._isInspectorV2ModeRequested && !this._isInspectorV2ModeEnabled) {
                    alert("Inspector v2 is not supported in this version of Babylon.js. Falling back to Inspector V1.");
                }

                if (!this._isInspectorV2ModeEnabled) {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this._showInspectorV1Async();
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this._showInspectorV2Async();
                }
            }
        }
    }

    public hideDebugLayer() {
        if (this.isDebugLayerEnabled) {
            this.isDebugLayerEnabled = false;
            if (this.currentScene) {
                if (!this._isInspectorV2ModeEnabled) {
                    this.currentScene.debugLayer.hide();
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    (async () => {
                        const inspectorV2Module = await this._inspectorV2ModulePromise;
                        inspectorV2Module?.Inspector.Hide();
                    })();
                }
            }
        }
    }

    public async refreshDebugLayerAsync() {
        if (this.currentScene) {
            // openedPanes was not available until 7.44.0, so we may need to fallback to the inspector's _OpenedPane property
            const isInspectorV1Enabled = (this.currentScene.debugLayer.openedPanes ?? (this.currentScene.debugLayer as any).BJSINSPECTOR?.Inspector?._OpenedPane) !== 0;
            const isInspectorV2Enabled = (await this._inspectorV2ModulePromise)?.Inspector.IsVisible ?? false;
            const isInspectorEnabled = isInspectorV1Enabled || isInspectorV2Enabled;

            if (isInspectorEnabled) {
                if (isInspectorV1Enabled && this._isInspectorV2ModeRequested) {
                    if (!this._isInspectorV2ModeEnabled) {
                        alert("Inspector v2 is not supported in this version of Babylon.js. Falling back to Inspector V1.");
                    } else {
                        this.currentScene.debugLayer.hide();
                        await this._showInspectorV2Async();
                    }
                } else if (isInspectorV2Enabled && !this._isInspectorV2ModeEnabled) {
                    (await this._inspectorV2ModulePromise)?.Inspector.Hide();
                    // Wait two frames for all the React async work to finish. This is ugly,
                    // but we'll remove it when we remove Inspector v1 as Inspector v2 handles
                    // the asynchrony for itself internally.
                    await new Promise((resolve) => setTimeout(resolve));
                    await new Promise((resolve) => setTimeout(resolve));
                    await this._showInspectorV1Async();
                }
            }
        }
    }

    private get _isInspectorV2Supported() {
        return this._versionInfo.bundles.some((bundle) => bundle.includes("inspector-v2"));
    }

    private get _isInspectorV2ModeEnabled() {
        if (!this._isInspectorV2Supported) {
            return false;
        }

        return this._isInspectorV2ModeRequested;
    }

    private get _isInspectorV2ModeRequested() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false";
    }
}
