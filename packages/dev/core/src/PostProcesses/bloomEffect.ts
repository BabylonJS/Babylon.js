import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { PostProcess } from "./postProcess";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess";
import { BlurPostProcess } from "./blurPostProcess";
import { BloomMergePostProcess } from "./bloomMergePostProcess";
import { Vector2 } from "../Maths/math.vector";
import type { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Observable } from "../Misc/observable";
import type { FrameGraphTaskTexture, IFrameGraphInputData, IFrameGraphTask } from "../FrameGraph/Tasks/IFrameGraphTask";
import type { FrameGraph } from "../FrameGraph/frameGraph";
import type { TextureHandle } from "../FrameGraph/frameGraphTextureManager";
import { Constants } from "../Engines/constants";

/**
 * Interface for the bloom effect build data
 */
export interface IFrameGraphBloomEffectInputData extends IFrameGraphInputData {
    /**
     * The source texture for the bloom effect
     */
    sourceTexture: FrameGraphTaskTexture | TextureHandle;
    sourceSamplingMode?: number;
    outputTexture?: FrameGraphTaskTexture | TextureHandle;
}

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect implements IFrameGraphTask {
    public name = "Bloom";

    public disabledFromGraph = false;

    public onBeforeTaskRecordFrameGraphObservable = new Observable<FrameGraph>();

    public onAfterTaskRecordFrameGraphObservable = new Observable<FrameGraph>();

    /**
     * @internal Internal
     */
    public _effects: Array<PostProcess> = [];

    /**
     * @internal Internal
     */
    public _downscale: ExtractHighlightsPostProcess;

    private _blurX: BlurPostProcess;
    private _blurY: BlurPostProcess;
    private _merge: BloomMergePostProcess;

    private _pipelineTextureType: number;

    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    public get threshold(): number {
        return this._downscale.threshold;
    }
    public set threshold(value: number) {
        this._downscale.threshold = value;
    }

    /**
     * The strength of the bloom.
     */
    public get weight(): number {
        return this._merge.weight;
    }
    public set weight(value: number) {
        this._merge.weight = value;
    }

    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    public get kernel(): number {
        return this._blurX.kernel / this._bloomScale;
    }
    public set kernel(value: number) {
        this._blurX.kernel = value * this._bloomScale;
        this._blurY.kernel = value * this._bloomScale;
    }

    /**
     * Creates a new instance of @see BloomEffect
     * @param sceneOrEngine The scene or engine the effect belongs to.
     * @param _bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param bloomWeight The strength of bloom.
     * @param bloomKernel The size of the kernel to be used when applying the blur.
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        sceneOrEngine: Scene | AbstractEngine,
        private _bloomScale: number,
        bloomWeight: number,
        bloomKernel: number,
        pipelineTextureType = 0,
        blockCompilation = false
    ) {
        const engine = (sceneOrEngine as Scene)._renderForCamera ? (sceneOrEngine as Scene).getEngine() : (sceneOrEngine as AbstractEngine);
        super(
            engine,
            "bloom",
            () => {
                return this._effects;
            },
            true
        );

        this._pipelineTextureType = pipelineTextureType;

        this._downscale = new ExtractHighlightsPostProcess("highlights", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, pipelineTextureType, blockCompilation);

        this._blurX = new BlurPostProcess(
            "horizontal blur",
            new Vector2(1.0, 0),
            10.0,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            undefined,
            blockCompilation
        );
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;

        this._blurY = new BlurPostProcess(
            "vertical blur",
            new Vector2(0, 1.0),
            10.0,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            undefined,
            blockCompilation
        );
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;

        this.kernel = bloomKernel;

        this._effects = [this._downscale, this._blurX, this._blurY];

        this._merge = new BloomMergePostProcess(
            "bloomMerge",
            this._downscale,
            this._blurY,
            bloomWeight,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            blockCompilation
        );
        this._merge.autoClear = false;
        this._effects.push(this._merge);
    }

    public isReady() {
        return this._downscale.isReady() && this._blurX.isReady() && this._blurY.isReady() && this._merge.isReady();
    }

    public recordFrameGraph(frameGraph: FrameGraph, inputData: IFrameGraphBloomEffectInputData): void {
        inputData.sourceSamplingMode = inputData.sourceSamplingMode ?? Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

        const sourceTextureDescription = frameGraph.getTextureDescription(inputData.sourceTexture);

        const textureCreationOptions = {
            size: { width: Math.floor(sourceTextureDescription.size.width * this._bloomScale), height: Math.floor(sourceTextureDescription.size.height * this._bloomScale) },
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                type: this._pipelineTextureType,
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                format: sourceTextureDescription.options.format,
                samples: 1,
                useSRGBBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        // We need to set the texture size so that texel size is calculated correctly
        this._blurX.width = textureCreationOptions.size.width;
        this._blurX.height = textureCreationOptions.size.height;
        this._blurY.width = textureCreationOptions.size.width;
        this._blurY.height = textureCreationOptions.size.height;

        textureCreationOptions.options.label = "Bloom Downscale";
        const downscaleTextureHandle = frameGraph.createRenderTargetTexture("downscale", textureCreationOptions);

        this._downscale.recordFrameGraph(frameGraph, {
            sourceTexture: inputData.sourceTexture,
            outputTexture: downscaleTextureHandle,
            skipCreationOfDisabledPasses: true,
        });

        textureCreationOptions.options.label = "Bloom Blur X";
        const blurXTextureHandle = frameGraph.createRenderTargetTexture("blurX", textureCreationOptions);

        this._blurX.recordFrameGraph(frameGraph, {
            sourceTexture: downscaleTextureHandle,
            outputTexture: blurXTextureHandle,
            skipCreationOfDisabledPasses: true,
        });

        textureCreationOptions.options.label = "Bloom Blur Y";
        const blurYTextureHandle = frameGraph.createRenderTargetTexture("blurY", textureCreationOptions);

        this._blurY.recordFrameGraph(frameGraph, {
            sourceTexture: blurXTextureHandle,
            outputTexture: blurYTextureHandle,
            skipCreationOfDisabledPasses: true,
        });

        this._merge.recordFrameGraph(frameGraph, {
            sourceTexture: inputData.sourceTexture,
            sourceSamplingMode: inputData.sourceSamplingMode,
            sourceBlurTexture: blurYTextureHandle,
            outputTexture: inputData.outputTexture,
            skipCreationOfDisabledPasses: true,
        });

        const sourceTextureHandle = frameGraph.getTextureHandle(inputData.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(inputData.outputTexture, "destination", frameGraph.getTextureDescription(inputData.sourceTexture));

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(sourceTextureHandle);
        passDisabled.setExecuteFunc((_context) => {
            if (_context.isBackbufferColor(outputTextureHandle)) {
                _context.copyTexture(_context.getTextureFromHandle(sourceTextureHandle)!.texture!, true);
            }
        });
    }

    /**
     * Disposes each of the internal effects for a given camera.
     * @param camera The camera to dispose the effect on.
     */
    public disposeEffects(camera?: Camera) {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].dispose(camera);
        }
    }

    /**
     * @internal Internal
     */
    public _updateEffects() {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].updateEffect();
        }
    }

    /**
     * Internal
     * @returns if all the contained post processes are ready.
     * @internal
     */
    public _isReady() {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            if (!this._effects[effectIndex].isReady()) {
                return false;
            }
        }
        return true;
    }
}
