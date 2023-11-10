import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Animation } from "core/Animations/animation";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { Color3 } from "core/Maths/math.color";
import "core/Rendering/depthRendererSceneComponent";
import type { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { PreviewMode } from "./previewMode";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { DataStorage } from "core/Misc/dataStorage";
import type { TransformNode } from "core/Meshes/transformNode";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import type { GLTFData } from "serializers/glTF/2.0/glTFData";

export class PreviewManager {
    private _nodeGeometry: NodeGeometry;
    private _onBuildObserver: Nullable<Observer<NodeGeometry>>;

    private _onFrameObserver: Nullable<Observer<void>>;
    private _onExportToGLBObserver: Nullable<Observer<void>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeGeometryBlock>>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _onPreviewChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _mesh: Nullable<AbstractMesh>;
    private _camera: ArcRotateCamera;
    private _light: HemisphericLight;
    private _globalState: GlobalState;
    private _matTexture: StandardMaterial;
    private _matCap: StandardMaterial;
    private _matStd: MultiMaterial;
    private _matNME: NodeMaterial;
    private _matVertexColor: StandardMaterial;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeGeometry = globalState.nodeGeometry;
        this._globalState = globalState;

        this._onExportToGLBObserver = this._globalState.onExportToGLBRequired.add(() => {
            if (!this._mesh) {
                return;
            }
            const currentMat = this._mesh.material;
            this._mesh.material = this._matStd;
            GLTF2Export.GLBAsync(this._scene, "node-geometry-scene").then((glb: GLTFData) => {
                this._mesh!.material = currentMat;
                glb.downloadFiles();
            });
        });

        this._onFrameObserver = this._globalState.onFrame.add(() => {
            this._frameCamera();
        });

        this._onBuildObserver = this._nodeGeometry.onBuildObservable.add(() => {
            this._refreshPreviewMesh(false);
        });
        this._onUpdateRequiredObserver = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            this._refreshPreviewMesh(false);
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;
        });

        this._onAnimationCommandActivatedObserver = globalState.onAnimationCommandActivated.add(() => {
            this._handleAnimations();
        });

        this._onPreviewChangedObserver = globalState.onPreviewModeChanged.add(() => {
            this._setMaterial();
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = this._globalState.backgroundColor;
        this._scene.ambientColor = new Color3(1, 1, 1);
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);

        this._camera.lowerRadiusLimit = 3;
        this._camera.upperRadiusLimit = 10;
        this._camera.wheelPrecision = 20;
        this._camera.minZ = 0.001;
        this._camera.attachControl(false);
        this._camera.useFramingBehavior = true;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;

        this._matCap = new StandardMaterial("MatCap", this._scene);
        this._matCap.disableLighting = true;
        this._matCap.backFaceCulling = false;

        const matCapTexture = new Texture("https://assets.babylonjs.com/skyboxes/matcap.jpg", this._scene);
        matCapTexture.coordinatesMode = Texture.SPHERICAL_MODE;
        this._matCap.reflectionTexture = matCapTexture;

        this._matStd = new MultiMaterial("MatStd", this._scene);
        const subMat = new StandardMaterial("ChildStdMat", this._scene);
        subMat.backFaceCulling = false;
        subMat.specularColor = Color3.Black();
        this._matStd.subMaterials.push(subMat);

        this._matTexture = new StandardMaterial("MatTexture", this._scene);
        this._matTexture.backFaceCulling = false;
        this._matTexture.emissiveTexture = new Texture("https://assets.babylonjs.com/textures/amiga.jpg", this._scene);
        this._matTexture.disableLighting = true;

        this._matVertexColor = new StandardMaterial("VertexColor", this._scene);
        this._matVertexColor.disableLighting = true;
        this._matVertexColor.backFaceCulling = false;
        this._matVertexColor.emissiveColor = Color3.White();

        this._light = new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        this._refreshPreviewMesh(true);

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });
    }

    private _updateStandardMaterial() {
        if (!this._mesh) {
            return;
        }

        if (this._mesh.subMeshes.length <= this._matStd.subMaterials.length) {
            return;
        }

        for (let i = this._matStd.subMaterials.length; i < this._mesh.subMeshes.length; i++) {
            const newMat = new StandardMaterial("ChildStdMat", this._scene);
            newMat.backFaceCulling = false;
            newMat.specularColor = Color3.Black();
            newMat.diffuseColor = new Color3(Math.random(), Math.random(), Math.random());

            this._matStd.subMaterials.push(newMat);
        }
    }

    private _handleAnimations() {
        this._scene.stopAllAnimations();

        if (this._globalState.rotatePreview) {
            for (const root of this._scene.rootNodes) {
                const transformNode = root as TransformNode;

                if (transformNode.getClassName() === "TransformNode" || transformNode.getClassName() === "Mesh" || transformNode.getClassName() === "GroundMesh") {
                    if (transformNode.rotationQuaternion) {
                        transformNode.rotation = transformNode.rotationQuaternion.toEulerAngles();
                        transformNode.rotationQuaternion = null;
                    }
                    Animation.CreateAndStartAnimation("turnTable", root, "rotation.y", 60, 1200, transformNode.rotation.y, transformNode.rotation.y + 2 * Math.PI, 1);
                }
            }
        }
    }
    private _frameCamera() {
        const framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;

        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        if (this._scene.meshes.length) {
            const worldExtends = this._scene.getWorldExtends((m) => m.name === "main");
            this._camera.lowerRadiusLimit = null;
            this._camera.upperRadiusLimit = null;
            if (!framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max)) {
                setTimeout(() => {
                    this._frameCamera();
                });
                return;
            }
        }

        this._camera.pinchPrecision = 200 / this._camera.radius;
        this._camera.upperRadiusLimit = 5 * this._camera.radius;
    }

    private _prepareScene() {
        // Update
        const toDelete = this._mesh;
        this._updatePreview();
        toDelete?.dispose();

        // Animations
        this._handleAnimations();
    }

    private _refreshPreviewMesh(first: boolean) {
        SceneLoader.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        this._prepareScene();

        if (first) {
            this._frameCamera();
        }
    }

    private _setMaterial() {
        if (!this._mesh) {
            return;
        }

        const nmeID = DataStorage.ReadString("NMEID", "");

        if (nmeID) {
            if (!this._matNME) {
                this._matNME = new NodeMaterial("nme", this._scene);
                this._matNME.backFaceCulling = false;
            }
            if (this._matNME.snippetId !== nmeID) {
                NodeMaterial.ParseFromSnippetAsync(nmeID, this._scene, "", this._matNME)
                    .then(() => {
                        this._matNME.build();
                    })
                    .catch((err) => {
                        this._globalState.hostDocument.defaultView!.alert("Unable to load your node material: " + err);
                    });
            }
        }

        const useNM = DataStorage.ReadBoolean("UseNM", false) && this._matNME;

        switch (this._globalState.previewMode) {
            case PreviewMode.Normal:
                this._mesh.material = useNM ? this._matNME : this._matStd;
                this._matStd.subMaterials.forEach((m) => (m!.wireframe = false));
                break;
            case PreviewMode.MatCap:
                this._mesh.material = this._matCap;
                break;
            case PreviewMode.Textured:
                this._mesh.material = this._matTexture;
                break;
            case PreviewMode.Wireframe:
                this._mesh.material = useNM ? this._matNME : this._matStd;
                this._matStd.subMaterials.forEach((m) => (m!.wireframe = true));
                break;
            case PreviewMode.VertexColor:
                this._mesh.material = this._matVertexColor;
                break;
        }
    }

    private _updatePreview() {
        try {
            this._mesh = this._nodeGeometry.createMesh("main", this._scene);
            if (this._mesh) {
                this._updateStandardMaterial();
                this._setMaterial();
                this._mesh.useVertexColors = true;
            }

            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._globalState.onFrame.remove(this._onFrameObserver);
        this._nodeGeometry.onBuildObservable.remove(this._onBuildObserver);
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onPreviewModeChanged.remove(this._onPreviewChangedObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);
        this._globalState.onExportToGLBRequired.remove(this._onExportToGLBObserver);

        if (this._nodeGeometry) {
            this._nodeGeometry.dispose();
        }

        if (this._mesh) {
            this._mesh.dispose(false, true);
        }

        this._light.dispose();
        this._camera.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
