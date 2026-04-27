import { type DrawWrapper, type FrameGraph, type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { type FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import { Vector4 } from "core/Maths/math.vector";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { FrameGraphTask } from "../../../frameGraphTask";

/**
 * Task used to spatially blur IBL shadows.
 * @internal
 */
export class FrameGraphIblShadowsSpatialBlurTask extends FrameGraphTask {
    public sourceTexture?: FrameGraphTextureHandle;
    public depthTexture?: FrameGraphTextureHandle;
    public normalTexture?: FrameGraphTextureHandle;

    /** Voxelization task providing the dynamic voxelGridSize used as worldScale. */
    public voxelizationTask?: FrameGraphIblShadowsVoxelizationTask;

    public readonly outputTexture: FrameGraphTextureHandle;

    public readonly postProcess: ThinCustomPostProcess;
    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected readonly _blurParameters = new Vector4(0, 0, 0, 0);

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.postProcess = new ThinCustomPostProcess(name, frameGraph.engine, {
            fragmentShader: "iblShadowSpatialBlur",
            uniforms: ["blurParameters"],
            samplers: ["voxelTracingSampler", "depthSampler", "worldNormalSampler"],
            shaderLanguage: frameGraph.engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override getClassName(): string {
        return "FrameGraphIblShadowsSpatialBlurTask";
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public override initAsync(): Promise<unknown> {
        if (this._frameGraph.engine.isWebGPU) {
            return import("../../../../ShadersWGSL/iblShadowSpatialBlur.fragment");
        }

        return import("../../../../Shaders/iblShadowSpatialBlur.fragment");
    }

    public override isReady(): boolean {
        return this.postProcess.isReady();
    }

    public override record() {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.normalTexture === undefined) {
            throw new Error(`FrameGraphIblShadowsSpatialBlurTask ${this.name}: sourceTexture, depthTexture and normalTexture are required`);
        }

        const textureManager = this._frameGraph.textureManager;
        const size = textureManager.getTextureAbsoluteDimensions(this.sourceTexture);
        const creationOptions: FrameGraphTextureCreationOptions = {
            size,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [`${this.name} Output`],
            },
        };

        textureManager.resolveDanglingHandle(this.outputTexture, undefined, `${this.name} Output`, creationOptions);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);
        pass.addDependencies(this.depthTexture);
        pass.addDependencies(this.normalTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.depthTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.normalTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

            const iterationCount = 1;
            this._blurParameters.set(iterationCount, this.voxelizationTask?.voxelGridSize ?? 1.0, 0.0, 0.0);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "voxelTracingSampler", this.sourceTexture!);
                    context.bindTextureHandle(effect, "depthSampler", this.depthTexture!);
                    context.bindTextureHandle(effect, "worldNormalSampler", this.normalTexture!);
                    effect.setVector4("blurParameters", this._blurParameters);

                    this.postProcess.bind();
                },
                undefined,
                false,
                false,
                true
            );
        });
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
