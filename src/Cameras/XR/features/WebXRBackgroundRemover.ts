import { WebXRFeaturesManager, WebXRFeature } from "../webXRFeaturesManager";
import { WebXRSessionManager } from '../webXRSessionManager';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Observable } from '../../../Misc/observable';

const Name = "xr-background-remover";
//register the plugin
WebXRFeaturesManager.AddWebXRFeature(Name, (xrSessionManager, options) => {
    return () => new WebXRBackgroundRemover(xrSessionManager, options);
});

export interface WebXRBackgroundRemoverOptions {
    ignoreEnvironmentHelper?: boolean;
    environmentHelperRemovalFlags?: {
        skyBox?: boolean;
        ground?: boolean;
    };
    backgroundMeshes?: AbstractMesh[];
}

export class WebXRBackgroundRemover implements WebXRFeature {

    public onBackgroundStateChanged: Observable<boolean> = new Observable();

    constructor(private xrSessionManager: WebXRSessionManager, public readonly options: WebXRBackgroundRemoverOptions = {}) {

    }

    attach(): boolean {
        this.setBackgroundState(false);

        return true;
    }

    detach(): boolean {
        this.setBackgroundState(true);

        return true;
    }

    private setBackgroundState(newState: boolean) {
        const scene = this.xrSessionManager.scene;
        if (!this.options.ignoreEnvironmentHelper) {
            if (this.options.environmentHelperRemovalFlags) {
                if (this.options.environmentHelperRemovalFlags.skyBox) {
                    const backgroundSkybox = scene.getMeshByName("BackgroundSkybox");
                    if (backgroundSkybox) {
                        backgroundSkybox.setEnabled(newState);
                    }
                }
                if (this.options.environmentHelperRemovalFlags.ground) {
                    const backgroundPlane = scene.getMeshByName("BackgroundPlane");
                    if (backgroundPlane) {
                        backgroundPlane.setEnabled(newState);
                    }
                }
            } else {
                const backgroundHelper = scene.getMeshByName("BackgroundHelper");
                if (backgroundHelper) {
                    backgroundHelper.setEnabled(newState);
                }
            }
        }

        if (this.options.backgroundMeshes) {
            this.options.backgroundMeshes.forEach((mesh) => mesh.setEnabled(newState));
        }

        this.onBackgroundStateChanged.notifyObservers(newState);
    }
    dispose(): void {
        this.onBackgroundStateChanged.clear();
    }
}
