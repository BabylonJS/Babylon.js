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
import { TransformNode } from "core/Meshes/transformNode";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color3 } from "core/Maths/math.color";
import "core/Rendering/depthRendererSceneComponent";
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";

export class PreviewManager {
    private _nodeGeometry: NodeGeometry;
    private _onBuildObserver: Nullable<Observer<NodeGeometry>>;

    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeGeometryBlock>>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _onLightUpdatedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _mesh: Nullable<AbstractMesh>;
    private _camera: ArcRotateCamera;
    private _globalState: GlobalState;
    private _lightParent: TransformNode;

    private _serializeGeometry(): any {
        const nodeGeometry = this._nodeGeometry; 
        const serializationObject = nodeGeometry.serialize();

        return serializationObject;
    }

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeGeometry = globalState.nodeGeometry;
        this._globalState = globalState;

        this._onBuildObserver = this._nodeGeometry.onBuildObservable.add(() => {
            this._refreshPreviewMesh();
        });

        this._onLightUpdatedObserver = globalState.onLightUpdated.add(() => {
            this._prepareLights();
        });

        this._onUpdateRequiredObserver = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            this._refreshPreviewMesh();
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
        this._camera.minZ = 0.1;
        this._camera.attachControl(false);

        this._lightParent = new TransformNode("LightParent", this._scene);

        this._refreshPreviewMesh();

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });

        let lastOffsetX: number | undefined = undefined;
        const lightRotationSpeed = 0.01;

        this._scene.onPointerObservable.add((evt) => {
            if (this._globalState.controlCamera) {
                return;
            }

            if (evt.type === PointerEventTypes.POINTERUP) {
                lastOffsetX = undefined;
                return;
            }

            if (evt.event.buttons !== 1) {
                return;
            }

            if (lastOffsetX === undefined) {
                lastOffsetX = evt.event.offsetX;
            }

            const rotateLighting = (lastOffsetX - evt.event.offsetX) * lightRotationSpeed;
            this._lightParent.rotation.y += rotateLighting;
            lastOffsetX = evt.event.offsetX;
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

    private _prepareLights() {
        // Remove current lights
        const currentLights = this._scene.lights.slice(0);

        for (const light of currentLights) {
            light.dispose();
        }

        // Create new lights based on settings
        if (this._globalState.hemisphericLight) {
            new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        }
    }

    private _prepareScene() {
        this._camera.useFramingBehavior = true;

        this._prepareLights();

        const framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;

        setTimeout(() => {
            // Let the behavior activate first
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
        });

        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;

        // Update
        this._updatePreview();

        // Animations
        this._handleAnimations();
    }

    private _refreshPreviewMesh() {
        if (this._mesh) {
            this._mesh.dispose();
        }

        const lights = this._scene.lights.slice(0);
        for (const light of lights) {
            light.dispose();
        }

        this._engine.releaseEffects();

        SceneLoader.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        this._prepareScene();
    }

    private _updatePreview() {
        try {
            const serializationObject = this._serializeGeometry();

            const nodeGeometry = NodeGeometry.Parse(serializationObject);
            this._mesh = nodeGeometry.createMesh("temp", this._scene);
            nodeGeometry.dispose();

            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._nodeGeometry.onBuildObservable.remove(this._onBuildObserver);        
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);
        this._globalState.onLightUpdated.remove(this._onLightUpdatedObserver);
        
        if (this._nodeGeometry) {
            this._nodeGeometry.dispose();
        }

        if (this._mesh) {
            this._mesh.dispose(false, true);
        }

        this._camera.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
