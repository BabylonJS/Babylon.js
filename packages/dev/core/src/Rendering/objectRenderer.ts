import type {
    Nullable,
    Immutable,
    Camera,
    Scene,
    AbstractMesh,
    SubMesh,
    Material,
    IParticleSystem,
    InstancedMesh,
    BoundingBox,
    BoundingBoxRenderer,
    UniformBuffer,
    AbstractEngine,
    ClusteredLightContainer,
} from "core/index";
import { Observable } from "../Misc/observable";
import { RenderingManager } from "../Rendering/renderingManager";
import { Constants } from "../Engines/constants";
import { _ObserveArray } from "../Misc/arrayTools";
import { _RetryWithInterval } from "../Misc/timingTools";
import { Logger } from "../Misc/logger";
import { SmartArray } from "../Misc/smartArray";
import { LightConstants } from "../Lights/lightConstants";

/**
 * Defines the options of the object renderer
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface ObjectRendererOptions {
    /** The number of passes the renderer will support (1 by default) */
    numPasses?: number;

    /** True (default) to not change the aspect ratio of the scene in the RTT */
    doNotChangeAspectRatio?: boolean;

    /** True to enable clustered lights (default: false) */
    enableClusteredLights?: boolean;
}

/**
 * A class that renders objects to the currently bound render target.
 * This class only renders objects, and is not concerned with the output texture or post-processing.
 */
export class ObjectRenderer {
    /**
     * Objects will only be rendered once which can be useful to improve performance if everything in your render is static for instance.
     */
    public static readonly REFRESHRATE_RENDER_ONCE: number = 0;
    /**
     * Objects will be rendered every frame and is recommended for dynamic contents.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYFRAME: number = 1;
    /**
     * Objects will be rendered every 2 frames which could be enough if your dynamic objects are not
     * the central point of your effect and can save a lot of performances.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number = 2;

    /**
     * Use this predicate to dynamically define the list of mesh you want to render.
     * If set, the renderList property will be overwritten.
     */
    public renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;

    private _renderList: Nullable<Array<AbstractMesh>>;
    private _unObserveRenderList: Nullable<() => void> = null;

    /**
     * Use this list to define the list of mesh you want to render.
     */
    public get renderList(): Nullable<Array<AbstractMesh>> {
        return this._renderList;
    }

    public set renderList(value: Nullable<Array<AbstractMesh>>) {
        if (this._renderList === value) {
            return;
        }
        if (this._unObserveRenderList) {
            this._unObserveRenderList();
            this._unObserveRenderList = null;
        }

        if (value) {
            this._unObserveRenderList = _ObserveArray(value, this._renderListHasChanged);
        }

        this._renderList = value;
    }

    private _renderListHasChanged = (_functionName: string, previousLength: number) => {
        const newLength = this._renderList ? this._renderList.length : 0;
        if ((previousLength === 0 && newLength > 0) || newLength === 0) {
            for (const mesh of this._scene.meshes) {
                mesh._markSubMeshesAsLightDirty();
            }
        }
    };

    /**
     * Define the list of particle systems to render. If not provided, will render all the particle systems of the scene.
     * Note that the particle systems are rendered only if renderParticles is set to true.
     */
    public particleSystemList: Nullable<Array<IParticleSystem>> = null;

    /**
     * Use this function to overload the renderList array at rendering time.
     * Return null to render with the current renderList, else return the list of meshes to use for rendering.
     * For 2DArray, layerOrFace is the index of the layer that is going to be rendered, else it is the faceIndex of
     * the cube (if the RTT is a cube, else layerOrFace=0).
     * The renderList passed to the function is the current render list (the one that will be used if the function returns null).
     * The length of this list is passed through renderListLength: don't use renderList.length directly because the array can
     * hold dummy elements!
     */
    public getCustomRenderList: Nullable<(layerOrFace: number, renderList: Nullable<Immutable<Array<AbstractMesh>>>, renderListLength: number) => Nullable<Array<AbstractMesh>>> =
        null;

    /**
     * Define if particles should be rendered.
     */
    public renderParticles = true;

    /**
     * Define if sprites should be rendered.
     */
    public renderSprites = false;

    /**
     * Force checking the layerMask property even if a custom list of meshes is provided (ie. if renderList is not undefined)
     */
    public forceLayerMaskCheck = false;

    /**
     * Enables the rendering of bounding boxes for meshes (still subject to Mesh.showBoundingBox or scene.forceShowBoundingBoxes). Default is false.
     */
    public enableBoundingBoxRendering = false;

    /**
     * Enables the rendering of outline/overlay for meshes (still subject to Mesh.renderOutline/Mesh.renderOverlay). Default is true.
     */
    public enableOutlineRendering = true;

    /**
     * Define the camera used to render the objects.
     */
    public activeCamera: Nullable<Camera>;

    /**
     * Define the camera used to calculate the LOD of the objects.
     * If not defined, activeCamera will be used. If not defined nor activeCamera, scene's active camera will be used.
     */
    public cameraForLOD: Nullable<Camera>;

    private _disableImageProcessing = false;
    /**
     * If true, the object renderer will render all objects without any image processing applied.
     * If false (default value), the renderer will use the current setting of the scene's image processing configuration.
     */
    public get disableImageProcessing() {
        return this._disableImageProcessing;
    }

    public set disableImageProcessing(value: boolean) {
        if (value === this._disableImageProcessing) {
            return;
        }

        this._disableImageProcessing = value;
        this._scene.markAllMaterialsAsDirty(Constants.MATERIAL_ImageProcessingDirtyFlag);
    }

    /**
     * If true, the object renderer will not set the view/projection/transformation matrices for the active camera (default: false).
     * By default, the view/projection/transformation matrices are set from the active camera (either ObjectRenderer.activeCamera or scene.activeCamera).
     * Sets this property to true if you want to define your own transformation matrices (use the onInitRenderingObservable observable
     * to set your own matrices, to be sure they will be correctly taken into account)
     */
    public dontSetTransformationMatrix = false;

    private _disableDepthPrePass = false;
    /**
     * Specifies to disable depth pre-pass if true (default: false)
     */
    public get disableDepthPrePass() {
        return this._disableDepthPrePass;
    }

    public set disableDepthPrePass(value: boolean) {
        this._disableDepthPrePass = value;
        this._renderingManager.disableDepthPrePass = value;
    }

    /**
     * Override the mesh isReady function with your own one.
     */
    public customIsReadyFunction: (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => boolean;

    /**
     * Override the render function with your own one.
     */
    public customRenderFunction: (
        opaqueSubMeshes: SmartArray<SubMesh>,
        alphaTestSubMeshes: SmartArray<SubMesh>,
        transparentSubMeshes: SmartArray<SubMesh>,
        depthOnlySubMeshes: SmartArray<SubMesh>,
        beforeTransparents?: () => void
    ) => void;

    /**
     * An event triggered before rendering the objects
     */
    public readonly onBeforeRenderObservable = new Observable<number>();

    /**
     * An event triggered after rendering the objects
     */
    public readonly onAfterRenderObservable = new Observable<number>();

    /**
     * An event triggered before the rendering group is processed
     */
    public readonly onBeforeRenderingManagerRenderObservable = new Observable<number>();

    /**
     * An event triggered after the rendering group is processed
     */
    public readonly onAfterRenderingManagerRenderObservable = new Observable<number>();

    /**
     * An event triggered when initRender is called
     */
    public readonly onInitRenderingObservable = new Observable<ObjectRenderer>();

    /**
     * An event triggered when finishRender is called
     */
    public readonly onFinishRenderingObservable = new Observable<ObjectRenderer>();

    /**
     * An event triggered when fast path rendering is used
     */
    public readonly onFastPathRenderObservable = new Observable<number>();

    protected _engine: AbstractEngine;
    protected _scene: Scene;
    protected _renderingManager: RenderingManager;
    /** @internal */
    public _waitingRenderList?: string[];
    protected _currentRefreshId = -1;
    protected _refreshRate = 1;
    protected _currentApplyByPostProcessSetting = false;
    protected _activeMeshes = new SmartArray<AbstractMesh>(256);
    protected _activeBoundingBoxes = new SmartArray<BoundingBox>(32);
    protected _useUBO: boolean;
    protected _sceneUBOs: UniformBuffer[]; // It's an array because we may need multiple ubos per frame if the object renderer is used several times in a frame (e.g. for rigged cameras)
    protected _currentSceneUBO: UniformBuffer;
    protected _currentFrameId = -1;
    protected _currentSceneUBOIndex = 0;

    /**
     * The options used by the object renderer
     */
    public options: Required<ObjectRendererOptions>;

    private _name: string;
    /**
     * Friendly name of the object renderer
     */
    public get name() {
        return this._name;
    }

    public set name(value: string) {
        if (this._name === value) {
            return;
        }

        this._name = value;
        if (this._sceneUBOs) {
            for (let i = 0; i < this._sceneUBOs.length; ++i) {
                this._sceneUBOs[i].name = `Scene ubo #${i} for ${this.name}`;
            }
        }

        if (!this._scene) {
            return;
        }

        for (let i = 0; i < this._renderPassIds.length; ++i) {
            const renderPassId = this._renderPassIds[i];
            this._engine._renderPassNames[renderPassId] = `${this._name}#${i}`;
        }
    }

    /**
     * Current render pass id. Note it can change over the rendering as there's a separate id for each face of a cube / each layer of an array layer!
     */
    public renderPassId: number;
    private readonly _renderPassIds: number[];
    /**
     * Gets the render pass ids used by the object renderer.
     */
    public get renderPassIds(): readonly number[] {
        return this._renderPassIds;
    }

    /**
     * Gets the current value of the refreshId counter
     */
    public get currentRefreshId() {
        return this._currentRefreshId;
    }

    /**
     * Gets the array of active meshes
     * @returns an array of AbstractMesh
     */
    public getActiveMeshes(): SmartArray<AbstractMesh> {
        return this._activeMeshes;
    }

    /**
     * Sets a specific material to be used to render a mesh/a list of meshes with this object renderer
     * @param mesh mesh or array of meshes
     * @param material material or array of materials to use for this render pass. If undefined is passed, no specific material will be used but the regular material instead (mesh.material). It's possible to provide an array of materials to use a different material for each rendering pass.
     */
    public setMaterialForRendering(mesh: AbstractMesh | AbstractMesh[], material?: Material | Material[]): void {
        let meshes;
        if (!Array.isArray(mesh)) {
            meshes = [mesh];
        } else {
            meshes = mesh;
        }
        for (let j = 0; j < meshes.length; ++j) {
            for (let i = 0; i < this.options.numPasses; ++i) {
                let mesh = meshes[j];
                if (meshes[j].isAnInstance) {
                    mesh = (meshes[j] as InstancedMesh).sourceMesh;
                }
                mesh.setMaterialForRenderPass(this._renderPassIds[i], material !== undefined ? (Array.isArray(material) ? material[i] : material) : undefined);
            }
        }
    }

    /** @internal */
    public _isFrozen = false;

    /** @internal */
    public _freezeActiveMeshesCancel: Nullable<() => void> = null;

    /** @internal */
    public _freezeActiveMeshes(freezeMeshes: boolean) {
        this._freezeActiveMeshesCancel = _RetryWithInterval(
            () => {
                return this._checkReadiness();
            },
            () => {
                this._freezeActiveMeshesCancel = null;
                if (freezeMeshes) {
                    for (let index = 0; index < this._activeMeshes.length; index++) {
                        this._activeMeshes.data[index]._freeze();
                    }
                }
                this._prepareRenderingManager(0, true);
                this._isFrozen = true;
            },
            (err, isTimeout) => {
                this._freezeActiveMeshesCancel = null;
                if (!isTimeout) {
                    Logger.Error("ObjectRenderer: An unexpected error occurred while waiting for the renderer to be ready.");
                    if (err) {
                        Logger.Error(err);
                        if (err.stack) {
                            Logger.Error(err.stack);
                        }
                    }
                } else {
                    Logger.Error(`ObjectRenderer: Timeout while waiting for the renderer to be ready.`);
                    if (err) {
                        Logger.Error(err);
                    }
                }
            }
        );
    }

    /** @internal */
    public _unfreezeActiveMeshes() {
        this._freezeActiveMeshesCancel?.();
        this._freezeActiveMeshesCancel = null;
        for (let index = 0; index < this._activeMeshes.length; index++) {
            this._activeMeshes.data[index]._unFreeze();
        }
        this._isFrozen = false;
    }

    /**
     * Instantiates an object renderer.
     * @param name The friendly name of the object renderer
     * @param scene The scene the renderer belongs to
     * @param options The options used to create the renderer (optional)
     */
    constructor(name: string, scene: Scene, options?: ObjectRendererOptions) {
        this.name = name;
        this._scene = scene;
        this._engine = this._scene.getEngine();
        this._useUBO = this._engine.supportsUniformBuffers;
        if (this._useUBO) {
            this._sceneUBOs = [];
            this._createSceneUBO();
        }

        this.renderList = [] as AbstractMesh[];
        this._renderPassIds = [];

        this.options = {
            numPasses: 1,
            doNotChangeAspectRatio: true,
            enableClusteredLights: false,
            ...options,
        };

        this._createRenderPassId();

        this.renderPassId = this._renderPassIds[0];

        // Rendering groups
        this._renderingManager = new RenderingManager(scene);
        this._renderingManager._useSceneAutoClearSetup = true;

        if (this.options.enableClusteredLights) {
            this.onInitRenderingObservable.add(() => {
                for (const light of this._scene.lights) {
                    if (light.getTypeID() === LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER && (light as ClusteredLightContainer).isSupported) {
                        (light as ClusteredLightContainer)._updateBatches(this.activeCamera).render();
                    }
                }
            });
        }

        this._scene.addObjectRenderer(this);
    }

    private _releaseRenderPassId(): void {
        for (let i = 0; i < this.options.numPasses; ++i) {
            this._engine.releaseRenderPassId(this._renderPassIds[i]);
        }
        this._renderPassIds.length = 0;
    }

    private _createRenderPassId(): void {
        this._releaseRenderPassId();

        for (let i = 0; i < this.options.numPasses; ++i) {
            this._renderPassIds[i] = this._engine.createRenderPassId(`${this.name}#${i}`);
        }
    }

    private _createSceneUBO(): void {
        const index = this._sceneUBOs.length;

        this._sceneUBOs.push(this._scene.createSceneUniformBuffer(`Scene ubo #${index} for ${this.name}`, false));
    }

    private _getSceneUBO(): UniformBuffer {
        if (this._currentFrameId !== this._engine.frameId) {
            this._currentSceneUBOIndex = 0;
            this._currentFrameId = this._engine.frameId;
        }

        if (this._currentSceneUBOIndex >= this._sceneUBOs.length) {
            this._createSceneUBO();
        }

        const ubo = this._sceneUBOs[this._currentSceneUBOIndex++];
        ubo.unbindEffect();

        return ubo;
    }

    /**
     * Resets the refresh counter of the renderer and start back from scratch.
     * Could be useful to re-render if it is setup to render only once.
     */
    public resetRefreshCounter(): void {
        this._currentRefreshId = -1;
    }

    /**
     * Defines the refresh rate of the rendering or the rendering frequency.
     * Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
     */
    public get refreshRate(): number {
        return this._refreshRate;
    }
    public set refreshRate(value: number) {
        this._refreshRate = value;
        this.resetRefreshCounter();
    }

    /**
     * Indicates if the renderer should render the current frame.
     * The output is based on the specified refresh rate.
     * @returns true if the renderer should render the current frame
     */
    public shouldRender(): boolean {
        if (this._currentRefreshId === -1) {
            // At least render once
            this._currentRefreshId = 1;
            return true;
        }

        if (this.refreshRate === this._currentRefreshId) {
            this._currentRefreshId = 1;
            return true;
        }

        this._currentRefreshId++;
        return false;
    }

    /**
     * This function will check if the renderer is ready to render (textures are loaded, shaders are compiled)
     * @param viewportWidth defines the width of the viewport
     * @param viewportHeight defines the height of the viewport
     * @returns true if all required resources are ready
     */
    public isReadyForRendering(viewportWidth: number, viewportHeight: number): boolean {
        this.prepareRenderList();
        this.initRender(viewportWidth, viewportHeight);

        const isReady = this._checkReadiness();

        this.finishRender();

        return isReady;
    }

    /**
     * Makes sure the list of meshes is ready to be rendered
     * You should call this function before "initRender", but if you know the render list is ok, you may call "initRender" directly
     */
    public prepareRenderList(): void {
        const scene = this._scene;

        if (this._waitingRenderList) {
            if (!this.renderListPredicate) {
                this.renderList = [];
                for (let index = 0; index < this._waitingRenderList.length; index++) {
                    const id = this._waitingRenderList[index];
                    const mesh = scene.getMeshById(id);
                    if (mesh) {
                        this.renderList.push(mesh);
                    }
                }
            }
            this._waitingRenderList = undefined;
        }

        // Is predicate defined?
        if (this.renderListPredicate) {
            if (this.renderList) {
                this.renderList.length = 0; // Clear previous renderList
            } else {
                this.renderList = [];
            }

            const sceneMeshes = this._scene.meshes;

            for (let index = 0; index < sceneMeshes.length; index++) {
                const mesh = sceneMeshes[index];
                if (this.renderListPredicate(mesh)) {
                    this.renderList.push(mesh);
                }
            }
        }

        this._currentApplyByPostProcessSetting = this._scene.imageProcessingConfiguration.applyByPostProcess;
        if (this._disableImageProcessing) {
            // we do not use the applyByPostProcess setter to avoid flagging all the materials as "image processing dirty"!
            this._scene.imageProcessingConfiguration._applyByPostProcess = this._disableImageProcessing;
        }
    }

    private _defaultRenderListPrepared: boolean;
    private _currentSceneCamera: Nullable<Camera> = null;

    /**
     * This method makes sure everything is setup before "render" can be called
     * @param viewportWidth Width of the viewport to render to
     * @param viewportHeight Height of the viewport to render to
     */
    public initRender(viewportWidth: number, viewportHeight: number): void {
        const camera: Nullable<Camera> = this.activeCamera ?? this._scene.activeCamera;

        this._currentSceneCamera = this._scene.activeCamera;

        if (this._useUBO) {
            this._currentSceneUBO = this._scene.getSceneUniformBuffer();
            this._currentSceneUBO.unbindEffect();
            this._scene.setSceneUniformBuffer(this._getSceneUBO());
        }

        this.onInitRenderingObservable.notifyObservers(this);

        if (camera) {
            if (!this.dontSetTransformationMatrix) {
                this._scene.setTransformMatrix(camera.getViewMatrix(), camera.getProjectionMatrix(true));
            }
            this._scene.activeCamera = camera;
            this._engine.setViewport(camera.rigParent ? camera.rigParent.viewport : camera.viewport, viewportWidth, viewportHeight);
        }

        if (this._useUBO) {
            this._scene.finalizeSceneUbo();
        }

        this._defaultRenderListPrepared = false;
    }

    /**
     * This method must be called after the "render" call(s), to complete the rendering process.
     */
    public finishRender() {
        const scene = this._scene;

        if (this._useUBO) {
            this._scene.setSceneUniformBuffer(this._currentSceneUBO);
        }

        if (this._disableImageProcessing) {
            scene.imageProcessingConfiguration._applyByPostProcess = this._currentApplyByPostProcessSetting;
        }

        scene.activeCamera = this._currentSceneCamera;
        if (this._currentSceneCamera) {
            if (this.activeCamera && this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(this._currentSceneCamera.getViewMatrix(), this._currentSceneCamera.getProjectionMatrix(true));
            }
            this._engine.setViewport(this._currentSceneCamera.viewport);
        }

        scene.resetCachedMaterial();

        this.onFinishRenderingObservable.notifyObservers(this);
    }

    /**
     * Renders all the objects (meshes, particles systems, sprites) to the currently bound render target texture.
     * @param passIndex defines the pass index to use (default: 0)
     * @param skipOnAfterRenderObservable defines a flag to skip raising the onAfterRenderObservable
     */
    public render(passIndex = 0, skipOnAfterRenderObservable = false): void {
        const currentRenderPassId = this._engine.currentRenderPassId;

        this._engine.currentRenderPassId = this._renderPassIds[passIndex];

        this.onBeforeRenderObservable.notifyObservers(passIndex);

        const fastPath = this._engine.snapshotRendering && this._engine.snapshotRenderingMode === Constants.SNAPSHOTRENDERING_FAST;

        if (!fastPath) {
            const currentRenderList = this._prepareRenderingManager(passIndex);

            // The cast to "any" is to avoid an error in ES6 in case you don't import outlineRenderer
            const outlineRenderer = (this._scene as any).getOutlineRenderer?.();
            const outlineRendererIsEnabled = outlineRenderer?.enabled;

            if (outlineRenderer) {
                outlineRenderer.enabled = this.enableOutlineRendering;
            }

            this.onBeforeRenderingManagerRenderObservable.notifyObservers(passIndex);

            this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

            this.onAfterRenderingManagerRenderObservable.notifyObservers(passIndex);

            if (outlineRenderer) {
                outlineRenderer.enabled = outlineRendererIsEnabled;
            }
        } else {
            this.onFastPathRenderObservable.notifyObservers(passIndex);
        }

        if (!skipOnAfterRenderObservable) {
            this.onAfterRenderObservable.notifyObservers(passIndex);
        }

        this._engine.currentRenderPassId = currentRenderPassId;
    }

    /** @internal */
    public _checkReadiness(): boolean {
        const scene = this._scene;
        const currentRenderPassId = this._engine.currentRenderPassId;

        let returnValue = true;

        if (!scene.getViewMatrix()) {
            // We probably didn't execute scene.render() yet, so make sure we have a view/projection matrix setup for the scene
            scene.updateTransformMatrix();
        }

        const numPasses = this.options.numPasses;
        for (let passIndex = 0; passIndex < numPasses && returnValue; passIndex++) {
            let currentRenderList: Nullable<Array<AbstractMesh>> = null;
            const defaultRenderList = this.renderList ? this.renderList : scene.frameGraph ? scene.meshes : scene.getActiveMeshes().data;
            const defaultRenderListLength = this.renderList ? this.renderList.length : scene.frameGraph ? scene.meshes.length : scene.getActiveMeshes().length;

            this._engine.currentRenderPassId = this._renderPassIds[passIndex];

            this.onBeforeRenderObservable.notifyObservers(passIndex);

            if (this.getCustomRenderList) {
                currentRenderList = this.getCustomRenderList(passIndex, defaultRenderList, defaultRenderListLength);
            }

            if (!currentRenderList) {
                currentRenderList = defaultRenderList;
            }

            if (!this.options.doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }

            for (let i = 0; i < currentRenderList.length && returnValue; ++i) {
                const mesh = currentRenderList[i];

                if (!mesh.isEnabled() || mesh.isBlocked || !mesh.isVisible || !mesh.subMeshes) {
                    continue;
                }

                if (this.customIsReadyFunction) {
                    if (!this.customIsReadyFunction(mesh, this.refreshRate, true)) {
                        returnValue = false;
                        continue;
                    }
                } else if (!mesh.isReady(true)) {
                    returnValue = false;
                    continue;
                }
            }

            this.onAfterRenderObservable.notifyObservers(passIndex);

            if (numPasses > 1) {
                scene.incrementRenderId();
                scene.resetCachedMaterial();
            }
        }

        const particleSystems = this.particleSystemList || scene.particleSystems;
        for (const particleSystem of particleSystems) {
            if (!particleSystem.isReady()) {
                returnValue = false;
            }
        }

        this._engine.currentRenderPassId = currentRenderPassId;

        return returnValue;
    }

    private _prepareRenderingManager(passIndex = 0, winterIsComing = false): Array<AbstractMesh> {
        const scene = this._scene;

        // Get the list of meshes to dispatch to the rendering manager
        let currentRenderList: Nullable<Array<AbstractMesh>> = null;
        let currentRenderListLength = 0;
        let checkLayerMask = false;

        const defaultRenderList = this.renderList ? this.renderList : scene.frameGraph ? scene.meshes : scene.getActiveMeshes().data;
        const defaultRenderListLength = this.renderList ? this.renderList.length : scene.frameGraph ? scene.meshes.length : scene.getActiveMeshes().length;

        if (this.getCustomRenderList) {
            currentRenderList = this.getCustomRenderList(passIndex, defaultRenderList, defaultRenderListLength);
        }

        if (!currentRenderList) {
            // No custom render list provided, we prepare the rendering for the default list, but check
            // first if we did not already performed the preparation (in this frame) before so as to avoid re-doing it several times
            if (this._defaultRenderListPrepared && !winterIsComing) {
                return defaultRenderList;
            }
            this._defaultRenderListPrepared = true;
            currentRenderList = defaultRenderList;
            currentRenderListLength = defaultRenderListLength;
            checkLayerMask = !this.renderList || this.forceLayerMaskCheck;
        } else {
            // Prepare the rendering for the custom render list provided
            currentRenderListLength = currentRenderList.length;
            checkLayerMask = this.forceLayerMaskCheck;
        }

        const camera = scene.activeCamera; // note that at this point, scene.activeCamera == this.activeCamera if defined, because initRender() has been called before
        const cameraForLOD = this.cameraForLOD ?? camera;

        // The cast to "any" is to avoid an error in ES6 in case you don't import boundingBoxRenderer
        const boundingBoxRenderer = (scene as any).getBoundingBoxRenderer?.() as Nullable<BoundingBoxRenderer>;

        if (scene._activeMeshesFrozen && this._isFrozen) {
            this._renderingManager.resetSprites();

            if (this.enableBoundingBoxRendering && boundingBoxRenderer) {
                boundingBoxRenderer.reset();
                for (let i = 0; i < this._activeBoundingBoxes.length; i++) {
                    const boundingBox = this._activeBoundingBoxes.data[i];
                    boundingBoxRenderer.renderList.push(boundingBox);
                }
            }

            return currentRenderList;
        }

        this._renderingManager.reset();
        this._activeMeshes.reset();
        this._activeBoundingBoxes.reset();

        // We do not check option.enableBoundingBoxRendering before resetting the current list of bounding boxes, because:
        // * if bounding box rendering is enabled, we want to start with an empty list and add new bounding boxes to it
        // * if bounding box rendering is disabled, we don't want to render any bounding boxes that may have been generated by previous code
        boundingBoxRenderer && boundingBoxRenderer.reset();

        const sceneRenderId = scene.getRenderId();
        const currentFrameId = scene.getFrameId();
        for (let meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
            const mesh = currentRenderList[meshIndex];

            if (mesh && !mesh.isBlocked) {
                if (this.customIsReadyFunction) {
                    if (!this.customIsReadyFunction(mesh, this.refreshRate, false)) {
                        this.resetRefreshCounter();
                        continue;
                    }
                } else if (!mesh.isReady(this.refreshRate === 0)) {
                    this.resetRefreshCounter();
                    continue;
                }

                let meshToRender: Nullable<AbstractMesh> = null;

                if (cameraForLOD) {
                    const meshToRenderAndFrameId = mesh._internalAbstractMeshDataInfo._currentLOD.get(cameraForLOD);
                    if (!meshToRenderAndFrameId || meshToRenderAndFrameId[1] !== currentFrameId) {
                        meshToRender = scene.customLODSelector ? scene.customLODSelector(mesh, cameraForLOD) : mesh.getLOD(cameraForLOD);
                        if (!meshToRenderAndFrameId) {
                            mesh._internalAbstractMeshDataInfo._currentLOD.set(cameraForLOD, [meshToRender, currentFrameId]);
                        } else {
                            meshToRenderAndFrameId[0] = meshToRender;
                            meshToRenderAndFrameId[1] = currentFrameId;
                        }
                    } else {
                        meshToRender = meshToRenderAndFrameId[0];
                    }
                } else {
                    meshToRender = mesh;
                }

                if (!meshToRender) {
                    continue;
                }

                if (meshToRender !== mesh && meshToRender.billboardMode !== 0) {
                    meshToRender.computeWorldMatrix(); // Compute world matrix if LOD is billboard
                }

                meshToRender._preActivateForIntermediateRendering(sceneRenderId);

                let isMasked;
                if (checkLayerMask && camera) {
                    isMasked = (mesh.layerMask & camera.layerMask) === 0;
                } else {
                    isMasked = false;
                }

                if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && !isMasked) {
                    this._activeMeshes.push(mesh);
                    meshToRender._internalAbstractMeshDataInfo._wasActiveLastFrame = true;

                    if (meshToRender !== mesh) {
                        meshToRender._activate(sceneRenderId, true);
                    }

                    this.enableBoundingBoxRendering && boundingBoxRenderer && boundingBoxRenderer._preActiveMesh(mesh);

                    if (mesh._activate(sceneRenderId, true) && mesh.subMeshes.length) {
                        if (!mesh.isAnInstance) {
                            meshToRender._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = false;
                        } else {
                            if (mesh._internalAbstractMeshDataInfo._actAsRegularMesh) {
                                meshToRender = mesh;
                            }
                        }
                        meshToRender._internalAbstractMeshDataInfo._isActiveIntermediate = true;

                        scene._prepareSkeleton(meshToRender);

                        for (let subIndex = 0; subIndex < meshToRender.subMeshes.length; subIndex++) {
                            const subMesh = meshToRender.subMeshes[subIndex];
                            this.enableBoundingBoxRendering && boundingBoxRenderer && boundingBoxRenderer._evaluateSubMesh(mesh, subMesh);
                            this._renderingManager.dispatch(subMesh, meshToRender);
                        }
                    }

                    mesh._postActivate();
                }
            }
        }

        if (this.enableBoundingBoxRendering && boundingBoxRenderer && winterIsComing) {
            for (let i = 0; i < boundingBoxRenderer.renderList.length; i++) {
                const boundingBox = boundingBoxRenderer.renderList.data[i];
                this._activeBoundingBoxes.push(boundingBox);
            }
        }

        if (this._scene.particlesEnabled) {
            this._scene.onBeforeParticlesRenderingObservable.notifyObservers(this._scene);
            const particleSystems = this.particleSystemList || scene.particleSystems;
            for (let particleIndex = 0; particleIndex < particleSystems.length; particleIndex++) {
                const particleSystem = particleSystems[particleIndex];

                const emitter: any = particleSystem.emitter;

                if (!particleSystem.isStarted() || !emitter || (emitter.position && !emitter.isEnabled())) {
                    continue;
                }

                this._renderingManager.dispatchParticles(particleSystem);
            }
            this._scene.onAfterParticlesRenderingObservable.notifyObservers(this._scene);
        }

        return currentRenderList;
    }

    /**
     * Gets the rendering manager
     */
    public get renderingManager(): RenderingManager {
        return this._renderingManager;
    }

    /**
     * Overrides the default sort function applied in the rendering group to prepare the meshes.
     * This allowed control for front to back rendering or reversely depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    public setRenderingOrder(
        renderingGroupId: number,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null
    ): void {
        this._renderingManager.setRenderingOrder(renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn);
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     * @param depth Automatically clears depth between groups if true and autoClear is true.
     * @param stencil Automatically clears stencil between groups if true and autoClear is true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean, depth = true, stencil = true): void {
        this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil, depth, stencil);
        this._renderingManager._useSceneAutoClearSetup = false;
    }

    /**
     * Clones the renderer.
     * @returns the cloned renderer
     */
    public clone(): ObjectRenderer {
        const newRenderer = new ObjectRenderer(this.name, this._scene, this.options);

        if (this.renderList) {
            newRenderer.renderList = this.renderList.slice(0);
        }

        return newRenderer;
    }

    /**
     * Dispose the renderer and release its associated resources.
     */
    public dispose(): void {
        const renderList = this.renderList ? this.renderList : this._scene.getActiveMeshes().data;
        const renderListLength = this.renderList ? this.renderList.length : this._scene.getActiveMeshes().length;
        for (let i = 0; i < renderListLength; i++) {
            const mesh = renderList[i];
            if (mesh && mesh.getMaterialForRenderPass(this.renderPassId) !== undefined) {
                mesh.setMaterialForRenderPass(this.renderPassId, undefined);
            }
        }

        this.onInitRenderingObservable.clear();
        this.onFinishRenderingObservable.clear();
        this.onBeforeRenderObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onBeforeRenderingManagerRenderObservable.clear();
        this.onAfterRenderingManagerRenderObservable.clear();
        this.onFastPathRenderObservable.clear();

        this._releaseRenderPassId();

        this.renderList = null;
        if (this._sceneUBOs) {
            for (const ubo of this._sceneUBOs) {
                ubo.dispose();
            }
        }
        this._sceneUBOs = undefined as any;

        this._scene.removeObjectRenderer(this);
    }

    /** @internal */
    public _rebuild(): void {
        if (this.refreshRate === ObjectRenderer.REFRESHRATE_RENDER_ONCE) {
            this.refreshRate = ObjectRenderer.REFRESHRATE_RENDER_ONCE;
        }
    }

    /**
     * Clear the info related to rendering groups preventing retention point in material dispose.
     */
    public freeRenderingGroups(): void {
        if (this._renderingManager) {
            this._renderingManager.freeRenderingGroups();
        }
    }
}
