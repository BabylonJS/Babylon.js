import { GlobalState } from '../../globalState';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { HemisphericLight } from 'babylonjs/Lights/hemisphericLight';
import { ArcRotateCamera } from 'babylonjs/Cameras/arcRotateCamera';
import { PreviewMeshType } from './previewMeshType';

export class PreviewManager {
    private _nodeMaterial: NodeMaterial;
    private _onBuildObserver: Nullable<Observer<NodeMaterial>>;    
    private _onPreviewMeshTypeChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _light: HemisphericLight;
    private _dummy: Mesh;
    private _camera: ArcRotateCamera;
    private _material: NodeMaterial;
    private _globalState: GlobalState;    

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeMaterial = globalState.nodeMaterial;
        this._globalState = globalState;

        this._onBuildObserver = this._nodeMaterial.onBuildObservable.add((nodeMaterial) => {
            let serializationObject = nodeMaterial.serialize();
            this._updatePreview(serializationObject);
        });

        this._onPreviewMeshTypeChangedObserver = globalState.onPreviewMeshTypeChanged.add(() => {
            this._refreshPreviewMesh();
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);
        this._light = new HemisphericLight("light", new Vector3(0, 1, 0), this._scene);


        this._camera.lowerRadiusLimit = 3;
        this._camera.upperRadiusLimit = 10;
        this._camera.wheelPrecision = 20;
        this._camera.attachControl(targetCanvas, false);

        this._refreshPreviewMesh();

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });

        let serializationObject = this._nodeMaterial.serialize();
        this._updatePreview(serializationObject);
    }

    private _refreshPreviewMesh() {    
        if (this._dummy) {
            this._dummy.dispose();
        }
        
        switch (this._globalState.previewMeshType) {
            case PreviewMeshType.Box:
                this._dummy = Mesh.CreateBox("dummy", 2, this._scene);
                break;
            case PreviewMeshType.Sphere:
                this._dummy = Mesh.CreateSphere("dummy", 32, 2, this._scene);
                break;
            case PreviewMeshType.Torus:
                this._dummy = Mesh.CreateTorus("dummy", 2, 0.5, 32, this._scene);
                break;
                case PreviewMeshType.Cylinder:
                this._dummy = Mesh.CreateCylinder("dummy", 2, 1, 1.2, 32, 1, this._scene);
                break;                
        }
        this._dummy.material = this._material;
    }

    private _updatePreview(serializationObject: any) {
        if (this._material) {
            this._material.dispose();
        }        

        this._material = NodeMaterial.Parse(serializationObject, this._scene);
        this._material.build(true);
        this._dummy.material = this._material;
    }

    public dispose() {
        this._nodeMaterial.onBuildObservable.remove(this._onBuildObserver);
        this._globalState.onPreviewMeshTypeChanged.remove(this._onPreviewMeshTypeChangedObserver);

        if (this._material) {
            this._material.dispose();
        }

        this._camera.dispose();
        this._dummy.dispose();
        this._light.dispose();
        this._engine.dispose();
    }
}