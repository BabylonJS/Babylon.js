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
import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { Color3 } from "core/Maths/math.color";
import "core/Rendering/depthRendererSceneComponent";
import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Texture } from "core/Materials/Textures/texture";
import type { TransformNode } from "core/Meshes/transformNode";
import { MultiMaterial } from "core/Materials/multiMaterial";

export class PreviewManager {
    private _nodeRenderGraph: NodeRenderGraph;
    private _onBuildObserver: Nullable<Observer<NodeRenderGraph>>;

    private _onFrameObserver: Nullable<Observer<void>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeRenderGraphBlock>>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: ArcRotateCamera;
    private _light: HemisphericLight;
    private _globalState: GlobalState;
    private _matTexture: StandardMaterial;
    private _matCap: StandardMaterial;
    private _matStd: MultiMaterial;
    private _matVertexColor: StandardMaterial;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeRenderGraph = globalState.nodeRenderGraph;
        this._globalState = globalState;

        this._onFrameObserver = this._globalState.onFrame.add(() => {
            this._frameCamera();
        });

        this._onBuildObserver = this._nodeRenderGraph.onBuildObservable.add(() => {
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

    private _updatePreview() {
        try {
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._globalState.onFrame.remove(this._onFrameObserver);
        this._nodeRenderGraph.onBuildObservable.remove(this._onBuildObserver);
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);

        if (this._nodeRenderGraph) {
            this._nodeRenderGraph.dispose();
        }

        this._light.dispose();
        this._camera.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
