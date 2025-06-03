// import { ShowInspector, HideInspector } from "@dev/inspector-v2";
import type { Vector3 } from "core/Maths/math.vector";
import type { FilesInput } from "core/Misc/filesInput";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

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

    public readonly useNewUx = new URLSearchParams(window.location.search).has("newux");

    public reflector?: {
        hostname: string;
        port: number;
    };

    public showDebugLayer() {
        this.isDebugLayerEnabled = true;
        if (this.currentScene) {
            if (!this.useNewUx) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.currentScene.debugLayer.show();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    const inspectorV2Module = await import("@dev/inspector-v2");
                    inspectorV2Module.ShowInspector(this.currentScene);
                })();
                // ShowInspector(this.currentScene);
            }
        }
    }

    public hideDebugLayer() {
        this.isDebugLayerEnabled = false;
        if (this.currentScene) {
            if (!this.useNewUx) {
                this.currentScene.debugLayer.hide();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                (async () => {
                    const inspectorV2Module = await import("@dev/inspector-v2");
                    inspectorV2Module.HideInspector();
                })();
                // HideInspector();
            }
        }
    }
}
