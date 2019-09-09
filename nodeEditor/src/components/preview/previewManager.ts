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
import { Animation } from 'babylonjs/Animations/animation';
import { SceneLoader } from 'babylonjs/Loading/sceneLoader';
import { TransformNode } from 'babylonjs/Meshes/transformNode';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { FramingBehavior } from 'babylonjs/Behaviors/Cameras/framingBehavior';

export class PreviewManager {
    private _nodeMaterial: NodeMaterial;
    private _onBuildObserver: Nullable<Observer<NodeMaterial>>;    
    private _onPreviewCommandActivatedObserver: Nullable<Observer<void>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _light: HemisphericLight;
    private _meshes: AbstractMesh[];
    private _camera: ArcRotateCamera;
    private _material: NodeMaterial;
    private _globalState: GlobalState;   
    private _currentType: number; 

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeMaterial = globalState.nodeMaterial;
        this._globalState = globalState;

        this._onBuildObserver = this._nodeMaterial.onBuildObservable.add((nodeMaterial) => {
            let serializationObject = nodeMaterial.serialize();
            this._updatePreview(serializationObject);
        });

        this._onPreviewCommandActivatedObserver = globalState.onPreviewCommandActivated.add(() => {
            this._refreshPreviewMesh();
        });

        this._onUpdateRequiredObserver = globalState.onUpdateRequiredObservable.add(() => {
            let serializationObject = this._nodeMaterial.serialize();
            this._updatePreview(serializationObject);
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;    
        });

        this._onAnimationCommandActivatedObserver = globalState.onAnimationCommandActivated.add(() => {
            this._handleAnimations();
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

    private _handleAnimations() {
        this._scene.stopAllAnimations();
                        
        if (this._globalState.rotatePreview) {
            for (var root of this._scene.rootNodes) {
                let transformNode = root as TransformNode;

                if (transformNode.getClassName() === "TransformNode" || transformNode.getClassName() === "Mesh") {
                    if (transformNode.rotationQuaternion) {
                        transformNode.rotation = transformNode.rotationQuaternion.toEulerAngles();
                        transformNode.rotationQuaternion = null;
                    }
                    Animation.CreateAndStartAnimation("turnTable", root, "rotation.y", 60, 1200, transformNode.rotation.y, transformNode.rotation.y + 2 * Math.PI, 1);
                }
            }
        }
    }

    private _prepareMeshes() {
        // Material
        for (var mesh of this._meshes) {
            mesh.material = this._material;
        }

        // Framing
        this._camera.useFramingBehavior = true;

        var framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        if (this._scene.meshes.length) {
            var worldExtends = this._scene.getWorldExtends();
            this._camera.lowerRadiusLimit = null;
            this._camera.upperRadiusLimit = null;
            framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
        }

        this._camera.pinchPrecision = 200 / this._camera.radius;
        this._camera.upperRadiusLimit = 5 * this._camera.radius;

        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;

        // Animations
        this._handleAnimations();
    }

    private _refreshPreviewMesh() {    

        if (this._currentType !== this._globalState.previewMeshType) {

            this._currentType = this._globalState.previewMeshType;
            if (this._meshes && this._meshes.length) {

                for (var mesh of this._meshes) {
                    mesh.dispose();
                }
            }

            this._meshes = [];
        
            switch (this._globalState.previewMeshType) {
                case PreviewMeshType.Box:
                    this._meshes.push(Mesh.CreateBox("dummy-box", 2, this._scene));
                    break;
                case PreviewMeshType.Sphere:
                    this._meshes.push(Mesh.CreateSphere("dummy-sphere", 32, 2, this._scene));
                    break;
                case PreviewMeshType.Torus:
                    this._meshes.push(Mesh.CreateTorus("dummy-torus", 2, 0.5, 32, this._scene));
                    break;
                case PreviewMeshType.Cylinder:
                    this._meshes.push(Mesh.CreateCylinder("dummy-cylinder", 2, 1, 1.2, 32, 1, this._scene));
                    break;                
                case PreviewMeshType.Plane:
                    this._meshes.push(Mesh.CreateGround("dummy-plane", 2, 2, 128, this._scene));
                    break;         
                case PreviewMeshType.Custom:
                    SceneLoader.AppendAsync("file:", this._globalState.previewMeshFile, this._scene).then(() => {     
                        this._meshes.push(...this._scene.meshes);
                        this._prepareMeshes();
                    });
                    return;     
            }
            
            this._prepareMeshes();
        }
    }

    private _updatePreview(serializationObject: any) {
        let tempMaterial = NodeMaterial.Parse(serializationObject, this._scene);
        try {
            tempMaterial.build();

            if (this._meshes.length) {
                tempMaterial.forceCompilation(this._meshes[0], () => {
                    for (var mesh of this._meshes) {
                        mesh.material = tempMaterial;
                    }
        
                    if (this._material) {
                        this._material.dispose();
                    }      
        
                    this._material = tempMaterial;    
                });
            } else {
                this._material = tempMaterial;    
            }
        } catch(err) {
            // Ignore the error
        }
    }

    public dispose() {
        this._nodeMaterial.onBuildObservable.remove(this._onBuildObserver);
        this._globalState.onPreviewCommandActivated.remove(this._onPreviewCommandActivatedObserver);
        this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);

        if (this._material) {
            this._material.dispose();
        }

        this._camera.dispose();
        for (var mesh of this._meshes) {
            mesh.dispose();
        }
        this._light.dispose();
        this._engine.dispose();
    }
}