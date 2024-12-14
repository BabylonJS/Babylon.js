import type {
    FrameGraph,
    FrameGraphTextureHandle,
    Scene,
    IThinGlowLayerOptions,
    Camera,
    FrameGraphObjectList,
    FrameGraphTextureCreationOptions,
    Effect,
    ThinBlurPostProcess,
    AbstractEngine,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinGlowLayer } from "core/Layers/thinGlowLayer";
import { FrameGraphObjectRendererTask } from "../Rendering/objectRendererTask";
import { FrameGraphClearTextureTask } from "../Texture/clearTextureTask";
import { FrameGraphBlurTask } from "../PostProcesses/blurTask";
import { Constants } from "core/Engines/constants";
import { FrameGraphTextureManager } from "../../frameGraphTextureManager";
import { getDimensionsFromTextureSize } from "../../../Materials/Textures/textureCreationOptions";

/**
 * Task which applies a glowing effect to a texture.
 */
export class FrameGraphGlowLayerTask extends FrameGraphTask {
    /**
     * The destination texture to apply the glow layer to.
     * The glow effect will be blended with the contents of this texture.
     */
    public destinationTexture: FrameGraphTextureHandle;

    /**
     * The layer texture to render the glow layer to.
     * If not provided, a default texture will be created.
     */
    public layerTexture?: FrameGraphTextureHandle;

    private _camera: Camera;
    /**
     * Gets or sets the camera used to render the objects to the glow layer.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this.glowLayer.camera = this.camera;
    }

    /**
     * The list of objects to render to the glow layer.
     */
    public objectList: FrameGraphObjectList;

    /**
     * The output texture of the task (same as destinationTexture, but the handle will be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The glow layer object. Use this object to update the glow layer properties (e.g. intensity, blur kernel size).
     */
    public readonly glowLayer: ThinGlowLayer;

    /**
     * The name of the task.
     */
    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this._blurX) {
            for (let i = 0; i < this._blurX.length; i++) {
                this._blurX[i].name = `${name} Blur X${i}`;
                this._blurY[i].name = `${name} Blur Y${i}`;
            }
        }

        this._clearTask.name = name + " Clear Layer";
        this._objectRendererTask.name = name + " Render to Layer";
    }

    private readonly _engine: AbstractEngine;
    private readonly _clearTask: FrameGraphClearTextureTask;
    private readonly _objectRendererTask: FrameGraphObjectRendererTask;
    private readonly _blurX: FrameGraphBlurTask[] = [];
    private readonly _blurY: FrameGraphBlurTask[] = [];

    /**
     * Constructs a new glow layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the glow layer in.
     * @param options Options for the glow layer.
     */
    constructor(name: string, frameGraph: FrameGraph, scene: Scene, options?: IThinGlowLayerOptions) {
        super(name, frameGraph);

        this._engine = scene.getEngine();

        this.glowLayer = new ThinGlowLayer(name, scene, options, true);

        for (let i = 0; i < 2; i++) {
            this._blurX.push(new FrameGraphBlurTask(`${name} Blur X${i}`, this._frameGraph, this.glowLayer.postProcesses[i * 2 + 0] as ThinBlurPostProcess));
            this._blurY.push(new FrameGraphBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.glowLayer.postProcesses[i * 2 + 1] as ThinBlurPostProcess));
        }

        this._clearTask = new FrameGraphClearTextureTask(name + " Clear Layer", frameGraph);
        this._clearTask.clearColor = true;
        this._clearTask.clearDepth = true;

        this._objectRendererTask = new FrameGraphObjectRendererTask(name + " Render to Layer", frameGraph, scene, undefined, this.glowLayer.objectRenderer);
        this.glowLayer._renderPassId = this._objectRendererTask.objectRenderer.renderPassId;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this._objectRendererTask.isReady() && this.glowLayer.isReady();
    }

    public record() {
        if (this.destinationTexture === undefined || this.objectList === undefined || this.camera === undefined) {
            throw new Error(`FrameGrapGlowLayerTask "${this.name}": destinationTexture, objectList and camera are required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.destinationTexture);

        // Uses the layerTexture or creates a color texture to render the glow layer to
        let textureSize: {
            width: number;
            height: number;
        };
        let textureCreationOptions: FrameGraphTextureCreationOptions;

        let colorLayerOutput: FrameGraphTextureHandle;

        if (this.layerTexture) {
            colorLayerOutput = this.layerTexture;
            textureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.layerTexture);
            textureSize = getDimensionsFromTextureSize(textureCreationOptions.size);
            textureCreationOptions.size = textureSize;
        } else {
            textureSize = { width: 50, height: 50 };
            textureCreationOptions = {
                size: textureSize,
                options: {
                    createMipMaps: false,
                    types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                    formats: [Constants.TEXTUREFORMAT_RGBA],
                    samples: 1,
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                },
                sizeIsPercentage: true,
            };
            colorLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Color`, textureCreationOptions);
        }

        // Creates a depth texture, used to render objects to the glow layer
        const textureDepthCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: FrameGraphTextureManager.CloneTextureOptions(textureCreationOptions.options),
            sizeIsPercentage: textureCreationOptions.sizeIsPercentage,
        };

        textureDepthCreationOptions.options.formats![0] = Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

        const depthLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Depth`, textureDepthCreationOptions);

        // Clears the textures
        this._clearTask.destinationTexture = colorLayerOutput;
        this._clearTask.depthTexture = depthLayerOutput;
        this._clearTask.color = this.glowLayer.neutralColor;
        this._clearTask.record();

        // Renders the objects to the layer texture
        this._objectRendererTask.destinationTexture = this._clearTask.outputTexture;
        this._objectRendererTask.depthTexture = this._clearTask.outputDepthTexture;
        this._objectRendererTask.camera = this.camera;
        this._objectRendererTask.objectList = this.objectList;
        this._objectRendererTask.disableShadows = true;

        this._objectRendererTask.record();

        // Blurs the layer color texture
        let blurTextureType = 0;
        if (this._engine.getCaps().textureHalfFloatRender) {
            blurTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
        } else {
            blurTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        }

        textureCreationOptions.options.types![0] = blurTextureType;

        for (let i = 0; i < this._blurX.length; i++) {
            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);

            this._blurX[i].sourceTexture = i === 0 ? this._objectRendererTask.outputTexture : this._blurY[i - 1].outputTexture;
            this._blurX[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            this._blurX[i].record(true);

            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);

            this._blurY[i].sourceTexture = this._blurX[i].outputTexture;
            this._blurY[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            this._blurY[i].record(true);

            textureSize.width = textureSize.width >> 1;
            textureSize.height = textureSize.height >> 1;
        }

        // Composes the glow layer with the destination texture
        const pass = this._frameGraph.addRenderPass(this.name);

        pass.useTexture(this._blurY[0].outputTexture);
        pass.useTexture(this._blurY[1].outputTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            this.glowLayer.bindTexturesForCompose = (effect: Effect) => {
                context.bindTextureHandle(effect, "textureSampler", this._blurY[0].outputTexture);
                context.setTextureSamplingMode(this._blurY[1].destinationTexture!, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
                context.bindTextureHandle(effect, "textureSampler2", this._blurY[1].outputTexture);
            };

            context._applyRenderTarget();

            this.glowLayer.compose();
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }

    public override dispose(): void {
        this._clearTask.dispose();
        this._objectRendererTask.dispose();
        this.glowLayer.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        super.dispose();
    }
}
