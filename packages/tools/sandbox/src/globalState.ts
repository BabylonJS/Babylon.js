import type { Vector3 } from "core/Maths/math.vector";
import type { FilesInput } from "core/Misc/filesInput";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

// Preload (asynchronously) the inspector v2 module, but don't block rendering.
const InspectorV2ModulePromise = import("inspector-v2/inspector");

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

    public showDebugLayer() {
        this.isDebugLayerEnabled = true;
        if (this.currentScene) {
            if (!this._isInspectorV2ModeEnabled) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.currentScene.debugLayer.show();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    const inspectorV2Module = await InspectorV2ModulePromise;
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
                    const inspectorV2Module = await InspectorV2ModulePromise;
                    inspectorV2Module.HideInspector();
                })();
            }
        }
    }

    public async refreshDebugLayerAsync() {
        const inspectorV2Module = await InspectorV2ModulePromise;

        const isInspectorV1Enabled = this.currentScene.debugLayer.openedPanes !== 0;
        const isInspectorV2Enabled = inspectorV2Module.IsInspectorVisible();
        const isInspectorEnabled = isInspectorV1Enabled || isInspectorV2Enabled;

        if (isInspectorEnabled) {
            if (isInspectorV1Enabled && this._isInspectorV2ModeEnabled) {
                this.currentScene.debugLayer.hide();
                inspectorV2Module.ShowInspector(this.currentScene);
            } else if (isInspectorV2Enabled && !this._isInspectorV2ModeEnabled) {
                inspectorV2Module.HideInspector();
                await this.currentScene.debugLayer.show();
            }
        }
    }

    private get _isInspectorV2ModeEnabled() {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false";
    }
}
