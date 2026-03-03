import type {
    FrameGraph,
    FrameGraphTextureHandle,
    Scene,
    Camera,
    FrameGraphObjectList,
    FrameGraphRenderContext,
    ObjectRendererOptions,
    Light,
    Nullable,
    Observer,
    FrameGraphShadowGeneratorTask,
    FrameGraphRenderPass,
    AbstractEngine,
    BoundingBoxRenderer,
    ShadowLight,
    SmartArray,
    SubMesh,
    ClusteredLightContainer,
    RenderingGroup,
} from "core/index";
import { backbufferColorTextureHandle, backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { FrameGraphTaskMultiRenderTarget } from "../../frameGraphTaskMultiRenderTarget";
import { ObjectRenderer } from "../../../Rendering/objectRenderer";
import { Constants } from "../../../Engines/constants";
import { ThinDepthPeelingRenderer } from "../../../Rendering/thinDepthPeelingRenderer";
import { FrameGraphRenderTarget } from "../../frameGraphRenderTarget";
import { LightConstants } from "../../../Lights/lightConstants";

/**
 * Task used to render objects to a texture.
 */
export class FrameGraphObjectRendererTask extends FrameGraphTaskMultiRenderTarget {
    /**
     * The target texture(s) where the objects will be rendered.
     */
    public targetTexture: FrameGraphTextureHandle | FrameGraphTextureHandle[];

    /**
     * The depth attachment texture where the objects will be rendered (optional).
     */
    public depthTexture?: FrameGraphTextureHandle;

    /**
     * The shadow generators used to render the objects (optional).
     */
    public shadowGenerators?: FrameGraphShadowGeneratorTask[] = [];

    private _camera: Camera;

    /**
     * Gets or sets the camera used to render the objects.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._renderer.activeCamera = this.camera;
    }

    /**
     * The list of objects to render.
     */
    public objectList: FrameGraphObjectList;

    /**
     * If depth testing should be enabled (default is true).
     */
    public depthTest = true;

    /**
     * If depth writing should be enabled (default is true).
     */
    public depthWrite = true;

    /**
     * If shadows should be disabled (default is false).
     */
    public disableShadows = false;

    private _disableImageProcessing = false;
    /**
     * If image processing should be disabled (default is false).
     * false means that the default image processing configuration will be applied (the one from the scene)
     */
    public get disableImageProcessing() {
        return this._disableImageProcessing;
    }

    public set disableImageProcessing(value: boolean) {
        if (value === this._disableImageProcessing) {
            return;
        }

        this._disableImageProcessing = value;
        this._renderer.disableImageProcessing = value;
    }

    /**
     * Sets this property to true if this task is the main object renderer of the frame graph.
     * It will help to locate the main object renderer in the frame graph when multiple object renderers are used.
     * This is useful for the inspector to know which object renderer to use for additional rendering features like wireframe rendering or frustum light debugging.
     * It is also used to determine the main camera used by the frame graph: this is the camera used by the main object renderer.
     */
    public isMainObjectRenderer = false;

    private _renderMeshes = true;
    /**
     * Defines if meshes should be rendered (default is true).
     */
    public get renderMeshes() {
        return this._renderMeshes;
    }

    public set renderMeshes(value: boolean) {
        if (value === this._renderMeshes) {
            return;
        }

        this._renderMeshes = value;
        this._renderer.renderMeshes = value;
    }

    private _renderDepthOnlyMeshes = true;
    /**
     * Defines if depth only meshes should be rendered (default is true). Always subject to the renderMeshes property, though.
     */
    public get renderDepthOnlyMeshes() {
        return this._renderDepthOnlyMeshes;
    }

    public set renderDepthOnlyMeshes(value: boolean) {
        if (value === this._renderDepthOnlyMeshes) {
            return;
        }
        this._renderDepthOnlyMeshes = value;
        this._renderer.renderDepthOnlyMeshes = value;
    }

    private _renderOpaqueMeshes = true;
    /**
     * Defines if opaque meshes should be rendered (default is true). Always subject to the renderMeshes property, though.
     */
    public get renderOpaqueMeshes() {
        return this._renderOpaqueMeshes;
    }

    public set renderOpaqueMeshes(value: boolean) {
        if (value === this._renderOpaqueMeshes) {
            return;
        }
        this._renderOpaqueMeshes = value;
        this._renderer.renderOpaqueMeshes = value;
    }

    private _renderAlphaTestMeshes = true;
    /**
     * Defines if alpha test meshes should be rendered (default is true). Always subject to the renderMeshes property, though.
     */
    public get renderAlphaTestMeshes() {
        return this._renderAlphaTestMeshes;
    }

    public set renderAlphaTestMeshes(value: boolean) {
        if (value === this._renderAlphaTestMeshes) {
            return;
        }
        this._renderAlphaTestMeshes = value;
        this._renderer.renderAlphaTestMeshes = value;
    }

    private _renderTransparentMeshes = true;
    /**
     * Defines if transparent meshes should be rendered (default is true). Always subject to the renderMeshes property, though.
     */
    public get renderTransparentMeshes() {
        return this._renderTransparentMeshes;
    }

    public set renderTransparentMeshes(value: boolean) {
        if (value === this._renderTransparentMeshes) {
            return;
        }
        this._renderTransparentMeshes = value;
        this._renderer.renderTransparentMeshes = value;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private _useOITForTransparentMeshes = false;
    /**
     * Defines if Order Independent Transparency should be used for transparent meshes (default is false).
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public get useOITForTransparentMeshes() {
        return this._useOITForTransparentMeshes;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public set useOITForTransparentMeshes(value: boolean) {
        if (value === this._useOITForTransparentMeshes) {
            return;
        }
        this._useOITForTransparentMeshes = value;
        this._renderer.customRenderTransparentSubMeshes = this._useOITForTransparentMeshes ? this._renderTransparentMeshesWithOIT.bind(this) : undefined;
        this._oitRenderer.blendOutput = value && this._rtForOrderIndependentTransparency ? this._rtForOrderIndependentTransparency.renderTargetWrapper! : null;
    }

    /**
     * Defines the number of passes to use for Order Independent Transparency (default is 5).
     */
    public get oitPassCount() {
        return this._oitRenderer.passCount;
    }

    public set oitPassCount(value: number) {
        if (value === this._oitRenderer.passCount) {
            return;
        }
        this._oitRenderer.passCount = value;
    }

    private _renderParticles = true;
    /**
     * Defines if particles should be rendered (default is true).
     */
    public get renderParticles() {
        return this._renderParticles;
    }

    public set renderParticles(value: boolean) {
        if (value === this._renderParticles) {
            return;
        }

        this._renderParticles = value;
        this._renderer.renderParticles = value;
    }

    private _renderSprites = true;
    /**
     * Defines if sprites should be rendered (default is true).
     */
    public get renderSprites() {
        return this._renderSprites;
    }

    public set renderSprites(value: boolean) {
        if (value === this._renderSprites) {
            return;
        }

        this._renderSprites = value;
        this._renderer.renderSprites = value;
    }

    private _forceLayerMaskCheck = true;
    /**
     * Forces checking the layerMask property even if a custom list of meshes is provided (ie. if renderList is not undefined). Default is true.
     */
    public get forceLayerMaskCheck() {
        return this._forceLayerMaskCheck;
    }

    public set forceLayerMaskCheck(value: boolean) {
        if (value === this._forceLayerMaskCheck) {
            return;
        }

        this._forceLayerMaskCheck = value;
        this._renderer.forceLayerMaskCheck = value;
    }

    private _enableBoundingBoxRendering = true;
    /**
     * Enables the rendering of bounding boxes for meshes (still subject to Mesh.showBoundingBox or scene.forceShowBoundingBoxes). Default is true.
     */
    public get enableBoundingBoxRendering() {
        return this._enableBoundingBoxRendering;
    }

    public set enableBoundingBoxRendering(value: boolean) {
        if (value === this._enableBoundingBoxRendering) {
            return;
        }

        this._enableBoundingBoxRendering = value;
        this._renderer.enableBoundingBoxRendering = value;
    }

    private _enableOutlineRendering = true;
    /**
     * Enables the rendering of outlines/overlays for meshes (still subject to Mesh.renderOutline/Mesh.renderOverlay). Default is true.
     */
    public get enableOutlineRendering() {
        return this._enableOutlineRendering;
    }

    public set enableOutlineRendering(value: boolean) {
        if (value === this._enableOutlineRendering) {
            return;
        }

        this._enableOutlineRendering = value;
        this._renderer.enableOutlineRendering = value;
    }

    /**
     * If true, targetTexture will be resolved at the end of the render pass, if this/these texture(s) is/are MSAA (default: true)
     */
    public resolveMSAAColors = true;

    /**
     * If true, depthTexture will be resolved at the end of the render pass, if this texture is provided and is MSAA (default: false).
     */
    public resolveMSAADepth = false;

    /**
     * The output texture.
     * This texture will point to the same texture than the targetTexture property.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The output depth attachment texture.
     * This texture will point to the same texture than the depthTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputDepthTexture: FrameGraphTextureHandle;

    /**
     * The object renderer used to render the objects.
     */
    public get objectRenderer() {
        return this._renderer;
    }

    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._renderer) {
            this._renderer.name = value;
        }
    }

    protected readonly _engine: AbstractEngine;
    protected readonly _scene: Scene;
    protected readonly _renderer: ObjectRenderer;
    protected readonly _oitRenderer: ThinDepthPeelingRenderer;
    protected _textureWidth: number;
    protected _textureHeight: number;
    protected _onBeforeRenderObservable: Nullable<Observer<number>> = null;
    protected _onAfterRenderObservable: Nullable<Observer<number>> = null;
    protected _externalObjectRenderer = false;
    protected _rtForOrderIndependentTransparency: FrameGraphRenderTarget;

    /**
     * Constructs a new object renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     * @param existingObjectRenderer An existing object renderer to use (optional). If provided, the options parameter will be ignored.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions, existingObjectRenderer?: ObjectRenderer) {
        super(name, frameGraph);

        this._scene = scene;
        this._engine = scene.getEngine();
        this._externalObjectRenderer = !!existingObjectRenderer;
        this._renderer = existingObjectRenderer ?? new ObjectRenderer(name, scene, options);
        this.name = name;

        this._renderer.disableImageProcessing = this._disableImageProcessing;
        this._renderer.renderParticles = this._renderParticles;
        this._renderer.renderSprites = this._renderSprites;
        this._renderer.enableBoundingBoxRendering = this._enableBoundingBoxRendering;
        this._renderer.forceLayerMaskCheck = this._forceLayerMaskCheck;

        if (!this._externalObjectRenderer) {
            this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
                if (!this._renderer.options.doNotChangeAspectRatio) {
                    scene.updateTransformMatrix(true);
                }
            });
        }

        this._oitRenderer = new ThinDepthPeelingRenderer(scene);
        this._oitRenderer.useRenderPasses = true;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();

        this.onBeforeTaskExecute.add(() => {
            /**
             * When clustered lights are used, we need to disable the debug markers because there's a flushFramebuffer call
             * done by the clustered light container during the frame rendering that breaks the debug groups.
             */
            this._disableDebugMarkers = this._engine._enableGPUDebugMarkers && this._sceneHasClusteredLights();
        });
    }

    public override isReady() {
        this._renderer.renderList = this.objectList.meshes;
        this._renderer.particleSystemList = this.objectList.particleSystems;

        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }

    public override getClassName(): string {
        return "FrameGraphObjectRendererTask";
    }

    public record(skipCreationOfDisabledPasses = false, additionalExecute?: (context: FrameGraphRenderContext) => void): FrameGraphRenderPass {
        this._checkParameters();

        const targetTextures = this._getTargetHandles();

        const depthEnabled = this._checkTextureCompatibility(targetTextures);

        this._resolveDanglingHandles(targetTextures);
        this._setLightsForShadow();

        this._rtForOrderIndependentTransparency?.dispose();

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(targetTextures);
        pass.setRenderTargetDepth(this.depthTexture);
        pass.setInitializeFunc(() => {
            // Note: we don't use pass.frameGraphRenderTarget.renderTargetWrapper for OIT but recreate our own render target wrapper because this.targetTexture may not be the first one of the wrapper in the geometry renderer task case
            this._rtForOrderIndependentTransparency = new FrameGraphRenderTarget(this.name + "_oitRT", this._frameGraph.textureManager, this.targetTexture, this.depthTexture);
        });
        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;

            this._updateLayerAndFaceIndices(pass);

            const renderTargetWrapper = pass.frameGraphRenderTarget!.renderTargetWrapper;
            if (renderTargetWrapper) {
                renderTargetWrapper.resolveMSAAColors = this.resolveMSAAColors;
                renderTargetWrapper.resolveMSAADepth = this.resolveMSAADepth;
            }

            if (this._useOITForTransparentMeshes && this._oitRenderer.blendOutput !== this._rtForOrderIndependentTransparency.renderTargetWrapper) {
                this._oitRenderer.blendOutput = this._rtForOrderIndependentTransparency.renderTargetWrapper!;
            }

            // The cast to "any" is to avoid an error in ES6 in case you don't import boundingBoxRenderer
            const boundingBoxRenderer = (this as any).getBoundingBoxRenderer?.() as Nullable<BoundingBoxRenderer>;

            const currentBoundingBoxMeshList = boundingBoxRenderer && boundingBoxRenderer.renderList.length > 0 ? boundingBoxRenderer.renderList.data.slice() : [];
            if (boundingBoxRenderer) {
                currentBoundingBoxMeshList.length = boundingBoxRenderer.renderList.length;
            }

            const attachments = this._prepareRendering(context, depthEnabled);

            const currentOITRenderer = this._scene._depthPeelingRenderer;
            this._scene._depthPeelingRenderer = this._oitRenderer;

            const camera = this._renderer.activeCamera;
            if (camera && camera.cameraRigMode !== Constants.RIG_MODE_NONE && !camera._renderingMultiview) {
                for (let index = 0; index < camera._rigCameras.length; index++) {
                    const rigCamera = camera._rigCameras[index];

                    rigCamera.rigParent = undefined; // for some reasons, ObjectRenderer uses the rigParent viewport if rigParent is defined (we want to use rigCamera.viewport instead)

                    this._renderer.activeCamera = rigCamera;

                    context.pushDebugGroup(`Render objects for camera rig ${index} "${rigCamera.name}"`);
                    context.bindRenderTarget(pass.frameGraphRenderTarget);
                    attachments && context.bindAttachments(attachments);
                    context.render(this._renderer, this._textureWidth, this._textureHeight, true);
                    context.popDebugGroup();

                    rigCamera.rigParent = camera;
                }
                this._renderer.activeCamera = camera;
            } else {
                context.pushDebugGroup(`Render objects for camera "${this._renderer.activeCamera?.name ?? "undefined"}"`);
                context.bindRenderTarget(pass.frameGraphRenderTarget);
                attachments && context.bindAttachments(attachments);
                context.render(this._renderer, this._textureWidth, this._textureHeight, true);
                context.popDebugGroup();
            }

            additionalExecute?.(context);

            this._scene._depthPeelingRenderer = currentOITRenderer;

            if (boundingBoxRenderer) {
                boundingBoxRenderer.renderList.data = currentBoundingBoxMeshList;
                boundingBoxRenderer.renderList.length = currentBoundingBoxMeshList.length;
            }
        });

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(targetTextures);
            passDisabled.setRenderTargetDepth(this.depthTexture);
            passDisabled.setExecuteFunc((_context) => {});
        }

        return pass;
    }

    public override dispose(): void {
        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        if (!this._externalObjectRenderer) {
            this._renderer.dispose();
        }
        this._oitRenderer.dispose();
        this._rtForOrderIndependentTransparency?.dispose();
        super.dispose();
    }

    protected _resolveDanglingHandles(targetTextures: FrameGraphTextureHandle[]) {
        if (targetTextures.length > 0) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, targetTextures[0]);
        }

        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }
    }

    protected _checkParameters() {
        if (this.targetTexture === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphObjectRendererTask ${this.name}: targetTexture, objectList, and camera are required`);
        }
    }

    protected _checkTextureCompatibility(targetTextures: FrameGraphTextureHandle[]): boolean {
        const className = this.getClassName();

        let outputTextureDescription = targetTextures.length > 0 ? this._frameGraph.textureManager.getTextureDescription(targetTextures[0]) : null;
        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            if (outputTextureDescription && this.depthTexture !== backbufferDepthStencilTextureHandle && targetTextures[0] === backbufferColorTextureHandle) {
                throw new Error(`${className} ${this.name}: the back buffer depth/stencil texture is the only depth texture allowed when the target is the back buffer color`);
            }

            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (!outputTextureDescription) {
                outputTextureDescription = depthTextureDescription;
            }
            if (depthTextureDescription.options.samples !== outputTextureDescription.options.samples) {
                throw new Error(
                    `${className} ${this.name}: the depth texture "${depthTextureDescription.options.labels?.[0] ?? "noname"}" (${depthTextureDescription.options.samples} samples) and the output texture "${outputTextureDescription.options.labels?.[0] ?? "noname"}" (${outputTextureDescription.options.samples} samples) must have the same number of samples`
                );
            }

            if (depthTextureDescription.size.width !== outputTextureDescription.size.width || depthTextureDescription.size.height !== outputTextureDescription.size.height) {
                throw new Error(
                    `${className} ${this.name}: the depth texture (size: ${depthTextureDescription.size.width}x${depthTextureDescription.size.height}) and the target texture (size: ${outputTextureDescription.size.width}x${outputTextureDescription.size.height}) must have the same dimensions.`
                );
            }

            depthEnabled = true;
        }

        this._textureWidth = outputTextureDescription?.size.width ?? 1;
        this._textureHeight = outputTextureDescription?.size.height ?? 1;

        return depthEnabled;
    }

    protected _getTargetHandles(): FrameGraphTextureHandle[] {
        return Array.isArray(this.targetTexture) ? this.targetTexture : [this.targetTexture];
    }

    protected _prepareRendering(context: FrameGraphRenderContext, depthEnabled: boolean): Nullable<number[]> {
        context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);
        return null;
    }

    protected _setLightsForShadow() {
        const lightsForShadow: Set<Light> = new Set();
        const shadowEnabled: Map<Light, boolean> = new Map();

        if (this.shadowGenerators) {
            for (const shadowGeneratorTask of this.shadowGenerators) {
                const shadowGenerator = shadowGeneratorTask.shadowGenerator;
                const light = shadowGenerator.getLight();
                if (light.isEnabled() && light.shadowEnabled) {
                    lightsForShadow.add(light);
                    if (shadowGeneratorTask.getClassName() === "FrameGraphCascadedShadowGeneratorTask") {
                        light._shadowGenerators!.set(shadowGeneratorTask.camera, shadowGenerator);
                    } else {
                        light._shadowGenerators!.set(null, shadowGenerator);
                    }
                }
            }
        }

        this._renderer.onBeforeRenderObservable.remove(this._onBeforeRenderObservable);
        this._onBeforeRenderObservable = this._renderer.onBeforeRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                if (!(light as ShadowLight).setShadowProjectionMatrix) {
                    continue; // Ignore lights that cannot cast shadows
                }
                shadowEnabled.set(light, light.shadowEnabled);
                light.shadowEnabled = !this.disableShadows && lightsForShadow.has(light);
            }
        });

        this._renderer.onAfterRenderObservable.remove(this._onAfterRenderObservable);
        this._onAfterRenderObservable = this._renderer.onAfterRenderObservable.add(() => {
            for (let i = 0; i < this._scene.lights.length; i++) {
                const light = this._scene.lights[i];
                if (!(light as ShadowLight).setShadowProjectionMatrix) {
                    continue; // Ignore lights that cannot cast shadows
                }
                light.shadowEnabled = shadowEnabled.get(light)!;
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected _renderTransparentMeshesWithOIT(transparentSubMeshes: SmartArray<SubMesh>, renderingGroup: RenderingGroup): void {
        const saveOIT = this._scene._useOrderIndependentTransparency;

        this._scene._useOrderIndependentTransparency = true;

        const excludedMeshes = this._oitRenderer.render(transparentSubMeshes);
        if (excludedMeshes.length) {
            // Render leftover meshes that could not be processed by depth peeling
            renderingGroup._renderTransparent(excludedMeshes);
        }

        this._scene._useOrderIndependentTransparency = saveOIT;
    }

    protected _sceneHasClusteredLights() {
        for (const light of this._scene.lights) {
            if (light.getTypeID() === LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER && (light as ClusteredLightContainer).isSupported) {
                return true;
            }
        }
        return false;
    }
}
