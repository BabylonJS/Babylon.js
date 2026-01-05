import type { AbstractEngine, Camera, EffectWrapperCreationOptions, FrameGraph, FrameGraphRenderPass, FrameGraphTextureHandle, Nullable } from "core/index";
import { Vector3, Matrix } from "core/Maths/math.vector";
import { Constants } from "core/Engines/constants";
import { ThinPassPostProcess } from "core/PostProcesses/thinPassPostProcess";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * @internal
 */
class VolumetricLightingBlendVolumeThinPostProcess extends ThinPassPostProcess {
    public camera: Camera;

    public outputTextureWidth = 0;

    public outputTextureHeight = 0;

    public extinction = new Vector3(0, 0, 0);

    public enableExtinction = false;

    private _invProjection: Matrix;

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../../../ShadersWGSL/pass.fragment"), import("../../../ShadersWGSL/volumetricLightingBlendVolume.fragment")]));
        } else {
            list.push(Promise.all([import("../../../Shaders/pass.fragment"), import("../../../Shaders/volumetricLightingBlendVolume.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    constructor(name: string, engine: Nullable<AbstractEngine> = null, enableExtinction = false, options?: EffectWrapperCreationOptions) {
        super(name, engine, {
            ...options,
            fragmentShader: "volumetricLightingBlendVolume",
            samplers: ["depthSampler"],
            uniforms: ["invProjection", "outputTextureSize", "extinction"],
            defines: enableExtinction ? ["#define DUAL_SOURCE_BLENDING", "#define USE_EXTINCTION"] : undefined,
        });

        this._invProjection = new Matrix();
        this.alphaMode = enableExtinction ? Constants.ALPHA_DUAL_SRC0_ADD_SRC1xDST : Constants.ALPHA_ADD;
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this.drawWrapper.effect!;

        this._invProjection.copyFrom(this.camera.getProjectionMatrix());
        this._invProjection.invert();

        effect.setMatrix("invProjection", this._invProjection);
        effect.setFloat2("outputTextureSize", this.outputTextureWidth, this.outputTextureHeight);
        effect.setVector3("extinction", this.extinction);
    }
}

/**
 * @internal
 */
export class FrameGraphVolumetricLightingBlendVolumeTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: VolumetricLightingBlendVolumeThinPostProcess;

    public depthTexture: FrameGraphTextureHandle;

    public camera: Camera;

    constructor(name: string, frameGraph: FrameGraph, enableExtinction = false) {
        super(name, frameGraph, new VolumetricLightingBlendVolumeThinPostProcess(name, frameGraph.engine, enableExtinction));
    }

    public override getClassName(): string {
        return "FrameGraphVolumetricLightingBlendVolumeTask";
    }

    public override record(skipCreationOfDisabledPasses = false): FrameGraphRenderPass {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphVolumetricLightingBlendVolumeTask "${this.name}": sourceTexture, depthTexture and camera are required`);
        }

        const pass = super.record(skipCreationOfDisabledPasses, undefined, (context) => {
            this.postProcess.camera = this.camera;
            context.bindTextureHandle(this._postProcessDrawWrapper.effect!, "depthSampler", this.depthTexture);
        });

        pass.addDependencies(this.depthTexture);

        this.postProcess.outputTextureWidth = this._outputWidth;
        this.postProcess.outputTextureHeight = this._outputHeight;

        return pass;
    }
}
