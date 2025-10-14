import type { Vector3 } from "core/Maths/math.vector";
import type { FilesInput } from "core/Misc/filesInput";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

let InspectorV2ModulePromise: Promise<typeof import("inspector-v2/inspector")> | null = null;
// eslint-disable-next-line @typescript-eslint/promise-function-async
function ImportInspectorV2() {
    if (!InspectorV2ModulePromise) {
        InspectorV2ModulePromise = import("inspector-v2/inspector");
    }
    return InspectorV2ModulePromise;
}

export class GlobalState {
    public currentScene: Scene;
    public onSceneLoaded = new Observable<{ scene: Scene; filename: string }>();
    public onError = new Observable<{ scene?: Scene; message?: string }>();
    public onEnvironmentChanged = new Observable<string>();
    public onRequestClickInterceptor = new Observable<void>();
    public onClickInterceptorClicked = new Observable<void>();
    public glTFLoaderExtensions: { [key: string]: import("loaders/glTF/index").IGLTFLoaderExtension } = {};

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

    constructor(public readonly version: string) {
        this.onSceneLoaded.addOnce(async () => await this.refreshDebugLayerAsync());
    }

    public showDebugLayer() {
        this.isDebugLayerEnabled = true;
        if (this.currentScene) {
            if (this._isInspectorV2ModeRequested && !this._isInspectorV2ModeEnabled) {
                alert("Inspector v2 is only supported with the latest version of Babylon.js at this time. Falling back to Inspector V1.");
            }

            if (!this._isInspectorV2ModeEnabled) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.currentScene.debugLayer.show();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    const inspectorV2Module = await ImportInspectorV2();
                    inspectorV2Module.ShowInspector(this.currentScene);
                })();
            }
        }
    }

    public hideDebugLayer() {
        this.isDebugLayerEnabled = false;
        if (this.currentScene) {
            if (!this._isInspectorV2ModeEnabled) {
                this.currentScene.debugLayer.hide();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    const inspectorV2Module = await ImportInspectorV2();
                    inspectorV2Module.HideInspector();
                })();
            }
        }
    }

    public async refreshDebugLayerAsync() {
        if (this.currentScene) {
            // openedPanes was not available until 7.44.0, so we may need to fallback to the inspector's _OpenedPane property
            const isInspectorV1Enabled = (this.currentScene.debugLayer.openedPanes ?? (this.currentScene.debugLayer as any).BJSINSPECTOR?.Inspector?._OpenedPane) !== 0;
            const isInspectorV2Enabled = InspectorV2ModulePromise && (await InspectorV2ModulePromise).IsInspectorVisible();
            const isInspectorEnabled = isInspectorV1Enabled || isInspectorV2Enabled;

            if (isInspectorEnabled) {
                if (isInspectorV1Enabled && this._isInspectorV2ModeRequested) {
                    if (!this._isInspectorV2ModeEnabled) {
                        alert("Inspector v2 is only supported with the latest version of Babylon.js at this time. Falling back to Inspector V1.");
                    } else {
                        this.currentScene.debugLayer.hide();
                        (await ImportInspectorV2()).ShowInspector(this.currentScene);
                    }
                } else if (isInspectorV2Enabled && !this._isInspectorV2ModeEnabled) {
                    (await ImportInspectorV2()).HideInspector();
                    await this.currentScene.debugLayer.show();
                }
            }
        }
    }

    private get _isInspectorV2ModeEnabled() {
        // Disallow Inspector v2 on specific/older versions. For now, only support the latest as both core and inspector are evolving in tandem.
        // Once we have an Inspector v2 UMD package, we can make this work the same as Inspector v1.)
        if (this.version) {
            return false;
        }

        return this._isInspectorV2ModeRequested;
    }

    private get _isInspectorV2ModeRequested() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false";
    }
}
