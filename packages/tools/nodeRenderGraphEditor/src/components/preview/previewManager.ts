import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IShadowLight } from "core/Lights/shadowLight";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math.vector";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { SceneLoader } from "core/Loading/sceneLoader";
import { TransformNode } from "core/Meshes/transformNode";
import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import { LogEntry } from "../log/logComponent";
import type { NodeRenderGraphGUIBlock } from "gui/2D/FrameGraph/renderGraphGUIBlock";
import { Button } from "gui/2D/controls/button";
import { Control } from "gui/2D/controls/control";
import { PreviewType } from "./previewType";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { FilesInput } from "core/Misc/filesInput";
import { Color3 } from "core/Maths/math.color";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import type { NodeRenderGraphHighlightLayerBlock } from "core/FrameGraph/Node/Blocks/Layers/highlightLayerBlock";
import { BoundingBox } from "core/Culling/boundingBox";
import type { NodeRenderGraphExecuteBlock } from "core/FrameGraph/Node/Blocks/executeBlock";
import type { Mesh } from "core/Meshes";
import type { NodeRenderGraphUtilityLayerRendererBlock } from "core/FrameGraph/Node/Blocks/Rendering/utilityLayerRendererBlock";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { Texture } from "core/Materials/Textures/texture";

const debugTextures = false;
const logErrorTrace = true;

export class PreviewManager {
    private _nodeRenderGraph: NodeRenderGraph;

    private _onFrameObserver: Nullable<Observer<void>>;
    private _onPreviewCommandActivatedObserver: Nullable<Observer<boolean>>;
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeRenderGraphBlock>>>;
    private _onRebuildRequiredObserver: Nullable<Observer<void>>;
    private _onImportFrameObserver: Nullable<Observer<any>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onLightUpdatedObserver: Nullable<Observer<void>>;
    private _engine: Engine | WebGPUEngine;
    private _scene: Scene;
    private _globalState: GlobalState;
    private _currentType: number;
    private _lightParent: TransformNode;
    private _hdrTexture: CubeTexture;
    private _dummyExternalTexture: Texture;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._globalState = globalState;

        this._onFrameObserver = this._globalState.onFrame.add(() => {
            this._frameCamera();
        });

        this._onPreviewCommandActivatedObserver = globalState.stateManager.onPreviewCommandActivated.add((forceRefresh: boolean) => {
            if (forceRefresh) {
                this._currentType = -1;
            }
            this._refreshPreviewMesh();
            this._prepareBackgroundHDR();
        });

        this._onLightUpdatedObserver = globalState.onLightUpdated.add(() => {
            this._prepareLights();
            this._createNodeRenderGraph();
        });

        this._onRebuildRequiredObserver = globalState.stateManager.onRebuildRequiredObservable.add(() => {
            this._createNodeRenderGraph();
        });

        this._onImportFrameObserver = globalState.onImportFrameObservable.add(() => {
            this._createNodeRenderGraph();
        });

        this._onResetRequiredObserver = globalState.onResetRequiredObservable.add(() => {
            this._createNodeRenderGraph();
        });

        this._initAsync(targetCanvas);
    }

    private async _initAsync(targetCanvas: HTMLCanvasElement) {
        if (this._globalState.engine === 1) {
            this._engine = new WebGPUEngine(targetCanvas, {
                enableGPUDebugMarkers: true,
                enableAllFeatures: true,
                setMaximumLimits: true,
            });
            await (this._engine as WebGPUEngine).initAsync();
        } else {
            this._engine = new Engine(targetCanvas, true, { forceSRGBBufferSupportState: true });
            this._engine.getCaps().parallelShaderCompile = undefined;
        }

        const canvas = this._engine.getRenderingCanvas();
        if (canvas) {
            const onDrag = (evt: DragEvent) => {
                evt.stopPropagation();
                evt.preventDefault();
            };
            canvas.addEventListener("dragenter", onDrag, false);
            canvas.addEventListener("dragover", onDrag, false);

            const onDrop = (evt: DragEvent) => {
                evt.stopPropagation();
                evt.preventDefault();
                this._globalState.onDropEventReceivedObservable.notifyObservers(evt);
            };
            canvas.addEventListener("drop", onDrop, false);
        }

        await this._initSceneAsync(new Scene(this._engine));

        this._refreshPreviewMesh();
    }

    private _initSceneAsync(scene: Scene): Promise<void> {
        (window as any).scenePreview = scene;

        this._scene = scene;

        this._dummyExternalTexture?.dispose();
        this._dummyExternalTexture = new Texture("https://assets.babylonjs.com/textures/Checker_albedo.png", this._scene, true);
        this._dummyExternalTexture.name = "Dummy external texture for preview NRGE";

        return new Promise((resolve) => {
            this._dummyExternalTexture.onLoadObservable.add(() => {
                this._prepareBackgroundHDR();

                this._globalState.filesInput?.dispose();
                this._globalState.filesInput = new FilesInput(
                    this._engine,
                    null,
                    async (_, scene) => {
                        this._scene.dispose();
                        await this._initSceneAsync(scene);
                    },
                    null,
                    null,
                    null,
                    null,
                    null,
                    () => {
                        this._reset();
                    },
                    false,
                    true
                );

                this._lightParent = new TransformNode("LightParent", this._scene);

                this._engine.stopRenderLoop();

                this._engine.runRenderLoop(() => {
                    this._engine.resize();
                    if (this._scene.frameGraph) {
                        this._scene.render();
                    }
                });

                this._prepareScene();

                this._createNodeRenderGraph();

                resolve();
            });
        });
    }

    private _reset() {
        this._globalState.envType = PreviewType.Room;
        this._globalState.previewType = PreviewType.Box;
        this._globalState.listOfCustomPreviewFiles = [];
        for (const m of this._scene.meshes) {
            m.dispose();
        }
        this._globalState.onRefreshPreviewMeshControlComponentRequiredObservable.notifyObservers();
        this._refreshPreviewMesh(true);
    }

    private _prepareLights() {
        // Remove current lights
        const currentLights = this._scene.lights.slice(0);

        for (const light of currentLights) {
            light.dispose();
        }

        // Create a dummy light, which will be used for a ShadowLight input in case no directional light is selected in the UI
        const dummyLight = new DirectionalLight("dummy", new Vector3(0, 1, 0), this._scene);
        dummyLight.intensity = 0.0;

        // Create new lights based on settings
        if (this._globalState.hemisphericLight) {
            new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        }

        const worldExtends = this._scene.getWorldExtends();
        const diag = worldExtends.max.subtract(worldExtends.min).length();

        const findLightPosition = (lightDir: Vector3) => {
            const bb = new BoundingBox(worldExtends.min, worldExtends.max);
            return bb.center.add(lightDir.scale(-diag * 0.5));
        };

        if (this._globalState.directionalLight0) {
            const dir0 = new DirectionalLight("Directional light #0", new Vector3(0.841626576496605, -0.2193391004130599, -0.49351298337996535), this._scene);
            dir0.intensity = 0.7;
            dir0.diffuse = new Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);
            dir0.specular = new Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);
            dir0.parent = this._lightParent;
            dir0.shadowMinZ = 0;
            dir0.shadowMaxZ = diag;
            dir0.position = findLightPosition(dir0.direction);
        }

        if (this._globalState.directionalLight1) {
            const dir1 = new DirectionalLight("Directional light #1", new Vector3(-0.9519937437504213, -0.24389315636999764, -0.1849974057546125), this._scene);
            dir1.intensity = 0.7;
            dir1.specular = new Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
            dir1.diffuse = new Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
            dir1.parent = this._lightParent;
            dir1.shadowMinZ = 0;
            dir1.shadowMaxZ = diag;
            dir1.position = findLightPosition(dir1.direction);
        }

        for (const m of this._scene.meshes) {
            m.receiveShadows = true;
        }
    }

    private _createNodeRenderGraph() {
        if (!this._scene) {
            // The initialization is not done yet
            return;
        }

        this._scene.frameGraph = null;

        const serialized = this._globalState.nodeRenderGraph.serialize();
        this._nodeRenderGraph?.dispose();
        this._nodeRenderGraph = NodeRenderGraph.Parse(serialized, this._scene, {
            rebuildGraphOnEngineResize: true,
            autoFillExternalInputs: false,
            debugTextures,
        });

        this._buildGraph();

        (window as any).nrgPreview = this._nodeRenderGraph;
    }

    private _getMesh() {
        for (let i = 0; i < this._scene.meshes.length; ++i) {
            const mesh = this._scene.meshes[i];
            if ((mesh as Mesh)._isMesh && mesh.getTotalVertices() > 0) {
                return mesh as Mesh;
            }
        }
        return null;
    }

    private async _buildGraph() {
        if (!this._scene) {
            // The initialization is not done yet
            return;
        }

        const cameraInfo: { radius: number; alpha: number; beta: number; target: Vector3; position: Vector3 }[] = [];

        for (const camera of this._scene.cameras.slice()) {
            const arcRotateCamera = camera as ArcRotateCamera;

            cameraInfo.push({
                radius: arcRotateCamera.radius,
                alpha: arcRotateCamera.alpha,
                beta: arcRotateCamera.beta,
                target: arcRotateCamera.target.clone(),
                position: arcRotateCamera.position.clone(),
            });
            camera.dispose();
        }
        this._scene.cameras.length = 0;
        this._scene.cameraToUseForPointers = null;

        const dummyLight = this._scene.getLightByName("dummy") as IShadowLight;

        const directionalLights: DirectionalLight[] = [];
        for (const light of this._scene.lights) {
            if (light instanceof DirectionalLight && light.name !== "dummy") {
                directionalLights.push(light);
            }
        }

        let curLightIndex = 0;

        // Set default external inputs
        const allInputs = this._nodeRenderGraph.getInputBlocks();
        for (const input of allInputs) {
            if (!input.isExternal) {
                continue;
            }
            if (!input.isAnAncestorOfType("NodeRenderGraphOutputBlock")) {
                continue;
            }
            if ((input.type & NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer) !== 0) {
                input.value = this._dummyExternalTexture.getInternalTexture();
            } else if (input.isCamera()) {
                const camera = new ArcRotateCamera("PreviewCamera", 0, 0.8, 4, Vector3.Zero(), this._scene);

                camera.lowerRadiusLimit = 3;
                camera.upperRadiusLimit = 10;
                camera.wheelPrecision = 20;
                camera.minZ = 0.001;
                camera.attachControl(false);
                camera.useFramingBehavior = true;
                camera.wheelDeltaPercentage = 0.01;
                camera.pinchDeltaPercentage = 0.01;
                camera.alpha = 0;
                camera.beta = 0.8;

                if (!this._scene.cameraToUseForPointers) {
                    this._scene.cameraToUseForPointers = camera;
                }

                input.value = camera;
            } else if (input.isObjectList()) {
                input.value = { meshes: this._scene.meshes, particleSystems: this._scene.particleSystems };
            } else if (input.isShadowLight()) {
                if (curLightIndex < directionalLights.length) {
                    input.value = directionalLights[curLightIndex++];
                    curLightIndex = curLightIndex % directionalLights.length;
                } else {
                    input.value = dummyLight;
                }
            }
        }

        // Set default node values
        const allBlocks = this._nodeRenderGraph.attachedBlocks;
        for (const block of allBlocks) {
            switch (block.getClassName()) {
                case "NodeRenderGraphExecuteBlock":
                    (block as NodeRenderGraphExecuteBlock).task.func = (_context) => {};
                    break;
                case "NodeRenderGraphHighlightLayerBlock": {
                    const layer = (block as NodeRenderGraphHighlightLayerBlock).task.layer;
                    const mesh = this._getMesh();
                    if (mesh) {
                        layer.addMesh(mesh, new Color3(0, 1, 0), false);
                    }
                    break;
                }
                case "NodeRenderGraphUtilityLayerRendererBlock": {
                    const layer = (block as NodeRenderGraphUtilityLayerRendererBlock).task.layer;
                    const gizmoManager = new GizmoManager(this._scene, undefined, layer, layer);
                    gizmoManager.positionGizmoEnabled = true;
                    gizmoManager.rotationGizmoEnabled = true;
                    gizmoManager.attachableMeshes = this._scene.meshes.filter((m) => m.getTotalVertices() > 0);
                    break;
                }
            }
        }

        this._frameCamera();

        for (let i = 0; i < this._scene.cameras.length; i++) {
            const camera = this._scene.cameras[i] as ArcRotateCamera;
            if (i < cameraInfo.length) {
                camera.alpha = cameraInfo[i].alpha;
                camera.beta = cameraInfo[i].beta;
                camera.radius = cameraInfo[i].radius;
                camera.target = cameraInfo[i].target;
                camera.position = cameraInfo[i].position;
            }
        }

        // Set a default control in GUI blocks
        const guiBlocks = this._nodeRenderGraph.getBlocksByPredicate<NodeRenderGraphGUIBlock>((block) => block.getClassName() === "GUI.NodeRenderGraphGUIBlock");
        let guiIndex = 0;
        for (let i = 0; i < guiBlocks.length; ++i) {
            const block = guiBlocks[i];
            const gui = block.gui;

            if (!block.isAnAncestorOfType("NodeRenderGraphOutputBlock")) {
                return;
            }

            const button = Button.CreateSimpleButton("but" + guiIndex, `GUI #${guiIndex++ + 1} button`);

            const left = i % 4 === 0 || i % 4 === 3;
            const top = i % 4 < 2;

            button.width = "30%";
            button.height = "10%";
            button.color = "white";
            button.fontSize = 20;
            button.background = "green";
            button.horizontalAlignment = left ? Control.HORIZONTAL_ALIGNMENT_LEFT : Control.HORIZONTAL_ALIGNMENT_RIGHT;
            button.verticalAlignment = top ? Control.VERTICAL_ALIGNMENT_TOP : Control.VERTICAL_ALIGNMENT_BOTTOM;
            if (top) {
                button.top = Math.floor(i / 2) * 0.1 * 100 + "%";
            } else {
                button.top = -Math.floor((i - 2) / 2) * 0.1 * 100 + "%";
            }

            gui.addControl(button);
        }

        try {
            this._nodeRenderGraph.build();
            await this._nodeRenderGraph.whenReadyAsync(16, 5000);
            this._scene.frameGraph = this._nodeRenderGraph.frameGraph;
        } catch (err) {
            if (logErrorTrace) {
                (console as any).log(err);
            }
            this._globalState.onLogRequiredObservable.notifyObservers(new LogEntry("From preview manager: " + err, true));
        }
    }

    private _frameCamera() {
        let alpha = 0;

        for (const camera of this._scene.cameras) {
            const arcRotateCamera = camera as ArcRotateCamera;
            const framingBehavior = arcRotateCamera.getBehaviorByName("Framing") as FramingBehavior;

            framingBehavior.framingTime = 0;
            framingBehavior.elevationReturnTime = -1;

            if (this._scene.meshes.length) {
                const worldExtends = this._scene.getWorldExtends();
                arcRotateCamera.lowerRadiusLimit = null;
                arcRotateCamera.upperRadiusLimit = null;
                framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
                arcRotateCamera.maxZ = worldExtends.max.subtract(worldExtends.min).length() * 2;
            }

            arcRotateCamera.pinchPrecision = 200 / arcRotateCamera.radius;
            arcRotateCamera.upperRadiusLimit = 5 * arcRotateCamera.radius;
            arcRotateCamera.alpha = alpha;

            alpha += Math.PI / 2;
        }
    }

    private _prepareBackgroundHDR() {
        this._hdrTexture = null as any;

        let newHDRTexture: Nullable<CubeTexture> = null;

        switch (this._globalState.envType) {
            case PreviewType.Room:
                newHDRTexture = new CubeTexture(PreviewManager.DefaultEnvironmentURL, this._scene);
                break;
            case PreviewType.Custom: {
                const blob = new Blob([this._globalState.envFile], { type: "octet/stream" });
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const dataurl = evt.target!.result as string;
                    newHDRTexture = new CubeTexture(dataurl, this._scene, undefined, false, undefined, undefined, undefined, undefined, undefined, ".env");
                };
                reader.readAsDataURL(blob);
                break;
            }
        }

        if (!newHDRTexture) {
            return;
        }

        this._hdrTexture = newHDRTexture;

        newHDRTexture.onLoadObservable.add(() => {
            if (this._hdrTexture !== newHDRTexture) {
                // The HDR texture has been changed in the meantime, so we don't need this one anymore
                newHDRTexture!.dispose();
            }
        });

        this._hdrTexture = newHDRTexture;
        this._scene.environmentTexture = this._hdrTexture;
    }

    private _prepareScene() {
        this._globalState.onIsLoadingChanged.notifyObservers(false);

        this._prepareLights();

        this._frameCamera();
    }

    public static DefaultEnvironmentURL = "https://assets.babylonjs.com/environments/environmentSpecular.env";

    private _refreshPreviewMesh(force?: boolean) {
        if (this._currentType === this._globalState.previewType && this._currentType !== PreviewType.Custom && !force) {
            return;
        }

        this._currentType = this._globalState.previewType;

        SceneLoader.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        switch (this._globalState.previewType) {
            case PreviewType.Box:
                SceneLoader.LoadAsync("https://assets.babylonjs.com/meshes/", "roundedCube.glb").then((scene) => {
                    this._initSceneAsync(scene);
                });
                return;
            case PreviewType.Sphere:
                SceneLoader.LoadAsync("https://assets.babylonjs.com/meshes/", "previewSphere.glb").then((scene) => {
                    this._initSceneAsync(scene);
                });
                break;
            case PreviewType.Cylinder:
                SceneLoader.LoadAsync("https://assets.babylonjs.com/meshes/", "roundedCylinder.glb").then((scene) => {
                    this._initSceneAsync(scene);
                });
                return;
            case PreviewType.Plane: {
                SceneLoader.LoadAsync("https://assets.babylonjs.com/meshes/", "highPolyPlane.glb").then((scene) => {
                    this._initSceneAsync(scene);
                });
                break;
            }
            case PreviewType.ShaderBall:
                SceneLoader.LoadAsync("https://assets.babylonjs.com/meshes/", "shaderBall.glb").then((scene) => {
                    this._initSceneAsync(scene);
                });
                return;
            case PreviewType.Custom:
                this._globalState.filesInput.loadFiles({ target: { files: this._globalState.listOfCustomPreviewFiles } });
                return;
        }
    }

    public dispose() {
        this._dummyExternalTexture?.dispose();

        this._globalState.onFrame.remove(this._onFrameObserver);
        this._globalState.stateManager.onPreviewCommandActivated.remove(this._onPreviewCommandActivatedObserver);
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.stateManager.onRebuildRequiredObservable.remove(this._onRebuildRequiredObserver);
        this._globalState.onImportFrameObservable.remove(this._onImportFrameObserver);
        this._globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this._globalState.onLightUpdated.remove(this._onLightUpdatedObserver);

        this._nodeRenderGraph?.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
