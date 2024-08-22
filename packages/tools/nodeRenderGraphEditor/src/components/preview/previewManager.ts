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
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import type { TransformNode } from "core/Meshes/transformNode";
import { PassPostProcess } from "core/PostProcesses/passPostProcess";
import { Constants } from "core/Engines/constants";
import type { Mesh } from "core/Meshes/mesh";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { LogEntry } from "../log/logComponent";

export class PreviewManager {
    private _nodeRenderGraph: NodeRenderGraph;

    private _onFrameObserver: Nullable<Observer<void>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeRenderGraphBlock>>>;
    private _onRebuildRequiredObserver: Nullable<Observer<void>>;
    private _onImportFrameObserver: Nullable<Observer<any>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _meshes: AbstractMesh[];
    private _camera: ArcRotateCamera;
    private _light: HemisphericLight;
    private _globalState: GlobalState;
    private _passPostProcess: PassPostProcess;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._globalState = globalState;

        this._onFrameObserver = this._globalState.onFrame.add(() => {
            this._frameCamera();
        });

        this._onUpdateRequiredObserver = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            this._createNodeRenderGraph();
            this._buildGraph();
        });

        this._onRebuildRequiredObserver = globalState.stateManager.onRebuildRequiredObservable.add(() => {
            this._createNodeRenderGraph();
            this._buildGraph();
        });

        this._onImportFrameObserver = globalState.onImportFrameObservable.add(() => {
            this._createNodeRenderGraph();
            this._buildGraph();
        });

        this._onResetRequiredObserver = globalState.onResetRequiredObservable.add(() => {
            this._createNodeRenderGraph();
            this._buildGraph();
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;
        });

        this._onAnimationCommandActivatedObserver = globalState.onAnimationCommandActivated.add(() => {
            this._handleAnimations();
        });

        this._engine = new Engine(targetCanvas, true, { forceSRGBBufferSupportState: true });
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

        this._light = new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        this._refreshPreviewMesh();

        this._passPostProcess = new PassPostProcess("pass", 1, this._camera, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, undefined, undefined, Constants.TEXTURETYPE_HALF_FLOAT);
        this._passPostProcess.samples = 4;
        this._passPostProcess.resize(this._engine.getRenderWidth(), this._engine.getRenderHeight(), this._camera);

        this._createNodeRenderGraph();
        this._buildGraph();

        this._scene.onAfterRenderObservable.add(() => {
            this._nodeRenderGraph?.execute();
        });

        this._passPostProcess.onSizeChangedObservable.add(() => {
            this._buildGraph();
        });

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });
    }

    private _createNodeRenderGraph() {
        const serialized = this._globalState.nodeRenderGraph.serialize();
        this._nodeRenderGraph?.dispose();
        this._nodeRenderGraph = NodeRenderGraph.Parse(serialized, this._engine, {
            rebuildGraphOnEngineResize: false,
            scene: this._scene,
        });
        (window as any).nrg = this._nodeRenderGraph;
    }

    private _buildGraph() {
        const allInputs = this._nodeRenderGraph.getInputBlocks();
        for (const input of allInputs) {
            if (!input.isExternal) {
                continue;
            }
            if (input.isAnyTexture()) {
                input.value = this._passPostProcess.inputTexture;
            }
        }
        try {
            this._nodeRenderGraph.build();
        } catch (err) {
            this._globalState.onLogRequiredObservable.notifyObservers(new LogEntry("From preview manager: " + err, true));
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
            const worldExtends = this._scene.getWorldExtends();
            this._camera.lowerRadiusLimit = null;
            this._camera.upperRadiusLimit = null;
            framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
        }

        this._camera.pinchPrecision = 200 / this._camera.radius;
        this._camera.upperRadiusLimit = 5 * this._camera.radius;
    }

    private _prepareScene() {
        this._globalState.onIsLoadingChanged.notifyObservers(false);

        // Animations
        this._handleAnimations();

        this._frameCamera();
    }

    private _refreshPreviewMesh() {
        SceneLoader.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        if (this._meshes && this._meshes.length) {
            for (const mesh of this._meshes) {
                mesh.dispose();
            }
        }
        this._meshes = [];

        const bakeTransformation = (mesh: Mesh) => {
            mesh.bakeCurrentTransformIntoVertices();
            mesh.refreshBoundingInfo();
            mesh.parent = null;
        };

        SceneLoader.AppendAsync("https://assets.babylonjs.com/meshes/", "previewSphere.glb", this._scene).then(() => {
            bakeTransformation(this._scene.getMeshByName("__root__")!.getChildMeshes(true)[0] as Mesh);
            this._meshes.push(...this._scene.meshes);
            this._prepareScene();
        });
    }

    public dispose() {
        this._globalState.onFrame.remove(this._onFrameObserver);
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.stateManager.onRebuildRequiredObservable.remove(this._onRebuildRequiredObserver);
        this._globalState.onImportFrameObservable.remove(this._onImportFrameObserver);
        this._globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);

        this._nodeRenderGraph?.dispose();

        this._light.dispose();
        this._camera.dispose();
        for (const mesh of this._meshes) {
            mesh.dispose();
        }

        this._scene.dispose();
        this._engine.dispose();
    }
}
