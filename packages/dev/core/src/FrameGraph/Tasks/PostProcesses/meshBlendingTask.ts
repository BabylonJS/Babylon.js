import { Constants } from "../../../Engines/constants";
import { type ThinEngine } from "../../../Engines/thinEngine.pure";
import { type Camera } from "../../../Cameras/camera.pure";
import { type FrameGraph } from "../../frameGraph";
import { type FrameGraphRenderPass } from "../../Passes/renderPass";
import { type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "../../frameGraphTypes";
import {
    type IMeshBlendConfiguration,
    type MeshBlendDebugMode,
    MeshBlendDepthType,
    type MeshBlendQuality,
    type MeshBlendRadiusDefinitions,
    ThinMeshBlendingPostProcess,
} from "../../../PostProcesses/thinMeshBlendingPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

function _Is2DTexture(creationOptions: FrameGraphTextureCreationOptions): boolean {
    return (creationOptions.options.targetTypes?.[0] ?? Constants.TEXTURE_2D) === Constants.TEXTURE_2D;
}

function _GetTextureType(creationOptions: FrameGraphTextureCreationOptions): number {
    return creationOptions.options.types?.[0] ?? Constants.TEXTURETYPE_UNSIGNED_BYTE;
}

function _GetTextureFormat(creationOptions: FrameGraphTextureCreationOptions): number {
    return creationOptions.options.formats?.[0] ?? Constants.TEXTUREFORMAT_RGBA;
}

/**
 * Frame-graph task which visually blends SceneColor across validated contacts between opaque or alpha-tested meshes.
 *
 * This WebGL2 and WebGPU task uses the same effect and configuration as MeshBlendingPostProcess. It does not modify
 * geometry, collision queries, depth, normals, or shadows. All source and geometry textures must have matching
 * physical dimensions and sample counts. Transparent rendering is caller-controlled; overlapping transparent
 * surfaces can make SceneColor inconsistent with the single-layer geometry inputs.
 * @see https://playground.babylonjs.com/?version=preview#O05LI8#2
 */
export class FrameGraphMeshBlendingTask extends FrameGraphPostProcessTask {
    /**
     * The packed R8UI mesh-blending tag texture used to locate seams.
     */
    public meshBlendTagTexture: FrameGraphTextureHandle;

    /**
     * The view-depth or screen-depth texture aligned with the packed tag texture.
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * Optional linear base-color/albedo geometry texture aligned with SceneColor.
     *
     * When omitted, shadow estimation is compiled out.
     */
    public baseColorTexture?: FrameGraphTextureHandle;

    /**
     * The world-space normal geometry texture aligned with SceneColor.
     *
     * FrameGraphGeometryRendererTask outputs unsigned-encoded normals by default.
     */
    public worldNormalTexture: FrameGraphTextureHandle;

    /**
     * Optional user-selected artistic-noise texture.
     */
    public noiseTexture?: FrameGraphTextureHandle;

    /**
     * Camera used to project radii and reconstruct view-space positions.
     */
    public camera: Camera;

    /**
     * The thin post process containing the shared quality variant and blend configuration.
     */
    public override readonly postProcess: ThinMeshBlendingPostProcess;

    /** Gets or sets the compile-time mesh-blending quality variant. */
    public get quality(): MeshBlendQuality {
        return this.postProcess.quality;
    }

    public set quality(value: MeshBlendQuality) {
        this.postProcess.quality = value;
    }

    /** Gets the four configurable radius definitions indexed by packed radius class. */
    public get radiusClasses(): MeshBlendRadiusDefinitions {
        return this.postProcess.radiusClasses;
    }

    /** Gets or sets the contact-slope narrowing factor. A value of 1 disables narrowing. */
    public get slopeFactor(): number {
        return this.postProcess.slopeFactor;
    }

    public set slopeFactor(value: number) {
        this.postProcess.slopeFactor = value;
    }

    /** Gets or sets the representation stored in depthTexture. */
    public get depthType(): MeshBlendDepthType {
        return this.postProcess.depthType;
    }

    public set depthType(value: MeshBlendDepthType) {
        this.postProcess.depthType = value;
    }

    /** Gets or sets whether worldNormalTexture stores components encoded from [-1, 1] to [0, 1]. */
    public get worldNormalTextureIsUnsigned(): boolean {
        return this.postProcess.worldNormalTextureIsUnsigned;
    }

    public set worldNormalTextureIsUnsigned(value: boolean) {
        this.postProcess.worldNormalTextureIsUnsigned = value;
    }

    /** Gets or sets the artistic-noise strength. A value of 0 skips artistic-noise sampling. */
    public get noiseFactor(): number {
        return this.postProcess.noiseFactor;
    }

    public set noiseFactor(value: number) {
        this.postProcess.noiseFactor = value;
    }

    /** Gets or sets how strongly artistic noise fades toward the exact seam. */
    public get noiseFade(): number {
        return this.postProcess.noiseFade;
    }

    public set noiseFade(value: number) {
        this.postProcess.noiseFade = value;
    }

    /** Gets or sets the artistic-noise bias. */
    public get noiseOffset(): number {
        return this.postProcess.noiseOffset;
    }

    public set noiseOffset(value: number) {
        this.postProcess.noiseOffset = value;
    }

    /** Gets or sets the number of artistic-noise tiles across the selected radius class. */
    public get noiseTileSize(): number {
        return this.postProcess.noiseTileSize;
    }

    public set noiseTileSize(value: number) {
        this.postProcess.noiseTileSize = value;
    }

    /** Gets or sets the compiled debug visualization. */
    public get debugMode(): MeshBlendDebugMode {
        return this.postProcess.debugMode;
    }

    public set debugMode(value: MeshBlendDebugMode) {
        this.postProcess.debugMode = value;
    }

    /**
     * Constructs a mesh-blending task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param thinPostProcess The thin post process to use. A new one is created when omitted.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinMeshBlendingPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinMeshBlendingPostProcess(name, frameGraph.engine));
        this.sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        this.worldNormalTextureIsUnsigned = true;
    }

    /**
     * Applies the same configuration accepted by the classic MeshBlendingPostProcess wrapper.
     * @param options Values to apply. Omitted values retain their current settings.
     */
    public configure(options?: IMeshBlendConfiguration): void {
        this.postProcess.configure(options);
    }

    public override getClassName(): string {
        return "FrameGraphMeshBlendingTask";
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        this.sourceSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;

        if (
            this.sourceTexture === undefined ||
            this.meshBlendTagTexture === undefined ||
            this.depthTexture === undefined ||
            this.worldNormalTexture === undefined ||
            this.camera === undefined
        ) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture, worldNormalTexture and camera are required`);
        }

        const engine = this._frameGraph.engine as ThinEngine;
        if (!engine.isWebGPU && engine.webGLVersion !== 2) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": mesh blending requires WebGL2 or WebGPU`);
        }
        if (this.depthType !== MeshBlendDepthType.View && this.depthType !== MeshBlendDepthType.Screen) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": depthType must be View or Screen`);
        }

        const meshBlendTagCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.meshBlendTagTexture);
        const meshBlendTagType = _GetTextureType(meshBlendTagCreationOptions);
        const meshBlendTagFormat = _GetTextureFormat(meshBlendTagCreationOptions);
        const meshBlendTagSamples = meshBlendTagCreationOptions.options.samples ?? 1;

        if (meshBlendTagType !== Constants.TEXTURETYPE_UNSIGNED_BYTE || meshBlendTagFormat !== Constants.TEXTUREFORMAT_RED_INTEGER) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": meshBlendTagTexture must use TEXTURETYPE_UNSIGNED_BYTE with TEXTUREFORMAT_RED_INTEGER`);
        }
        if (!_Is2DTexture(meshBlendTagCreationOptions)) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": meshBlendTagTexture must be a 2D texture`);
        }
        if (meshBlendTagSamples !== 1) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": meshBlendTagTexture must be single-sampled`);
        }
        if (meshBlendTagCreationOptions.options.createMipMaps) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": meshBlendTagTexture must not use mipmaps`);
        }

        const depthCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.depthTexture);
        const depthType = _GetTextureType(depthCreationOptions);
        const depthFormat = _GetTextureFormat(depthCreationOptions);
        const depthSamples = depthCreationOptions.options.samples ?? 1;
        const validDepthFormat = depthFormat === Constants.TEXTUREFORMAT_RED || depthFormat === Constants.TEXTUREFORMAT_RG || depthFormat === Constants.TEXTUREFORMAT_RGBA;
        const validDepthType =
            depthType === Constants.TEXTURETYPE_FLOAT ||
            depthType === Constants.TEXTURETYPE_HALF_FLOAT ||
            (this.depthType === MeshBlendDepthType.Screen && depthType === Constants.TEXTURETYPE_UNSIGNED_BYTE);

        if (!validDepthFormat || !validDepthType) {
            throw new Error(
                `FrameGraphMeshBlendingTask "${this.name}": ${this.depthType === MeshBlendDepthType.View ? "view" : "screen"} depthTexture has an incompatible type or format`
            );
        }
        if (!_Is2DTexture(depthCreationOptions)) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": depthTexture must be a 2D texture`);
        }
        if (depthSamples !== 1) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": depthTexture must be single-sampled`);
        }
        if (depthCreationOptions.options.createMipMaps) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": depthTexture must not use mipmaps`);
        }

        let baseColorSamples: number | undefined;
        if (this.baseColorTexture !== undefined) {
            const baseColorCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.baseColorTexture);
            const baseColorType = _GetTextureType(baseColorCreationOptions);
            const baseColorFormat = _GetTextureFormat(baseColorCreationOptions);
            baseColorSamples = baseColorCreationOptions.options.samples ?? 1;
            const validBaseColorFormat = baseColorFormat === Constants.TEXTUREFORMAT_RGB || baseColorFormat === Constants.TEXTUREFORMAT_RGBA;
            const validBaseColorType =
                baseColorType === Constants.TEXTURETYPE_UNSIGNED_BYTE || baseColorType === Constants.TEXTURETYPE_HALF_FLOAT || baseColorType === Constants.TEXTURETYPE_FLOAT;
            if (!validBaseColorFormat || !validBaseColorType) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": baseColorTexture must use a non-integer RGB or RGBA color format`);
            }
            if (!_Is2DTexture(baseColorCreationOptions)) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": baseColorTexture must be a 2D texture`);
            }
            if (baseColorCreationOptions.options.createMipMaps) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": baseColorTexture must not use mipmaps`);
            }
        }

        const worldNormalCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.worldNormalTexture);
        const worldNormalType = _GetTextureType(worldNormalCreationOptions);
        const worldNormalFormat = _GetTextureFormat(worldNormalCreationOptions);
        const worldNormalSamples = worldNormalCreationOptions.options.samples ?? 1;
        const validWorldNormalFormat = worldNormalFormat === Constants.TEXTUREFORMAT_RGB || worldNormalFormat === Constants.TEXTUREFORMAT_RGBA;
        const validWorldNormalType =
            worldNormalType === Constants.TEXTURETYPE_UNSIGNED_BYTE ||
            worldNormalType === Constants.TEXTURETYPE_HALF_FLOAT ||
            worldNormalType === Constants.TEXTURETYPE_FLOAT ||
            worldNormalType === Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV ||
            worldNormalType === Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV;
        if (!validWorldNormalFormat || !validWorldNormalType) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": worldNormalTexture must use a non-integer RGB or RGBA color format`);
        }
        if (!_Is2DTexture(worldNormalCreationOptions)) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": worldNormalTexture must be a 2D texture`);
        }
        if (worldNormalCreationOptions.options.createMipMaps) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": worldNormalTexture must not use mipmaps`);
        }

        const sourceCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);
        const sourceType = _GetTextureType(sourceCreationOptions);
        const sourceFormat = _GetTextureFormat(sourceCreationOptions);
        const sourceSamples = sourceCreationOptions.options.samples ?? 1;
        const validSourceFormat = sourceFormat === Constants.TEXTUREFORMAT_RGB || sourceFormat === Constants.TEXTUREFORMAT_RGBA;
        const validSourceType = sourceType === Constants.TEXTURETYPE_UNSIGNED_BYTE || sourceType === Constants.TEXTURETYPE_HALF_FLOAT || sourceType === Constants.TEXTURETYPE_FLOAT;
        if (!validSourceFormat || !validSourceType) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": sourceTexture must use a non-integer RGB or RGBA color format`);
        }
        if (!_Is2DTexture(sourceCreationOptions)) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": sourceTexture must be a 2D texture`);
        }
        if (
            sourceSamples !== meshBlendTagSamples ||
            sourceSamples !== depthSamples ||
            (baseColorSamples !== undefined && sourceSamples !== baseColorSamples) ||
            sourceSamples !== worldNormalSamples
        ) {
            throw new Error(
                `FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture, worldNormalTexture and baseColorTexture when provided must have matching sample counts`
            );
        }

        const sourceSize = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture).size;
        const meshBlendTagSize = this._frameGraph.textureManager.getTextureDescription(this.meshBlendTagTexture).size;
        const depthSize = this._frameGraph.textureManager.getTextureDescription(this.depthTexture).size;
        const baseColorSize = this.baseColorTexture === undefined ? undefined : this._frameGraph.textureManager.getTextureDescription(this.baseColorTexture).size;
        const worldNormalSize = this._frameGraph.textureManager.getTextureDescription(this.worldNormalTexture).size;
        if (
            sourceSize.width !== meshBlendTagSize.width ||
            sourceSize.height !== meshBlendTagSize.height ||
            sourceSize.width !== depthSize.width ||
            sourceSize.height !== depthSize.height ||
            (baseColorSize !== undefined && (sourceSize.width !== baseColorSize.width || sourceSize.height !== baseColorSize.height)) ||
            sourceSize.width !== worldNormalSize.width ||
            sourceSize.height !== worldNormalSize.height
        ) {
            throw new Error(
                `FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture, worldNormalTexture and baseColorTexture when provided must have matching dimensions`
            );
        }

        if (this.targetTexture !== undefined) {
            const targetCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.targetTexture);
            const targetType = _GetTextureType(targetCreationOptions);
            const targetFormat = _GetTextureFormat(targetCreationOptions);
            const targetSamples = targetCreationOptions.options.samples ?? 1;
            const validTargetFormat = targetFormat === Constants.TEXTUREFORMAT_RGB || targetFormat === Constants.TEXTUREFORMAT_RGBA;
            const validTargetType =
                targetType === Constants.TEXTURETYPE_UNSIGNED_BYTE || targetType === Constants.TEXTURETYPE_HALF_FLOAT || targetType === Constants.TEXTURETYPE_FLOAT;
            if (!validTargetFormat || !validTargetType) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": targetTexture must use a non-integer RGB or RGBA color format`);
            }
            if (!_Is2DTexture(targetCreationOptions)) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": targetTexture must be a 2D texture`);
            }
            if (targetSamples !== sourceSamples) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": targetTexture and sourceTexture must have matching sample counts`);
            }

            const targetSize = this._frameGraph.textureManager.getTextureDescription(this.targetTexture).size;
            if (targetSize.width !== sourceSize.width || targetSize.height !== sourceSize.height) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": targetTexture and sourceTexture must have matching dimensions`);
            }
        }

        let noiseSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        if (this.noiseTexture !== undefined) {
            const noiseCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.noiseTexture);
            const noiseType = _GetTextureType(noiseCreationOptions);
            const noiseFormat = _GetTextureFormat(noiseCreationOptions);
            const noiseSamples = noiseCreationOptions.options.samples ?? 1;
            const validNoiseFormat =
                noiseFormat === Constants.TEXTUREFORMAT_RED ||
                noiseFormat === Constants.TEXTUREFORMAT_RG ||
                noiseFormat === Constants.TEXTUREFORMAT_RGB ||
                noiseFormat === Constants.TEXTUREFORMAT_RGBA;
            const validNoiseType = noiseType === Constants.TEXTURETYPE_UNSIGNED_BYTE || noiseType === Constants.TEXTURETYPE_HALF_FLOAT || noiseType === Constants.TEXTURETYPE_FLOAT;
            if (!validNoiseFormat || !validNoiseType) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": noiseTexture must be a non-integer 2D color texture`);
            }
            if (!_Is2DTexture(noiseCreationOptions)) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": noiseTexture must be a 2D texture`);
            }
            if (noiseSamples !== 1) {
                throw new Error(`FrameGraphMeshBlendingTask "${this.name}": noiseTexture must be single-sampled`);
            }
            if (
                (noiseType === Constants.TEXTURETYPE_FLOAT && !engine.getCaps().textureFloatLinearFiltering) ||
                (noiseType === Constants.TEXTURETYPE_HALF_FLOAT && !engine.getCaps().textureHalfFloatLinearFiltering)
            ) {
                noiseSamplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            }
        }

        this.postProcess.camera = this.camera;
        this.postProcess.hasBaseColorTexture = this.baseColorTexture !== undefined;
        this.postProcess._hasExternalNoiseTexture = this.noiseTexture !== undefined;

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.meshBlendTagTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                context.setTextureSamplingMode(this.depthTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                context.setTextureSamplingMode(this.worldNormalTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                if (this.baseColorTexture !== undefined) {
                    context.setTextureSamplingMode(this.baseColorTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                }
                if (this.noiseTexture !== undefined) {
                    context.setTextureSamplingMode(this.noiseTexture, noiseSamplingMode);
                }
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendTagSampler", this.meshBlendTagTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendDepthSampler", this.depthTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendWorldNormalSampler", this.worldNormalTexture);
                if (this.baseColorTexture !== undefined) {
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendBaseColorSampler", this.baseColorTexture);
                }
                if (this.noiseTexture !== undefined) {
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendArtisticNoiseSampler", this.noiseTexture);
                }
            }
        );

        pass.addDependencies([this.meshBlendTagTexture, this.depthTexture, this.worldNormalTexture]);
        if (this.baseColorTexture !== undefined) {
            pass.addDependencies(this.baseColorTexture);
        }
        if (this.noiseTexture !== undefined) {
            pass.addDependencies(this.noiseTexture);
        }

        return pass;
    }
}
