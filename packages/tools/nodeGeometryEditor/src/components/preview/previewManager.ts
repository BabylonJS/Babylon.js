import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { SceneLoader } from "core/Loading/sceneLoader";
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
import { TransformNode } from "core/Meshes/transformNode";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { GLTF2Export } from "serializers/glTF/2.0/glTFSerializer";
import type { GLTFData } from "serializers/glTF/2.0/glTFData";
import { Animation } from "core/Animations/animation";
import { AxesViewer } from "core/Debug/axesViewer";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { NormalMaterial } from "materials/normal/normalMaterial";
import type { Mesh } from "core/Meshes/mesh";

export class PreviewManager {
    private _nodeGeometry: NodeGeometry;
    private _onBuildObserver: Nullable<Observer<NodeGeometry>>;

    private _onFrameObserver: Nullable<Observer<void>>;
    private _onAxisObserver: Nullable<Observer<void>>;
    private _onExportToGLBObserver: Nullable<Observer<void>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeGeometryBlock>>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _onPreviewChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _mesh: Nullable<Mesh>;
    private _camera: ArcRotateCamera;
    private _light: HemisphericLight;
    private _globalState: GlobalState;
    private _matTexture: StandardMaterial;
    private _matCap: StandardMaterial;
    private _matStd: MultiMaterial;
    private _matNME: NodeMaterial;
    private _matVertexColor: StandardMaterial;
    private _matNormals: NormalMaterial;
    private _axis: AxesViewer;
    private _toDelete: Array<Mesh> = [];

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeGeometry = globalState.nodeGeometry;
        this._globalState = globalState;

        this._onExportToGLBObserver = this._globalState.onExportToGLBRequired.add(() => {
            if (!this._mesh) {
                return;
            }
            const currentMat = this._mesh.material;
            this._mesh.material = this._matStd;
            GLTF2Export.GLBAsync(this._scene, "node-geometry-scene", {
                shouldExportNode: (node) => {
                    return !node.doNotSerialize;
                },
            }).then((glb: GLTFData) => {
                this._mesh!.material = currentMat;
                glb.downloadFiles();
            });
        });

        let axisTopRight = true;

        this._onAxisObserver = this._globalState.onAxis.add(() => {
            axisTopRight = !axisTopRight;
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

        this._camera.doNotSerialize = true;
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

        this._matNormals = new NormalMaterial("normalMaterial", this._scene);
        this._matNormals.disableLighting = true;
        this._matNormals.backFaceCulling = false;

        this._light = new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        this._refreshPreviewMesh(true);

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });

        // Axis
        const generateTextPlane = function (text: string, color: string, size: number, scene: Scene, parent: TransformNode) {
            const dynamicTexture = new DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 14, 35, "bold 40px Arial", color, "transparent", true);
            const plane = MeshBuilder.CreatePlane("TextPlane", { size: size }, scene);
            const material = new StandardMaterial("TextPlaneMaterial", scene);
            material.backFaceCulling = false;
            material.disableLighting = true;
            material.emissiveTexture = dynamicTexture;
            material.diffuseTexture = dynamicTexture;

            plane.material = material;
            plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
            plane.renderingGroupId = 2;
            plane.setParent(parent);

            return plane;
        };

        this._axis = new AxesViewer(this._scene, 1, 2, undefined, undefined, undefined, 3);
        const dummy = new TransformNode("Dummy", this._scene);
        dummy.doNotSerialize = true;
        this._axis.xAxis.setParent(dummy);
        this._axis.xAxis.doNotSerialize = true;
        this._axis.yAxis.setParent(dummy);
        this._axis.yAxis.doNotSerialize = true;
        this._axis.zAxis.setParent(dummy);
        this._axis.zAxis.doNotSerialize = true;

        (this._axis.xAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);
        (this._axis.yAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);
        (this._axis.zAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);

        const xPlane = generateTextPlane("x", "red", 0.5, this._scene, dummy);
        xPlane.position.x = 1;
        xPlane.position.y = 0.3;

        const yPlane = generateTextPlane("y", "#0F0", 0.5, this._scene, dummy);
        yPlane.position.y = 1.55;

        const zPlane = generateTextPlane("z", "blue", 0.5, this._scene, dummy);
        zPlane.position.z = 1;
        zPlane.position.y = 0.3;

        let targetPosition = new Vector3(3.5, 3.6, 13);
        const tempMat = Matrix.Identity();

        this._scene.onBeforeCameraRenderObservable.add(() => {
            if (axisTopRight) {
                targetPosition = new Vector3(3.5, 3.6, 13);
            } else {
                targetPosition = new Vector3(0, 0, 10);
            }
            this._scene.getViewMatrix().invertToRef(tempMat);
            Vector3.TransformCoordinatesToRef(targetPosition, tempMat, dummy.position);
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
        if (this._mesh) {
            this._toDelete.push(this._mesh);
        }
        this._updatePreview();

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
                for (const m of this._matStd.subMaterials) {
                    m!.wireframe = false;
                }
                break;
            case PreviewMode.MatCap:
                this._mesh.material = this._matCap;
                break;
            case PreviewMode.Textured:
                this._mesh.material = this._matTexture;
                break;
            case PreviewMode.Wireframe:
                this._mesh.material = useNM ? this._matNME : this._matStd;
                for (const m of this._matStd.subMaterials) {
                    m!.wireframe = true;
                }
                break;
            case PreviewMode.VertexColor:
                this._mesh.material = this._matVertexColor;
                break;
            case PreviewMode.Normals:
                this._mesh.material = this._matNormals;
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
                this._mesh.onMeshReadyObservable.addOnce(() => {
                    for (const m of this._toDelete) {
                        m.dispose();
                    }
                    this._toDelete.length = 0;
                });
            }

            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._globalState.onFrame.remove(this._onFrameObserver);
        this._onAxisObserver?.remove();
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
