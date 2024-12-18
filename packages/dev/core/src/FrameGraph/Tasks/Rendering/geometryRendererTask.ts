import type {
    FrameGraphTextureHandle,
    Scene,
    Camera,
    AbstractEngine,
    FrameGraph,
    GeometryRenderingTextureClearType,
    FrameGraphObjectList,
    AbstractMesh,
    ObjectRendererOptions,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { backbufferDepthStencilTextureHandle } from "../../frameGraphTypes";
import { Color4 } from "core/Maths/math.color";
import { MaterialHelperGeometryRendering } from "core/Materials/materialHelper.geometryrendering";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";
import { ObjectRenderer } from "../../../Rendering/objectRenderer";

/**
 * Description of a texture used by the geometry renderer task.
 */
export interface IFrameGraphGeometryRendererTextureDescription {
    /**
     * The type of the texture.
     * The value should be one of the Constants.PREPASS_XXX_TEXTURE_TYPE values.
     */
    type: number;

    /**
     * The type of the texture.
     */
    textureType: number;

    /**
     * The format of the texture.
     */
    textureFormat: number;
}

const clearColors: Color4[] = [new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 1), new Color4(1e8, 1e8, 1e8, 1e8)];

/**
 * Task used to render geometry to a set of textures.
 */
export class FrameGraphGeometryRendererTask extends FrameGraphTask {
    /**
     * The depth texture attachment to use for rendering (optional).
     */
    public depthTexture?: FrameGraphTextureHandle;

    private _camera: Camera;

    /**
     * Gets or sets the camera used for rendering.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._renderer.activeCamera = this.camera;
    }

    /**
     * The object list used for rendering.
     */
    public objectList: FrameGraphObjectList;

    /**
     * Whether depth testing is enabled (default is true).
     */
    public depthTest = true;

    /**
     * Whether depth writing is enabled (default is true).
     */
    public depthWrite = true;

    /**
     * The size of the output textures (default is 100% of the back buffer texture size).
     */
    public size: { width: number; height: number } = { width: 100, height: 100 };

    /**
     * Whether the size is a percentage of the back buffer size (default is true).
     */
    public sizeIsPercentage = true;

    /**
     * The number of samples to use for the output textures (default is 1).
     */
    public samples = 1;

    /**
     * The list of texture descriptions used by the geometry renderer task.
     */
    public textureDescriptions: IFrameGraphGeometryRendererTextureDescription[] = [];

    /**
     * The output depth texture attachment texture.
     * This texture will point to the same texture than the depthTexture property if it is set.
     * Note, however, that the handle itself will be different!
     */
    public readonly outputDepthTexture: FrameGraphTextureHandle;

    /**
     * The depth (in view space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryViewDepthTexture: FrameGraphTextureHandle;

    /**
     * The depth (in screen space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryScreenDepthTexture: FrameGraphTextureHandle;

    /**
     * The normal (in view space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryViewNormalTexture: FrameGraphTextureHandle;

    /**
     * The normal (in world space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryWorldNormalTexture: FrameGraphTextureHandle;

    /**
     * The position (in local space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryLocalPositionTexture: FrameGraphTextureHandle;

    /**
     * The position (in world space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryWorldPositionTexture: FrameGraphTextureHandle;

    /**
     * The albedo output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryAlbedoTexture: FrameGraphTextureHandle;

    /**
     * The reflectivity output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryReflectivityTexture: FrameGraphTextureHandle;

    /**
     * The velocity output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryVelocityTexture: FrameGraphTextureHandle;

    /**
     * The linear velocity output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryLinearVelocityTexture: FrameGraphTextureHandle;

    /**
     * The object renderer used by the geometry renderer task.
     */
    public get objectRenderer() {
        return this._renderer;
    }

    /**
     * Gets or sets the name of the task.
     */
    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._renderer) {
            this._renderer.name = value;
        }
    }

    private readonly _engine: AbstractEngine;
    private readonly _scene: Scene;
    private readonly _renderer: ObjectRenderer;
    private _textureWidth: number;
    private _textureHeight: number;
    private _clearAttachmentsLayout: Map<GeometryRenderingTextureClearType, number[]>;
    private _allAttachmentsLayout: number[];

    /**
     * Constructs a new geometry renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions) {
        super(name, frameGraph);

        this._scene = scene;
        this._engine = this._scene.getEngine();

        this._renderer = new ObjectRenderer(name, scene, options);
        this._renderer.renderSprites = false;
        this._renderer.renderParticles = false;

        this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
            if (!this._renderer.options.doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
        });

        this.name = name;
        this._clearAttachmentsLayout = new Map();
        this._allAttachmentsLayout = [];

        this.outputDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryViewDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryScreenDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryViewNormalTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryWorldNormalTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryLocalPositionTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryWorldPositionTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryAlbedoTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryReflectivityTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryVelocityTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryLinearVelocityTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    /**
     * Gets the list of excluded meshes from the velocity texture.
     */
    public get excludedSkinnedMeshFromVelocityTexture(): AbstractMesh[] {
        return MaterialHelperGeometryRendering.GetConfiguration(this._renderer.renderPassId).excludedSkinnedMesh;
    }

    public override isReady() {
        return this._renderer.isReadyForRendering(this._textureWidth, this._textureHeight);
    }

    public record() {
        if (this.textureDescriptions.length === 0 || this.objectList === undefined) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: object list and at least one geometry texture description must be provided`);
        }

        const outputTextureHandle = this._createMultiRenderTargetTexture();

        const depthEnabled = this._checkDepthTextureCompatibility();

        this._buildClearAttachmentsLayout();

        this._registerForRenderPassId(this._renderer.renderPassId);

        const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(outputTextureHandle[0]);

        this._textureWidth = outputTextureDescription.size.width;
        this._textureHeight = outputTextureDescription.size.height;

        // Create pass
        MaterialHelperGeometryRendering.MarkAsDirty(this._renderer.renderPassId, this.objectList.meshes || this._scene.meshes);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.setRenderTarget(outputTextureHandle);

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const handle = outputTextureHandle[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            switch (geometryDescription.type) {
                case Constants.PREPASS_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryViewDepthTexture, handle);
                    break;
                case Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryScreenDepthTexture, handle);
                    break;
                case Constants.PREPASS_NORMAL_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryViewNormalTexture, handle);
                    break;
                case Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryWorldNormalTexture, handle);
                    break;
                case Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryLocalPositionTexture, handle);
                    break;
                case Constants.PREPASS_POSITION_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryWorldPositionTexture, handle);
                    break;
                case Constants.PREPASS_ALBEDO_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryAlbedoTexture, handle);
                    break;
                case Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryReflectivityTexture, handle);
                    break;
                case Constants.PREPASS_VELOCITY_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryVelocityTexture, handle);
                    break;
                case Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryLinearVelocityTexture, handle);
                    break;
            }
        }

        pass.setRenderTargetDepth(this.depthTexture);

        pass.setExecuteFunc((context) => {
            this._renderer.renderList = this.objectList.meshes;
            this._renderer.particleSystemList = this.objectList.particleSystems;

            context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);

            this._clearAttachmentsLayout.forEach((layout, clearType) => {
                context.clearColorAttachments(clearColors[clearType], layout);
            });

            context.bindAttachments(this._allAttachmentsLayout);

            context.render(this._renderer, this._textureWidth, this._textureHeight);
        });
    }

    public override dispose(): void {
        MaterialHelperGeometryRendering.DeleteConfiguration(this._renderer.renderPassId);
        this._renderer.dispose();
        super.dispose();
    }

    private _createMultiRenderTargetTexture(): FrameGraphTextureHandle[] {
        const types: number[] = [];
        const formats: number[] = [];
        const labels: string[] = [];
        const useSRGBBuffers: boolean[] = [];

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);

            if (index === -1) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: unknown texture type ${description.type}`);
            }

            types[i] = description.textureType;
            formats[i] = description.textureFormat;
            labels[i] = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index].name;
            useSRGBBuffers[i] = false;
        }

        const baseHandle = this._frameGraph.textureManager.createRenderTargetTexture(this.name, {
            size: this.size,
            sizeIsPercentage: this.sizeIsPercentage,
            options: {
                createMipMaps: false,
                samples: this.samples,
                types,
                formats,
                useSRGBBuffers,
                labels,
            },
        });

        const handles: FrameGraphTextureHandle[] = [];
        for (let i = 0; i < this.textureDescriptions.length; i++) {
            handles.push(baseHandle + i);
        }

        return handles;
    }

    private _checkDepthTextureCompatibility(): boolean {
        let depthEnabled = false;

        if (this.depthTexture !== undefined) {
            if (this.depthTexture === backbufferDepthStencilTextureHandle) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth/stencil back buffer is not allowed as a depth texture`);
            }

            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== this.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output texture must have the same number of samples`);
            }

            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);

            depthEnabled = true;
        }

        return depthEnabled;
    }

    private _buildClearAttachmentsLayout() {
        const clearAttachmentsLayout = new Map<GeometryRenderingTextureClearType, boolean[]>();
        const allAttachmentsLayout: boolean[] = [];

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            let layout = clearAttachmentsLayout.get(geometryDescription.clearType);
            if (layout === undefined) {
                layout = [];
                clearAttachmentsLayout.set(geometryDescription.clearType, layout);
                for (let j = 0; j < i; j++) {
                    layout[j] = false;
                }
            }

            clearAttachmentsLayout.forEach((layout, clearType) => {
                layout.push(clearType === geometryDescription.clearType);
            });

            allAttachmentsLayout.push(true);
        }

        this._clearAttachmentsLayout = new Map();

        clearAttachmentsLayout.forEach((layout, clearType) => {
            this._clearAttachmentsLayout.set(clearType, this._engine.buildTextureLayout(layout));
        });

        this._allAttachmentsLayout = this._engine.buildTextureLayout(allAttachmentsLayout);
    }

    private _registerForRenderPassId(renderPassId: number) {
        const configuration = MaterialHelperGeometryRendering.CreateConfiguration(renderPassId);

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            configuration.defines[geometryDescription.defineIndex] = i;
        }
    }
}
