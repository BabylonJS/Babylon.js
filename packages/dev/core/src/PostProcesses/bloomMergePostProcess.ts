import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Nullable } from "../types";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Effect } from "../Materials/effect";
import type { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import type { FrameGraph } from "../FrameGraph/frameGraph";
import type { FrameGraphTaskOutputReference } from "../FrameGraph/Tasks/IFrameGraphTask";
import type { TextureHandle } from "../FrameGraph/frameGraphTextureManager";

/**
 * The BloomMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
 */
export class BloomMergePostProcess extends PostProcess {
    /** Weight of the bloom to be added to the original input. */
    @serialize()
    public weight = 1;

    public sourceBlurTexture?: FrameGraphTaskOutputReference | TextureHandle;

    /**
     * Gets a string identifying the name of the class
     * @returns "BloomMergePostProcess" string
     */
    public override getClassName(): string {
        return "BloomMergePostProcess";
    }

    /**
     * Creates a new instance of @see BloomMergePostProcess
     * @param name The name of the effect.
     * @param originalFromInput Post process which's input will be used for the merge.
     * @param blurred Blurred highlights post process which's output will be used.
     * @param weight Weight of the bloom to be added to the original input.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        originalFromInput: PostProcess,
        blurred: PostProcess,
        weight: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(name, "bloomMerge", {
            uniforms: ["bloomWeight"],
            samplers: ["bloomBlur"],
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation: true,
            ...(options as PostProcessOptions),
        });

        this.weight = weight;
        this.externalTextureSamplerBinding = true;
        if (!this._useAsFrameGraphTask) {
            this.onApplyObservable.add((effect: Effect) => {
                effect.setTextureFromPostProcess("textureSampler", originalFromInput);
                effect.setTextureFromPostProcessOutput("bloomBlur", blurred);
                effect.setFloat("bloomWeight", this.weight);
            });
        }

        if (!blockCompilation) {
            this.updateEffect();
        }
    }

    public override recordFrameGraph(frameGraph: FrameGraph): void {
        if (this.sourceTexture === undefined || this.sourceBlurTexture === undefined) {
            throw new Error(`BloomMergePostProcess "${this.name}": sourceTexture and sourceBlurTexture are required`);
        }

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const sourceBlurTextureHandle = frameGraph.getTextureHandle(this.sourceBlurTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(
            this.destinationTexture,
            `${this.name} Destination`,
            frameGraph.getTextureCreationOptions(this.sourceTexture)
        );

        const pass = frameGraph.addRenderPass(this.name);

        pass.useTexture(sourceTextureHandle);
        pass.useTexture(sourceBlurTextureHandle);
        pass.setRenderTarget(outputTextureHandle);
        pass.setExecuteFunc((context) => {
            context.applyFullScreenEffect(this._drawWrapper, () => {
                this._bind();
                this._drawWrapper.effect!._bindTexture("textureSampler", context.getTextureFromHandle(sourceTextureHandle)!.texture!);
                this._drawWrapper.effect!._bindTexture("bloomBlur", context.getTextureFromHandle(sourceBlurTextureHandle)!.texture!);
                this._drawWrapper.effect!.setFloat("bloomWeight", this.weight);
            });
        });

        if (!this.skipCreationOfDisabledPasses) {
            const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

            passDisabled.setRenderTarget(sourceTextureHandle);
            passDisabled.setExecuteFunc((_context) => {
                if (_context.isBackbufferColor(outputTextureHandle)) {
                    _context.copyTexture(_context.getTextureFromHandle(sourceTextureHandle)!.texture!, true);
                }
            });
        }
    }

    protected override async _initShaderSourceAsync(useWebGPU: boolean) {
        if (useWebGPU) {
            this._webGPUReady = true;
            await import("../ShadersWGSL/bloomMerge.fragment");
        } else {
            await import("../Shaders/bloomMerge.fragment");
        }

        super._initShaderSourceAsync(useWebGPU);
    }
}

RegisterClass("BABYLON.BloomMergePostProcess", BloomMergePostProcess);
