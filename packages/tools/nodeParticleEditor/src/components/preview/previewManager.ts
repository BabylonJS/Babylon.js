import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Color3 } from "core/Maths/math.color";
import { SceneLoaderFlags } from "core/Loading/sceneLoaderFlags";
import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import type { NodeParticleBlock } from "core/Particles";

export class PreviewManager {
    private _nodeParticleSystemSet: NodeParticleSystemSet;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeParticleBlock>>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: ArcRotateCamera;
    private _globalState: GlobalState;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeParticleSystemSet = globalState.nodeParticleSet;
        this._globalState = globalState;

        this._nodeParticleSystemSet.onBuildObservable.add(() => {
            this._refreshPreview();
        });
        this._onUpdateRequiredObserver = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            this._refreshPreview();
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = this._globalState.backgroundColor;
        this._scene.ambientColor = new Color3(1, 1, 1);
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);

        this._camera.doNotSerialize = true;
        this._camera.lowerRadiusLimit = 3;
        this._camera.upperRadiusLimit = 10;
        this._camera.wheelPrecision = 20;
        this._camera.minZ = 0.001;
        this._camera.attachControl(false);
        this._camera.useFramingBehavior = true;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;

        this._refreshPreview();

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });
    }

    private _prepareScene() {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._updatePreviewAsync();
    }

    private _refreshPreview() {
        SceneLoaderFlags.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        this._prepareScene();
    }

    private async _updatePreviewAsync() {
        try {
            await this._nodeParticleSystemSet.buildAsync(this._scene);
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);

        if (this._nodeParticleSystemSet) {
            this._nodeParticleSystemSet.dispose();
        }

        this._camera.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
