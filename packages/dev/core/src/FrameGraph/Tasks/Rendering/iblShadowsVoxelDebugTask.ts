import type { DrawWrapper, FrameGraph, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { Vector4 } from "core/Maths/math.vector";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { FrameGraphTask } from "../../frameGraphTask";
import "../../../Shaders/iblVoxelGrid3dDebug.fragment";
import "../../../ShadersWGSL/iblVoxelGrid3dDebug.fragment";

/**
 * Task used to render a debug view of the IBL shadows voxel grid.
 */
export class FrameGraphIblShadowsVoxelDebugTask extends FrameGraphTask {
    /**
     * Voxel grid texture to visualize.
     */
    public voxelTexture?: FrameGraphTextureHandle;

    /**
     * Slab texture used by the debug shader.
     */
    public voxelSlabTexture?: FrameGraphTextureHandle;

    /**
     * Target texture where debug output is rendered.
     */
    public targetTexture?: FrameGraphTextureHandle;

    /**
     * Display parameters used by the debug shader.
     */
    public readonly sizeParams = new Vector4(0.0, 0.0, 1.0, 1.0);

    /**
     * Mip level displayed in the debug view.
     */
    public mipNumber = 0;

    /**
     * Output texture handle.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * Fullscreen post-process used by this task.
     */
    public readonly postProcess: ThinCustomPostProcess;

    protected readonly _postProcessDrawWrapper: DrawWrapper;

    /**
     * Constructs a new voxel debug task.
     * @param name The task name.
     * @param frameGraph The frame graph this task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.postProcess = new ThinCustomPostProcess(name, frameGraph.engine, {
            fragmentShader: "iblVoxelGrid3dDebug",
            uniforms: ["sizeParams", "mipNumber"],
            samplers: ["voxelTexture", "voxelSlabTexture"],
            shaderLanguage: frameGraph.engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    /**
     * Gets the class name.
     * @returns The class name.
     */
    public override getClassName(): string {
        return "FrameGraphIblShadowsVoxelDebugTask";
    }

    /**
     * Checks if the task is ready.
     * @returns True if ready.
     */
    public override isReady(): boolean {
        return this.voxelTexture !== undefined && this.voxelSlabTexture !== undefined && this.targetTexture !== undefined && this.postProcess.isReady();
    }

    /**
     * Sets debug view placement parameters.
     * @param x Screen X offset.
     * @param y Screen Y offset.
     * @param widthScale X scale.
     * @param heightScale Y scale.
     */
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number): void {
        this.sizeParams.set(x, y, widthScale, heightScale);
    }

    /**
     * Records the task passes.
     */
    public override record(): void {
        if (this.voxelTexture === undefined || this.voxelSlabTexture === undefined || this.targetTexture === undefined) {
            throw new Error(`FrameGraphIblShadowsVoxelDebugTask ${this.name}: voxelTexture, voxelSlabTexture and targetTexture are required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

        const pass = this._frameGraph.addRenderPass(this.name);
        pass.addDependencies(this.voxelTexture);
        pass.addDependencies(this.voxelSlabTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.voxelSlabTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "voxelTexture", this.voxelTexture!);
                    context.bindTextureHandle(effect, "voxelSlabTexture", this.voxelSlabTexture!);
                    effect.setVector4("sizeParams", this.sizeParams);
                    effect.setFloat("mipNumber", this.mipNumber);

                    this.postProcess.bind();
                },
                undefined,
                false,
                false,
                true
            );
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }

    /**
     * Disposes task resources.
     */
    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
