import { Observer, Observable } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { SmartArray } from "../../Misc/smartArray";
import { Nullable, Immutable } from "../../types";
import { Camera } from "../../Cameras/camera";
import { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { RenderTargetCreationOptions } from "../../Materials/Textures/renderTargetCreationOptions";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { SubMesh } from "../../Meshes/subMesh";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Texture } from "../../Materials/Textures/texture";
import { PostProcessManager } from "../../PostProcesses/postProcessManager";
import { PostProcess } from "../../PostProcesses/postProcess";
import { RenderingManager } from "../../Rendering/renderingManager";
import { Constants } from "../../Engines/constants";

import "../../Engines/Extensions/engine.renderTarget";
import "../../Engines/Extensions/engine.renderTargetCube";
import { InstancedMesh } from '../../Meshes/instancedMesh';
import { Engine } from '../../Engines/engine';

/**
 * This Helps creating a texture that will be created from a camera in your scene.
 * It is basically a dynamic texture that could be used to create special effects for instance.
 * Actually, It is the base of lot of effects in the framework like post process, shadows, effect layers and rendering pipelines...
 */
export class RenderTargetTexture extends Texture {
    /**
     * The texture will only be rendered once which can be useful to improve performance if everything in your render is static for instance.
     */
    public static readonly REFRESHRATE_RENDER_ONCE: number = 0;
    /**
     * The texture will only be rendered rendered every frame and is recomended for dynamic contents.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYFRAME: number = 1;
    /**
     * The texture will be rendered every 2 frames which could be enough if your dynamic objects are not
     * the central point of your effect and can save a lot of performances.
     */
    public static readonly REFRESHRATE_RENDER_ONEVERYTWOFRAMES: number = 2;

    /**
    * Use this predicate to dynamically define the list of mesh you want to render.
    * If set, the renderList property will be overwritten.
    */
    public renderListPredicate: (AbstractMesh: AbstractMesh) => boolean;

    private _renderList: Nullable<Array<AbstractMesh>>;
    /**
    * Use this list to define the list of mesh you want to render.
    */
    public get renderList(): Nullable<Array<AbstractMesh>> {
        return this._renderList;
    }

    public set renderList(value: Nullable<Array<AbstractMesh>>) {
        this._renderList = value;

        if (this._renderList) {
            this._hookArray(this._renderList);
        }
    }

    /**
     * Use this function to overload the renderList array at rendering time.
     * Return null to render with the curent renderList, else return the list of meshes to use for rendering.
     * For 2DArray RTT, layerOrFace is the index of the layer that is going to be rendered, else it is the faceIndex of
     * the cube (if the RTT is a cube, else layerOrFace=0).
     * The renderList passed to the function is the current render list (the one that will be used if the function returns null).
     * The length of this list is passed through renderListLength: don't use renderList.length directly because the array can
     * hold dummy elements!
    */
    public getCustomRenderList: (layerOrFace: number, renderList: Nullable<Immutable<Array<AbstractMesh>>>, renderListLength: number) => Nullable<Array<AbstractMesh>>;

    private _hookArray(array: AbstractMesh[]): void {
        var oldPush = array.push;
        array.push = (...items: AbstractMesh[]) => {
            let wasEmpty = array.length === 0;

            var result = oldPush.apply(array, items);

            if (wasEmpty && this.getScene()) {
                this.getScene()!.meshes.forEach((mesh) => {
                    mesh._markSubMeshesAsLightDirty();
                });
            }

            return result;
        };

        var oldSplice = array.splice;
        array.splice = (index: number, deleteCount?: number) => {
            var deleted = oldSplice.apply(array, [index, deleteCount]);

            if (array.length === 0) {
                this.getScene()!.meshes.forEach((mesh) => {
                    mesh._markSubMeshesAsLightDirty();
                });
            }

            return deleted;
        };
    }

    /**
     * Define if particles should be rendered in your texture.
     */
    public renderParticles = true;
    /**
     * Define if sprites should be rendered in your texture.
     */
    public renderSprites = false;
    /**
     * Define the camera used to render the texture.
     */
    public activeCamera: Nullable<Camera>;
    /**
     * Override the mesh isReady function with your own one.
     */
    public customIsReadyFunction: (mesh: AbstractMesh, refreshRate: number) => boolean;
    /**
     * Override the render function of the texture with your own one.
     */
    public customRenderFunction: (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>, beforeTransparents?: () => void) => void;
    /**
     * Define if camera post processes should be use while rendering the texture.
     */
    public useCameraPostProcesses: boolean;
    /**
     * Define if the camera viewport should be respected while rendering the texture or if the render should be done to the entire texture.
     */
    public ignoreCameraViewport: boolean = false;

    private _postProcessManager: Nullable<PostProcessManager>;
    private _postProcesses: PostProcess[];
    private _resizeObserver: Nullable<Observer<Engine>>;

    /**
    * An event triggered when the texture is unbind.
    */
    public onBeforeBindObservable = new Observable<RenderTargetTexture>();

    /**
    * An event triggered when the texture is unbind.
    */
    public onAfterUnbindObservable = new Observable<RenderTargetTexture>();

    private _onAfterUnbindObserver: Nullable<Observer<RenderTargetTexture>>;
    /**
     * Set a after unbind callback in the texture.
     * This has been kept for backward compatibility and use of onAfterUnbindObservable is recommended.
     */
    public set onAfterUnbind(callback: () => void) {
        if (this._onAfterUnbindObserver) {
            this.onAfterUnbindObservable.remove(this._onAfterUnbindObserver);
        }
        this._onAfterUnbindObserver = this.onAfterUnbindObservable.add(callback);
    }

    /**
    * An event triggered before rendering the texture
    */
    public onBeforeRenderObservable = new Observable<number>();

    private _onBeforeRenderObserver: Nullable<Observer<number>>;
    /**
     * Set a before render callback in the texture.
     * This has been kept for backward compatibility and use of onBeforeRenderObservable is recommended.
     */
    public set onBeforeRender(callback: (faceIndex: number) => void) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }

    /**
    * An event triggered after rendering the texture
    */
    public onAfterRenderObservable = new Observable<number>();

    private _onAfterRenderObserver: Nullable<Observer<number>>;
    /**
     * Set a after render callback in the texture.
     * This has been kept for backward compatibility and use of onAfterRenderObservable is recommended.
     */
    public set onAfterRender(callback: (faceIndex: number) => void) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }

    /**
    * An event triggered after the texture clear
    */
    public onClearObservable = new Observable<Engine>();

    private _onClearObserver: Nullable<Observer<Engine>>;
    /**
     * Set a clear callback in the texture.
     * This has been kept for backward compatibility and use of onClearObservable is recommended.
     */
    public set onClear(callback: (Engine: Engine) => void) {
        if (this._onClearObserver) {
            this.onClearObservable.remove(this._onClearObserver);
        }
        this._onClearObserver = this.onClearObservable.add(callback);
    }

    /**
     * An event triggered when the texture is resized.
     */
    public onResizeObservable = new Observable<RenderTargetTexture>();

    /**
     * Define the clear color of the Render Target if it should be different from the scene.
     */
    public clearColor: Color4;
    protected _size: number | { width: number, height: number, layers?: number };
    protected _initialSizeParameter: number | { width: number, height: number } | { ratio: number };
    protected _sizeRatio: Nullable<number>;
    /** @hidden */
    public _generateMipMaps: boolean;
    protected _renderingManager: RenderingManager;
    /** @hidden */
    public _waitingRenderList?: string[];
    protected _doNotChangeAspectRatio: boolean;
    protected _currentRefreshId = -1;
    protected _refreshRate = 1;
    protected _textureMatrix: Matrix;
    protected _samples = 1;
    protected _renderTargetOptions: RenderTargetCreationOptions;
    /**
     * Gets render target creation options that were used.
     */
    public get renderTargetOptions(): RenderTargetCreationOptions {
        return this._renderTargetOptions;
    }

    protected _onRatioRescale(): void {
        if (this._sizeRatio) {
            this.resize(this._initialSizeParameter);
        }
    }

    /**
     * Gets or sets the center of the bounding box associated with the texture (when in cube mode)
     * It must define where the camera used to render the texture is set
     */
    public boundingBoxPosition = Vector3.Zero();

    private _boundingBoxSize: Vector3;

    /**
     * Gets or sets the size of the bounding box associated with the texture (when in cube mode)
     * When defined, the cubemap will switch to local mode
     * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
     * @example https://www.babylonjs-playground.com/#RNASML
     */
    public set boundingBoxSize(value: Vector3) {
        if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
            return;
        }
        this._boundingBoxSize = value;
        let scene = this.getScene();
        if (scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }
    }
    public get boundingBoxSize(): Vector3 {
        return this._boundingBoxSize;
    }

    /**
     * In case the RTT has been created with a depth texture, get the associated
     * depth texture.
     * Otherwise, return null.
     */
    public get depthStencilTexture(): Nullable<InternalTexture> {
        return this.getInternalTexture()?._depthStencilTexture || null;
    }

    /**
     * Instantiate a render target texture. This is mainly used to render of screen the scene to for instance apply post processse
     * or used a shadow, depth texture...
     * @param name The friendly name of the texture
     * @param size The size of the RTT (number if square, or {width: number, height:number} or {ratio:} to define a ratio from the main scene)
     * @param scene The scene the RTT belongs to. The latest created scene will be used if not precised.
     * @param generateMipMaps True if mip maps need to be generated after render.
     * @param doNotChangeAspectRatio True to not change the aspect ratio of the scene in the RTT
     * @param type The type of the buffer in the RTT (int, half float, float...)
     * @param isCube True if a cube texture needs to be created
     * @param samplingMode The sampling mode to be usedwith the render target (Linear, Nearest...)
     * @param generateDepthBuffer True to generate a depth buffer
     * @param generateStencilBuffer True to generate a stencil buffer
     * @param isMulti True if multiple textures need to be created (Draw Buffers)
     * @param format The internal format of the buffer in the RTT (RED, RG, RGB, RGBA, ALPHA...)
     * @param delayAllocation if the texture allocation should be delayed (default: false)
     */
    constructor(name: string, size: number | { width: number, height: number, layers?: number } | { ratio: number }, scene: Nullable<Scene>, generateMipMaps?: boolean, doNotChangeAspectRatio: boolean = true, type: number = Constants.TEXTURETYPE_UNSIGNED_INT, isCube = false, samplingMode = Texture.TRILINEAR_SAMPLINGMODE, generateDepthBuffer = true, generateStencilBuffer = false, isMulti = false, format = Constants.TEXTUREFORMAT_RGBA, delayAllocation = false) {
        super(null, scene, !generateMipMaps);
        scene = this.getScene();
        if (!scene) {
            return;
        }

        this._coordinatesMode = Texture.PROJECTION_MODE;
        this.renderList = new Array<AbstractMesh>();
        this.name = name;
        this.isRenderTarget = true;
        this._initialSizeParameter = size;

        this._processSizeParameter(size);

        this._resizeObserver = this.getScene()!.getEngine().onResizeObservable.add(() => {
        });

        this._generateMipMaps = generateMipMaps ? true : false;
        this._doNotChangeAspectRatio = doNotChangeAspectRatio;

        // Rendering groups
        this._renderingManager = new RenderingManager(scene);
        this._renderingManager._useSceneAutoClearSetup = true;

        if (isMulti) {
            return;
        }

        this._renderTargetOptions = {
            generateMipMaps: generateMipMaps,
            type: type,
            format: format,
            samplingMode: samplingMode,
            generateDepthBuffer: generateDepthBuffer,
            generateStencilBuffer: generateStencilBuffer
        };

        if (samplingMode === Texture.NEAREST_SAMPLINGMODE) {
            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;
        }

        if (!delayAllocation) {
            if (isCube) {
                this._texture = scene.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions);
                this.coordinatesMode = Texture.INVCUBIC_MODE;
                this._textureMatrix = Matrix.Identity();
            } else {
                this._texture = scene.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions);
            }
        }
    }

    /**
     * Creates a depth stencil texture.
     * This is only available in WebGL 2 or with the depth texture extension available.
     * @param comparisonFunction Specifies the comparison function to set on the texture. If 0 or undefined, the texture is not in comparison mode
     * @param bilinearFiltering Specifies whether or not bilinear filtering is enable on the texture
     * @param generateStencil Specifies whether or not a stencil should be allocated in the texture
     */
    public createDepthStencilTexture(comparisonFunction: number = 0, bilinearFiltering: boolean = true, generateStencil: boolean = false): void {
        const internalTexture = this.getInternalTexture();
        if (!this.getScene() || !internalTexture) {
            return;
        }

        var engine = this.getScene()!.getEngine();
        internalTexture._depthStencilTexture = engine.createDepthStencilTexture(this._size, {
            bilinearFiltering,
            comparisonFunction,
            generateStencil,
            isCube: this.isCube
        });
    }

    private _processSizeParameter(size: number | { width: number, height: number } | { ratio: number }): void {
        if ((<{ ratio: number }>size).ratio) {
            this._sizeRatio = (<{ ratio: number }>size).ratio;
            const engine = this._getEngine()!;
            this._size = {
                width: this._bestReflectionRenderTargetDimension(engine.getRenderWidth(), this._sizeRatio),
                height: this._bestReflectionRenderTargetDimension(engine.getRenderHeight(), this._sizeRatio)
            };
        } else {
            this._size = <number | { width: number, height: number, layers?: number }>size;
        }
    }

    /**
     * Define the number of samples to use in case of MSAA.
     * It defaults to one meaning no MSAA has been enabled.
     */
    public get samples(): number {
        return this._samples;
    }

    public set samples(value: number) {
        if (this._samples === value) {
            return;
        }

        let scene = this.getScene();

        if (!scene) {
            return;
        }

        this._samples = scene.getEngine().updateRenderTargetTextureSampleCount(this._texture, value);
    }

    /**
     * Resets the refresh counter of the texture and start bak from scratch.
     * Could be useful to regenerate the texture if it is setup to render only once.
     */
    public resetRefreshCounter(): void {
        this._currentRefreshId = -1;
    }

    /**
     * Define the refresh rate of the texture or the rendering frequency.
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
     * Adds a post process to the render target rendering passes.
     * @param postProcess define the post process to add
     */
    public addPostProcess(postProcess: PostProcess): void {
        if (!this._postProcessManager) {
            let scene = this.getScene();

            if (!scene) {
                return;
            }
            this._postProcessManager = new PostProcessManager(scene);
            this._postProcesses = new Array<PostProcess>();
        }

        this._postProcesses.push(postProcess);
        this._postProcesses[0].autoClear = false;
    }

    /**
     * Clear all the post processes attached to the render target
     * @param dispose define if the cleared post processesshould also be disposed (false by default)
     */
    public clearPostProcesses(dispose: boolean = false): void {
        if (!this._postProcesses) {
            return;
        }

        if (dispose) {
            for (var postProcess of this._postProcesses) {
                postProcess.dispose();
            }
        }

        this._postProcesses = [];
    }

    /**
     * Remove one of the post process from the list of attached post processes to the texture
     * @param postProcess define the post process to remove from the list
     */
    public removePostProcess(postProcess: PostProcess): void {
        if (!this._postProcesses) {
            return;
        }

        var index = this._postProcesses.indexOf(postProcess);

        if (index === -1) {
            return;
        }

        this._postProcesses.splice(index, 1);

        if (this._postProcesses.length > 0) {
            this._postProcesses[0].autoClear = false;
        }
    }

    /** @hidden */
    public _shouldRender(): boolean {
        if (this._currentRefreshId === -1) { // At least render once
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
     * Gets the actual render size of the texture.
     * @returns the width of the render size
     */
    public getRenderSize(): number {
        return this.getRenderWidth();
    }

    /**
     * Gets the actual render width of the texture.
     * @returns the width of the render size
     */
    public getRenderWidth(): number {
        if ((<{ width: number, height: number }>this._size).width) {
            return (<{ width: number, height: number }>this._size).width;
        }

        return <number>this._size;
    }

    /**
     * Gets the actual render height of the texture.
     * @returns the height of the render size
     */
    public getRenderHeight(): number {
        if ((<{ width: number, height: number }>this._size).width) {
            return (<{ width: number, height: number }>this._size).height;
        }

        return <number>this._size;
    }

    /**
     * Gets the actual number of layers of the texture.
     * @returns the number of layers
     */
    public getRenderLayers(): number {
        const layers = (<{ width: number, height: number, layers?: number }>this._size).layers;
        if (layers) {
            return layers;
        }

        return 0;
    }

    /**
     * Get if the texture can be rescaled or not.
     */
    public get canRescale(): boolean {
        return true;
    }

    /**
     * Resize the texture using a ratio.
     * @param ratio the ratio to apply to the texture size in order to compute the new target size
     */
    public scale(ratio: number): void {
        var newSize = Math.max(1, this.getRenderSize() * ratio);

        this.resize(newSize);
    }

    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    public getReflectionTextureMatrix(): Matrix {
        if (this.isCube) {
            return this._textureMatrix;
        }

        return super.getReflectionTextureMatrix();
    }

    /**
     * Resize the texture to a new desired size.
     * Be carrefull as it will recreate all the data in the new texture.
     * @param size Define the new size. It can be:
     *   - a number for squared texture,
     *   - an object containing { width: number, height: number }
     *   - or an object containing a ratio { ratio: number }
     */
    public resize(size: number | { width: number, height: number } | { ratio: number }): void {
        var wasCube = this.isCube;

        this.releaseInternalTexture();
        let scene = this.getScene();

        if (!scene) {
            return;
        }

        this._processSizeParameter(size);

        if (wasCube) {
            this._texture = scene.getEngine().createRenderTargetCubeTexture(this.getRenderSize(), this._renderTargetOptions);
        } else {
            this._texture = scene.getEngine().createRenderTargetTexture(this._size, this._renderTargetOptions);
        }

        if (this.onResizeObservable.hasObservers()) {
            this.onResizeObservable.notifyObservers(this);
        }
    }

    private _defaultRenderListPrepared: boolean;

    /**
     * Renders all the objects from the render list into the texture.
     * @param useCameraPostProcess Define if camera post processes should be used during the rendering
     * @param dumpForDebug Define if the rendering result should be dumped (copied) for debugging purpose
     */
    public render(useCameraPostProcess: boolean = false, dumpForDebug: boolean = false): void {
        var scene = this.getScene();

        if (!scene) {
            return;
        }

        var engine = scene.getEngine();

        if (this.useCameraPostProcesses !== undefined) {
            useCameraPostProcess = this.useCameraPostProcesses;
        }

        if (this._waitingRenderList) {
            this.renderList = [];
            for (var index = 0; index < this._waitingRenderList.length; index++) {
                var id = this._waitingRenderList[index];
                let mesh = scene.getMeshByID(id);
                if (mesh) {
                    this.renderList.push(mesh);
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

            var scene = this.getScene();

            if (!scene) {
                return;
            }

            var sceneMeshes = scene.meshes;

            for (var index = 0; index < sceneMeshes.length; index++) {
                var mesh = sceneMeshes[index];
                if (this.renderListPredicate(mesh)) {
                    this.renderList.push(mesh);
                }
            }
        }

        this.onBeforeBindObservable.notifyObservers(this);

        // Set custom projection.
        // Needs to be before binding to prevent changing the aspect ratio.
        let camera: Nullable<Camera>;
        if (this.activeCamera) {
            camera = this.activeCamera;
            engine.setViewport(this.activeCamera.viewport, this.getRenderWidth(), this.getRenderHeight());

            if (this.activeCamera !== scene.activeCamera) {
                scene.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(true));
            }
        }
        else {
            camera = scene.activeCamera;
            if (camera) {
                engine.setViewport(camera.viewport, this.getRenderWidth(), this.getRenderHeight());
            }
        }

        this._defaultRenderListPrepared = false;

        if (this.is2DArray) {
            for (let layer = 0; layer < this.getRenderLayers(); layer++) {
                this.renderToTarget(0, useCameraPostProcess, dumpForDebug, layer, camera);
                scene.incrementRenderId();
                scene.resetCachedMaterial();
            }
        }
        else if (this.isCube) {
            for (var face = 0; face < 6; face++) {
                this.renderToTarget(face, useCameraPostProcess, dumpForDebug, undefined, camera);
                scene.incrementRenderId();
                scene.resetCachedMaterial();
            }
        } else {
            this.renderToTarget(0, useCameraPostProcess, dumpForDebug, undefined, camera);
        }

        this.onAfterUnbindObservable.notifyObservers(this);

        if (scene.activeCamera) {
            // Do not avoid setting uniforms when multiple scenes are active as another camera may have overwrite these
            if (scene.getEngine().scenes.length > 1 || (this.activeCamera && this.activeCamera !== scene.activeCamera)) {
                scene.setTransformMatrix(scene.activeCamera.getViewMatrix(), scene.activeCamera.getProjectionMatrix(true));
            }
            engine.setViewport(scene.activeCamera.viewport);
        }

        scene.resetCachedMaterial();
    }

    private _bestReflectionRenderTargetDimension(renderDimension: number, scale: number): number {
        let minimum = 128;
        let x = renderDimension * scale;
        let curved = Engine.NearestPOT(x + (minimum * minimum / (minimum + x)));

        // Ensure we don't exceed the render dimension (while staying POT)
        return Math.min(Engine.FloorPOT(renderDimension), curved);
    }

    private _prepareRenderingManager(currentRenderList: Array<AbstractMesh>, currentRenderListLength: number, camera: Nullable<Camera>, checkLayerMask: boolean): void {
        var scene = this.getScene();

        if (!scene) {
            return;
        }

        this._renderingManager.reset();

        var sceneRenderId = scene.getRenderId();
        for (var meshIndex = 0; meshIndex < currentRenderListLength; meshIndex++) {
            var mesh = currentRenderList[meshIndex];

            if (mesh) {
                if (this.customIsReadyFunction) {
                    if (!this.customIsReadyFunction(mesh, this.refreshRate)) {
                        this.resetRefreshCounter();
                        continue;
                    }
                }
                else if (!mesh.isReady(this.refreshRate === 0)) {
                    this.resetRefreshCounter();
                    continue;
                }

                mesh._preActivateForIntermediateRendering(sceneRenderId);

                let isMasked;
                if (checkLayerMask && camera) {
                    isMasked = ((mesh.layerMask & camera.layerMask) === 0);
                } else {
                    isMasked = false;
                }

                if (mesh.isEnabled() && mesh.isVisible && mesh.subMeshes && !isMasked) {
                    if (mesh._activate(sceneRenderId, true) && mesh.subMeshes.length) {
                        if (!mesh.isAnInstance) {
                            mesh._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = false;
                        } else {
                            if (!mesh._internalAbstractMeshDataInfo._actAsRegularMesh) {
                                mesh = (mesh as InstancedMesh).sourceMesh;
                            }
                        }
                        mesh._internalAbstractMeshDataInfo._isActiveIntermediate = true;

                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];
                            this._renderingManager.dispatch(subMesh, mesh);
                        }
                    }
                }
            }
        }

        for (var particleIndex = 0; particleIndex < scene.particleSystems.length; particleIndex++) {
            var particleSystem = scene.particleSystems[particleIndex];

            let emitter: any = particleSystem.emitter;
            if (!particleSystem.isStarted() || !emitter || !emitter.position || !emitter.isEnabled()) {
                continue;
            }

            if (currentRenderList.indexOf(emitter) >= 0) {
                this._renderingManager.dispatchParticles(particleSystem);
            }
        }
    }

    /**
     * @hidden
     * @param faceIndex face index to bind to if this is a cubetexture
     * @param layer defines the index of the texture to bind in the array
     */
    public _bindFrameBuffer(faceIndex: number = 0, layer = 0) {
        var scene = this.getScene();
        if (!scene) {
            return;
        }

        var engine = scene.getEngine();
        if (this._texture) {
            engine.bindFramebuffer(this._texture, this.isCube ? faceIndex : undefined, undefined, undefined, this.ignoreCameraViewport, 0, layer);
        }
    }

    protected unbindFrameBuffer(engine: Engine, faceIndex: number): void {
        if (!this._texture) {
            return;
        }
        engine.unBindFramebuffer(this._texture, this.isCube, () => {
            this.onAfterRenderObservable.notifyObservers(faceIndex);
        });
    }

    private renderToTarget(faceIndex: number, useCameraPostProcess: boolean, dumpForDebug: boolean, layer = 0, camera: Nullable<Camera> = null): void {
        var scene = this.getScene();

        if (!scene) {
            return;
        }

        var engine = scene.getEngine();

        if (!this._texture) {
            return;
        }

        // Bind
        if (this._postProcessManager) {
            this._postProcessManager._prepareFrame(this._texture, this._postProcesses);
        }
        else if (!useCameraPostProcess || !scene.postProcessManager._prepareFrame(this._texture)) {
            this._bindFrameBuffer(faceIndex, layer);
        }

        if (this.is2DArray) {
            this.onBeforeRenderObservable.notifyObservers(layer);
        }
        else {
            this.onBeforeRenderObservable.notifyObservers(faceIndex);
        }

        // Get the list of meshes to render
        let currentRenderList: Nullable<Array<AbstractMesh>> = null;
        let defaultRenderList = this.renderList ? this.renderList : scene.getActiveMeshes().data;
        let defaultRenderListLength = this.renderList ? this.renderList.length : scene.getActiveMeshes().length;

        if (this.getCustomRenderList) {
            currentRenderList = this.getCustomRenderList(this.is2DArray ? layer : faceIndex, defaultRenderList, defaultRenderListLength);
        }

        if (!currentRenderList) {
            // No custom render list provided, we prepare the rendering for the default list, but check
            // first if we did not already performed the preparation before so as to avoid re-doing it several times
            if (!this._defaultRenderListPrepared) {
                this._prepareRenderingManager(defaultRenderList, defaultRenderListLength, camera, !this.renderList);
                this._defaultRenderListPrepared = true;
            }
            currentRenderList = defaultRenderList;
        } else {
            // Prepare the rendering for the custom render list provided
            this._prepareRenderingManager(currentRenderList, currentRenderList.length, camera, false);
        }

        // Clear
        if (this.onClearObservable.hasObservers()) {
            this.onClearObservable.notifyObservers(engine);
        } else {
            engine.clear(this.clearColor || scene.clearColor, true, true, true);
        }

        if (!this._doNotChangeAspectRatio) {
            scene.updateTransformMatrix(true);
        }

        // Before Camera Draw
        for (let step of scene._beforeRenderTargetDrawStage) {
            step.action(this);
        }

        // Render
        this._renderingManager.render(this.customRenderFunction, currentRenderList, this.renderParticles, this.renderSprites);

        // After Camera Draw
        for (let step of scene._afterRenderTargetDrawStage) {
            step.action(this);
        }

        if (this._postProcessManager) {
            this._postProcessManager._finalizeFrame(false, this._texture, faceIndex, this._postProcesses, this.ignoreCameraViewport);
        }
        else if (useCameraPostProcess) {
            scene.postProcessManager._finalizeFrame(false, this._texture, faceIndex);
        }

        if (!this._doNotChangeAspectRatio) {
            scene.updateTransformMatrix(true);
        }

        // Dump ?
        if (dumpForDebug) {
            Tools.DumpFramebuffer(this.getRenderWidth(), this.getRenderHeight(), engine);
        }

        // Unbind
        if (!this.isCube || faceIndex === 5) {
            if (this.isCube) {

                if (faceIndex === 5) {
                    engine.generateMipMapsForCubemap(this._texture);
                }
            }

            this.unbindFrameBuffer(engine, faceIndex);

        } else {
            this.onAfterRenderObservable.notifyObservers(faceIndex);
        }
    }

    /**
     * Overrides the default sort function applied in the renderging group to prepare the meshes.
     * This allowed control for front to back rendering or reversly depending of the special needs.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
     * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
     * @param transparentSortCompareFn The transparent queue comparison function use to sort.
     */
    public setRenderingOrder(renderingGroupId: number,
        opaqueSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        alphaTestSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null,
        transparentSortCompareFn: Nullable<(a: SubMesh, b: SubMesh) => number> = null): void {

        this._renderingManager.setRenderingOrder(renderingGroupId,
            opaqueSortCompareFn,
            alphaTestSortCompareFn,
            transparentSortCompareFn);
    }

    /**
     * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
     *
     * @param renderingGroupId The rendering group id corresponding to its index
     * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
     */
    public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
        this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        this._renderingManager._useSceneAutoClearSetup = false;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): RenderTargetTexture {
        var textureSize = this.getSize();
        var newTexture = new RenderTargetTexture(
            this.name,
            textureSize,
            this.getScene(),
            this._renderTargetOptions.generateMipMaps,
            this._doNotChangeAspectRatio,
            this._renderTargetOptions.type,
            this.isCube,
            this._renderTargetOptions.samplingMode,
            this._renderTargetOptions.generateDepthBuffer,
            this._renderTargetOptions.generateStencilBuffer
        );

        // Base texture
        newTexture.hasAlpha = this.hasAlpha;
        newTexture.level = this.level;

        // RenderTarget Texture
        newTexture.coordinatesMode = this.coordinatesMode;
        if (this.renderList) {
            newTexture.renderList = this.renderList.slice(0);
        }

        return newTexture;
    }

    /**
     * Serialize the texture to a JSON representation we can easily use in the resepective Parse function.
     * @returns The JSON representation of the texture
     */
    public serialize(): any {
        if (!this.name) {
            return null;
        }

        var serializationObject = super.serialize();

        serializationObject.renderTargetSize = this.getRenderSize();
        serializationObject.renderList = [];

        if (this.renderList) {
            for (var index = 0; index < this.renderList.length; index++) {
                serializationObject.renderList.push(this.renderList[index].id);
            }
        }

        return serializationObject;
    }

    /**
     *  This will remove the attached framebuffer objects. The texture will not be able to be used as render target anymore
     */
    public disposeFramebufferObjects(): void {
        let objBuffer = this.getInternalTexture();
        let scene = this.getScene();
        if (objBuffer && scene) {
            scene.getEngine()._releaseFramebufferObjects(objBuffer);
        }
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        this.onResizeObservable.clear();
        this.onClearObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onAfterUnbindObservable.clear();
        this.onBeforeBindObservable.clear();
        this.onBeforeRenderObservable.clear();

        if (this._postProcessManager) {
            this._postProcessManager.dispose();
            this._postProcessManager = null;
        }

        this.clearPostProcesses(true);

        if (this._resizeObserver) {
            this.getScene()!.getEngine().onResizeObservable.remove(this._resizeObserver);
            this._resizeObserver = null;
        }

        this.renderList = null;

        // Remove from custom render targets
        var scene = this.getScene();

        if (!scene) {
            return;
        }

        var index = scene.customRenderTargets.indexOf(this);

        if (index >= 0) {
            scene.customRenderTargets.splice(index, 1);
        }

        for (var camera of scene.cameras) {
            index = camera.customRenderTargets.indexOf(this);

            if (index >= 0) {
                camera.customRenderTargets.splice(index, 1);
            }
        }

        if (this.depthStencilTexture) {
            this.getScene()!.getEngine()._releaseTexture(this.depthStencilTexture);
        }

        super.dispose();
    }

    /** @hidden */
    public _rebuild(): void {
        if (this.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE) {
            this.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        }

        if (this._postProcessManager) {
            this._postProcessManager._rebuild();
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

    /**
     * Gets the number of views the corresponding to the texture (eg. a MultiviewRenderTarget will have > 1)
     * @returns the view count
     */
    public getViewCount() {
        return 1;
    }
}

Texture._CreateRenderTargetTexture = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean) => {
    return new RenderTargetTexture(name, renderTargetSize, scene, generateMipMaps);
};
