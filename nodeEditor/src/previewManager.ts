import { GlobalState } from './globalState';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { HemisphericLight } from 'babylonjs/Lights/hemisphericLight';
import { ArcRotateCamera } from 'babylonjs/Cameras/arcRotateCamera';

export class PreviewManager {
    private _nodeMaterial: NodeMaterial;
    private _onBuildObserver: Nullable<Observer<NodeMaterial>>;
    private _engine: Engine;
    private _scene: Scene;
    private _light: HemisphericLight;
    private _dummySphere: Mesh;
    private _camera: ArcRotateCamera;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeMaterial = globalState.nodeMaterial;

        this._onBuildObserver = this._nodeMaterial.onBuildObservable.add(() => {
            this._updatePreview();
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);
        this._light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);

        this._dummySphere = Mesh.CreateSphere("sphere", 32, 2, this._scene);

       // this._camera.attachControl(targetCanvas, false);

        this._engine.runRenderLoop(() => {
            this._scene.render();
        })
    }

    private _updatePreview() {
        
    }

    public dispose() {
        this._nodeMaterial.onBuildObservable.remove(this._onBuildObserver);

        this._camera.dispose();
        this._dummySphere.dispose();
        this._light.dispose();
        this._engine.dispose();
    }
}