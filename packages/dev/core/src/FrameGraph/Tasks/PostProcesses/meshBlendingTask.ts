import { Constants } from "../../../Engines/constants";
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
import { _IsMeshBlendingSupported } from "../../../Meshes/meshBlendingTag";

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
 * surfaces can make SceneColor inconsistent with the single-layer geometry inputs. On WebGL2, rendering transparent
 * meshes into the integer tag attachment requires per-target blend parameters.
 * @see https://playground.babylonjs.com/?version=preview#O05LI8#6
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

        if (this.sourceTexture === undefined || this.meshBlendTagTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture and camera are required`);
        }

        const engine = this._frameGraph.engine;
        if (!_IsMeshBlendingSupported(engine)) {
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
        if (sourceSamples !== meshBlendTagSamples || sourceSamples !== depthSamples || (baseColorSamples !== undefined && sourceSamples !== baseColorSamples)) {
            throw new Error(
                `FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture and baseColorTexture when provided must have matching sample counts`
            );
        }

        const sourceSize = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture).size;
        const meshBlendTagSize = this._frameGraph.textureManager.getTextureDescription(this.meshBlendTagTexture).size;
        const depthSize = this._frameGraph.textureManager.getTextureDescription(this.depthTexture).size;
        const baseColorSize = this.baseColorTexture === undefined ? undefined : this._frameGraph.textureManager.getTextureDescription(this.baseColorTexture).size;
        if (
            sourceSize.width !== meshBlendTagSize.width ||
            sourceSize.height !== meshBlendTagSize.height ||
            sourceSize.width !== depthSize.width ||
            sourceSize.height !== depthSize.height ||
            (baseColorSize !== undefined && (sourceSize.width !== baseColorSize.width || sourceSize.height !== baseColorSize.height))
        ) {
            throw new Error(
                `FrameGraphMeshBlendingTask "${this.name}": sourceTexture, meshBlendTagTexture, depthTexture and baseColorTexture when provided must have matching dimensions`
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

        this.postProcess.camera = this.camera;
        this.postProcess.hasBaseColorTexture = this.baseColorTexture !== undefined;

        const pass = super.record(
            skipCreationOfDisabledPasses,
            (context) => {
                context.setTextureSamplingMode(this.meshBlendTagTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                context.setTextureSamplingMode(this.depthTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                if (this.baseColorTexture !== undefined) {
                    context.setTextureSamplingMode(this.baseColorTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
                }
            },
            (context) => {
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendTagSampler", this.meshBlendTagTexture);
                context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendDepthSampler", this.depthTexture);
                if (this.baseColorTexture !== undefined) {
                    context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "meshBlendBaseColorSampler", this.baseColorTexture);
                }
            }
        );

        pass.addDependencies([this.meshBlendTagTexture, this.depthTexture]);
        if (this.baseColorTexture !== undefined) {
            pass.addDependencies(this.baseColorTexture);
        }

        return pass;
    }
}
