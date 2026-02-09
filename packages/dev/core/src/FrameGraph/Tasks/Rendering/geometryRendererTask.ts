import type { FrameGraphTextureHandle, Scene, FrameGraph, AbstractMesh, ObjectRendererOptions, FrameGraphRenderContext, FrameGraphRenderPass, ObjectRenderer } from "core/index";
import { Color4 } from "core/Maths/math.color";
import { MaterialHelperGeometryRendering, GeometryRenderingTextureClearType } from "core/Materials/materialHelper.geometryrendering";
import { Constants } from "core/Engines/constants";
import { FrameGraphObjectRendererTask } from "./objectRendererTask";

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

const ClearColors: Color4[] = [new Color4(0, 0, 0, 0), new Color4(1, 1, 1, 1), new Color4(0, 0, 0, 0)];

/**
 * Task used to render geometry to a set of textures.
 */
export class FrameGraphGeometryRendererTask extends FrameGraphObjectRendererTask {
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

    private _reverseCulling = false;

    /**
     * Whether to reverse culling (default is false).
     */
    public get reverseCulling() {
        return this._reverseCulling;
    }

    public set reverseCulling(value: boolean) {
        this._reverseCulling = value;

        const configuration = MaterialHelperGeometryRendering.GetConfiguration(this._renderer.renderPassId);
        if (configuration) {
            configuration.reverseCulling = value;
        }
    }

    /**
     * Indicates if a mesh shouldn't be rendered when its material has depth write disabled (default is true).
     */
    public dontRenderWhenMaterialDepthWriteIsDisabled = true;

    private _disableDepthPrePass = true;
    /**
     * Indicates whether the depth pre-pass is disabled (default is true).
     * Materials that require depth pre-pass (Material.needDepthPrePass == true) don't work with the geometry renderer, that's why this setting is true by default.
     * However, if the geometry renderer doesn't generate any geometry textures but only renders to the main target texture, then depth pre-pass can be enabled.
     */
    public get disableDepthPrePass() {
        return this._disableDepthPrePass;
    }

    public set disableDepthPrePass(value: boolean) {
        this._disableDepthPrePass = value;
        this._renderer.disableDepthPrePass = value;
    }

    /**
     * The list of texture descriptions used by the geometry renderer task.
     */
    public textureDescriptions: IFrameGraphGeometryRendererTextureDescription[] = [];

    /**
     * The depth (in view space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     */
    public readonly geometryViewDepthTexture: FrameGraphTextureHandle;

    /**
     * The normalized depth (in view space) output texture. Will point to a valid texture only if that texture has been requested in textureDescriptions!
     * The normalization is (d - near) / (far - near), where d is the depth value in view space and near and far are the near and far planes of the camera.
     */
    public readonly geometryNormViewDepthTexture: FrameGraphTextureHandle;

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

    private _clearAttachmentsLayout: Map<GeometryRenderingTextureClearType, number[]>;
    private _allAttachmentsLayout: number[];

    /**
     * Constructs a new geometry renderer task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param scene The scene the frame graph is associated with.
     * @param options The options of the object renderer.
     * @param existingObjectRenderer An existing object renderer to use (optional). If provided, the options parameter will be ignored.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: ObjectRendererOptions, existingObjectRenderer?: ObjectRenderer) {
        super(name, frameGraph, scene, options, existingObjectRenderer);

        this.renderSprites = false;
        this.renderParticles = false;
        this.enableBoundingBoxRendering = false;
        this.enableOutlineRendering = false;
        this._renderer.disableDepthPrePass = true;

        this._renderer.customIsReadyFunction = (mesh: AbstractMesh, refreshRate: number, preWarm?: boolean) => {
            if (this.dontRenderWhenMaterialDepthWriteIsDisabled && mesh.material && mesh.material.disableDepthWrite) {
                return !!preWarm;
            }

            return mesh.isReady(refreshRate === 0);
        };

        this._renderer.onBeforeRenderingManagerRenderObservable.add(() => {
            if (!this._renderer.options.doNotChangeAspectRatio) {
                scene.updateTransformMatrix(true);
            }
        });

        this._clearAttachmentsLayout = new Map();
        this._allAttachmentsLayout = [];

        this.geometryViewDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.geometryNormViewDepthTexture = this._frameGraph.textureManager.createDanglingHandle();
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

    /**
     * Excludes the given skinned mesh from computing bones velocities.
     * Computing bones velocities can have a cost. The cost can be saved by calling this function and by passing the skinned mesh to ignore.
     * @param skinnedMesh The mesh containing the skeleton to ignore when computing the velocity map.
     */
    public excludeSkinnedMeshFromVelocityTexture(skinnedMesh: AbstractMesh): void {
        if (skinnedMesh.skeleton) {
            const list = this.excludedSkinnedMeshFromVelocityTexture;
            if (list.indexOf(skinnedMesh) === -1) {
                list.push(skinnedMesh);
            }
        }
    }

    /**
     * Removes the given skinned mesh from the excluded meshes to integrate bones velocities while rendering the velocity map.
     * @param skinnedMesh The mesh containing the skeleton that has been ignored previously.
     * @see excludeSkinnedMesh to exclude a skinned mesh from bones velocity computation.
     */
    public removeExcludedSkinnedMeshFromVelocityTexture(skinnedMesh: AbstractMesh): void {
        const list = this.excludedSkinnedMeshFromVelocityTexture;
        const index = list.indexOf(skinnedMesh);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }

    public override getClassName(): string {
        return "FrameGraphGeometryRendererTask";
    }

    public override record(skipCreationOfDisabledPasses = false, additionalExecute?: (context: FrameGraphRenderContext) => void): FrameGraphRenderPass {
        this._buildClearAttachmentsLayout();

        this._registerForRenderPassId(this._renderer.renderPassId);

        MaterialHelperGeometryRendering.MarkAsDirty(this._renderer.renderPassId, this.objectList.meshes || this._scene.meshes);

        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute) as FrameGraphRenderPass;

        const outputTextureHandles = pass.renderTarget as FrameGraphTextureHandle[];

        let needPreviousWorldMatrices = false;

        for (let i = 0; i < this.textureDescriptions.length; i++) {
            const description = this.textureDescriptions[i];
            const handle = outputTextureHandles[i];
            const index = MaterialHelperGeometryRendering.GeometryTextureDescriptions.findIndex((f) => f.type === description.type);
            const geometryDescription = MaterialHelperGeometryRendering.GeometryTextureDescriptions[index];

            switch (geometryDescription.type) {
                case Constants.PREPASS_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryViewDepthTexture, handle);
                    break;
                case Constants.PREPASS_NORMALIZED_VIEW_DEPTH_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryNormViewDepthTexture, handle);
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
                    needPreviousWorldMatrices = true;
                    break;
                case Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE:
                    this._frameGraph.textureManager.resolveDanglingHandle(this.geometryLinearVelocityTexture, handle);
                    needPreviousWorldMatrices = true;
                    break;
            }
        }

        this._scene.needsPreviousWorldMatrices = needPreviousWorldMatrices;

        return pass;
    }

    public override dispose(): void {
        MaterialHelperGeometryRendering.DeleteConfiguration(this._renderer.renderPassId);
        this._renderer.dispose();
        super.dispose();
    }

    protected override _resolveDanglingHandles(_targetTextures: FrameGraphTextureHandle[]) {
        if (this.targetTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, Array.isArray(this.targetTexture) ? this.targetTexture[0] : this.targetTexture);
        }

        if (this.depthTexture !== undefined) {
            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);
        }
    }

    protected override _checkParameters() {
        if (this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphGeometryRendererTask ${this.name}: object list and camera must be provided`);
        }
    }

    protected override _checkTextureCompatibility(targetTextures: FrameGraphTextureHandle[]): boolean {
        let depthEnabled = false;

        let dimensions: { width: number; height: number } | null = null;

        if (this.targetTexture !== undefined) {
            const outputTextureDescription = this._frameGraph.textureManager.getTextureDescription(Array.isArray(this.targetTexture) ? this.targetTexture[0] : this.targetTexture);
            if (this.samples !== outputTextureDescription.options.samples) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the target texture and the output geometry textures  must have the same number of samples`);
            }
            dimensions = outputTextureDescription.size;
        }

        if (this.depthTexture !== undefined) {
            const depthTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.depthTexture);
            if (depthTextureDescription.options.samples !== this.samples && this.textureDescriptions.length > 0) {
                throw new Error(`FrameGraphGeometryRendererTask ${this.name}: the depth texture and the output geometry textures must have the same number of samples`);
            }

            this._frameGraph.textureManager.resolveDanglingHandle(this.outputDepthTexture, this.depthTexture);

            depthEnabled = true;
            dimensions = depthTextureDescription.size;
        }

        const geomTextureDimensions = this.sizeIsPercentage ? this._frameGraph.textureManager.getAbsoluteDimensions(this.size) : this.size;
        if (dimensions !== null) {
            if (geomTextureDimensions.width !== dimensions.width || geomTextureDimensions.height !== dimensions.height) {
                throw new Error(
                    `FrameGraphGeometryRendererTask ${this.name}: the geometry textures (size: ${geomTextureDimensions.width}x${geomTextureDimensions.height}) and the target/depth texture (size: ${dimensions.width}x${dimensions.height}) must have the same dimensions.`
                );
            }
        }

        depthEnabled = depthEnabled || super._checkTextureCompatibility(targetTextures);

        return depthEnabled;
    }

    protected override _getTargetHandles(): FrameGraphTextureHandle[] {
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

        const handles: FrameGraphTextureHandle[] = [];

        if (this.textureDescriptions.length > 0) {
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

            for (let i = 0; i < this.textureDescriptions.length; i++) {
                handles.push(baseHandle + i);
            }
        }

        if (this.targetTexture !== undefined) {
            if (Array.isArray(this.targetTexture)) {
                handles.push(...this.targetTexture);
            } else {
                handles.push(this.targetTexture);
            }
        }

        return handles;
    }

    protected override _prepareRendering(context: FrameGraphRenderContext, depthEnabled: boolean) {
        context.setDepthStates(this.depthTest && depthEnabled, this.depthWrite && depthEnabled);

        context.pushDebugGroup(`Clear attachments`);

        this._clearAttachmentsLayout.forEach((layout, clearType) => {
            context.clearColorAttachments(ClearColors[clearType], layout);
        });

        context.restoreDefaultFramebuffer();
        context.popDebugGroup();

        return this._allAttachmentsLayout;
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

        if (this.targetTexture !== undefined) {
            // We don't clear the target texture, but we need to add a layout for it in clearAttachmentsLayout to be able to use clearColorAttachments with the correct number of attachments in _prepareRendering.
            // We also need to add a value in allAttachmentsLayout for the target texture.
            let layout = clearAttachmentsLayout.get(GeometryRenderingTextureClearType.Zero);
            if (layout === undefined) {
                layout = [];
                clearAttachmentsLayout.set(GeometryRenderingTextureClearType.Zero, layout);
                for (let j = 0; j < this.textureDescriptions.length - 1; j++) {
                    layout[j] = false;
                }
            }

            clearAttachmentsLayout.forEach((layout) => {
                layout.push(false);
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

        if (this.targetTexture !== undefined) {
            configuration.defines["PREPASS_COLOR_INDEX"] = this.textureDescriptions.length;
        }

        configuration.reverseCulling = this.reverseCulling;
    }
}
