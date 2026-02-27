import type {
    FrameGraph,
    FrameGraphTextureHandle,
    Scene,
    FrameGraphTextureCreationOptions,
    Effect,
    ThinBlurPostProcess,
    AbstractEngine,
    Nullable,
    Observer,
    RenderingGroupInfo,
    ThinEffectLayer,
    FrameGraphRenderPass,
    FrameGraphRenderContext,
    FrameGraphPass,
    FrameGraphContext,
} from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { FrameGraphObjectRendererTask } from "../Rendering/objectRendererTask";
import { FrameGraphClearTextureTask } from "../Texture/clearTextureTask";
import { FrameGraphBlurTask } from "../PostProcesses/blurTask";
import { Constants } from "core/Engines/constants";
import { FrameGraphTextureManager } from "../../frameGraphTextureManager";
import { getDimensionsFromTextureSize } from "../../../Materials/Textures/textureCreationOptions";
import { FrameGraphPostProcessTask } from "../PostProcesses/postProcessTask";
import { Vector2 } from "core/Maths/math.vector";
import { ThinGlowBlurPostProcess } from "../../../Layers/thinEffectLayer";
import { FrameGraphExecuteTask } from "../Misc/executeTask";

/** @internal */
export const enum FrameGraphBaseLayerBlurType {
    None = "none",
    Standard = "standard",
    Glow = "glow",
}

class FrameGraphGlowBlurTask extends FrameGraphPostProcessTask {
    public override readonly postProcess: ThinGlowBlurPostProcess;

    /**
     * Constructs a new glow blur task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param thinPostProcess The thin post process to use for the glow blur effect. If not provided, a new one will be created.
     */
    constructor(name: string, frameGraph: FrameGraph, thinPostProcess?: ThinGlowBlurPostProcess) {
        super(name, frameGraph, thinPostProcess || new ThinGlowBlurPostProcess(name, frameGraph.engine, new Vector2(1, 0), 1));
    }

    public override getClassName(): string {
        return "FrameGraphGlowBlurTask";
    }

    public override record(
        skipCreationOfDisabledPasses = false,
        additionalExecute?: (context: FrameGraphRenderContext) => void,
        additionalBindings?: (context: FrameGraphRenderContext) => void
    ): FrameGraphRenderPass {
        const pass = super.record(skipCreationOfDisabledPasses, additionalExecute, additionalBindings);

        this.postProcess.textureWidth = this._outputWidth;
        this.postProcess.textureHeight = this._outputHeight;

        return pass;
    }
}

/**
 * @internal
 */
export class FrameGraphBaseLayerTask extends FrameGraphTask {
    /**
     * The target texture to apply the effect layer to.
     * The effect will be blended with the contents of this texture.
     */
    public targetTexture: FrameGraphTextureHandle;

    /**
     * The object renderer task used to render the objects in the texture to which the layer will be applied.
     * This is needed because the layer may have to inject code in the rendering manager used by object renderer task.
     */
    public objectRendererTask: FrameGraphObjectRendererTask;

    /**
     * The layer texture to render the effect into.
     * If not provided, a default texture will be created.
     */
    public layerTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the task (same as targetTexture, but the handle will be different).
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The layer object. Use this object to update the layer properties.
     */
    public readonly layer: ThinEffectLayer;

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

        if (this._clearLayerTextureTask) {
            this._clearLayerTextureTask.name = name + " Clear Layer";
        }

        if (this._objectRendererForLayerTask) {
            this._objectRendererForLayerTask.name = name + " Render to Layer";
        }
    }

    /**
     * Gets the object renderer used to render the layer.
     */
    public get objectRendererForLayer() {
        return this._objectRendererForLayerTask;
    }

    protected readonly _scene: Scene;
    protected readonly _engine: AbstractEngine;
    protected readonly _clearLayerTextureTask: FrameGraphClearTextureTask;
    protected readonly _objectRendererForLayerTask: FrameGraphObjectRendererTask;
    protected readonly _blurX: Array<FrameGraphBlurTask | FrameGraphGlowBlurTask> = [];
    protected readonly _blurY: Array<FrameGraphBlurTask | FrameGraphGlowBlurTask> = [];
    protected _layerTextureDimensions: { width: number; height: number };
    private readonly _onBeforeBlurTask: Nullable<FrameGraphExecuteTask> = null;
    private readonly _onAfterBlurTask: Nullable<FrameGraphExecuteTask> = null;
    private _onBeforeObservableObserver: Nullable<Observer<number>> = null;
    private _onBeforeObservableObserver2: Nullable<Observer<number>> = null;
    private _onAfterObservableObserver: Nullable<Observer<number>> = null;
    private _onAfterRenderingGroupObserver: Nullable<Observer<RenderingGroupInfo>> = null;

    /**
     * Constructs a new layer task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param scene The scene to render the layer in.
     * @param layer The layer.
     * @param numBlurPasses The number of blur passes applied by the layer.
     * @param _blurType The type of blur to use for the layer.
     * @param _setRenderTargetDepth If true, the task will set the render target depth.
     * @param _notifyBlurObservable If true, the task will notify before and after blurring occurs.
     * @param _setObjectList If true, the object list of the object renderer for the layer will be set to the object list of the object renderer task.
     */
    constructor(
        name: string,
        frameGraph: FrameGraph,
        scene: Scene,
        layer: ThinEffectLayer,
        numBlurPasses: number,
        private _blurType: FrameGraphBaseLayerBlurType = FrameGraphBaseLayerBlurType.Standard,
        private _setRenderTargetDepth = false,
        private _notifyBlurObservable = false,
        private _setObjectList = true
    ) {
        super(name, frameGraph);

        this._scene = scene;
        this._engine = scene.getEngine();

        this.layer = layer;
        if (this._blurType !== FrameGraphBaseLayerBlurType.None) {
            for (let i = 0; i < numBlurPasses; i++) {
                if (this._blurType === FrameGraphBaseLayerBlurType.Glow) {
                    this._blurX.push(new FrameGraphGlowBlurTask(`${name} Blur X${i}`, this._frameGraph, this.layer._postProcesses[1 + i * 2 + 0] as ThinGlowBlurPostProcess));
                    this._blurY.push(new FrameGraphGlowBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.layer._postProcesses[1 + i * 2 + 1] as ThinGlowBlurPostProcess));
                } else {
                    this._blurX.push(new FrameGraphBlurTask(`${name} Blur X${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 0] as ThinBlurPostProcess));
                    this._blurY.push(new FrameGraphBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.layer._postProcesses[i * 2 + 1] as ThinBlurPostProcess));
                }
            }
        }

        this._clearLayerTextureTask = new FrameGraphClearTextureTask(name + " Clear Layer", frameGraph);
        this._clearLayerTextureTask.clearColor = true;
        this._clearLayerTextureTask.clearDepth = true;

        this._objectRendererForLayerTask = new FrameGraphObjectRendererTask(name + " Render to Layer", frameGraph, scene, undefined, this.layer.objectRenderer);

        if (this._blurType !== FrameGraphBaseLayerBlurType.None && this._notifyBlurObservable) {
            this._onBeforeBlurTask = new FrameGraphExecuteTask(name + " On Before Blur", frameGraph);
            this._onAfterBlurTask = new FrameGraphExecuteTask(name + " On After Blur", frameGraph);

            this._onBeforeBlurTask.func = () => {
                if (this.layer.onBeforeBlurObservable.hasObservers()) {
                    this.layer.onBeforeBlurObservable.notifyObservers(this.layer);
                }
            };
            this._onAfterBlurTask.func = () => {
                if (this.layer.onAfterBlurObservable.hasObservers()) {
                    this.layer.onAfterBlurObservable.notifyObservers(this.layer);
                }
            };
        }

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this._objectRendererForLayerTask.isReady() && this.layer.isLayerReady();
    }

    public override getClassName(): string {
        return "FrameGraphBaseLayerTask";
    }

    public record(_skipCreationOfDisabledPasses?: boolean, additionalComposeBindings?: (context: FrameGraphRenderContext, effect: Effect) => void) {
        if (this.targetTexture === undefined || this.objectRendererTask === undefined) {
            throw new Error(`${this.constructor.name} "${this.name}": targetTexture and objectRendererTask are required`);
        }

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);

        // Uses the layerTexture or creates a color texture to render the layer to
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
            const targetTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.targetTexture);
            const fixedTextureSize = this.layer._options.mainTextureFixedSize ? Math.max(2, this.layer._options.mainTextureFixedSize) : 0;

            textureSize = getDimensionsFromTextureSize(targetTextureCreationOptions.size);
            textureSize.width = fixedTextureSize || Math.floor(textureSize.width * (this.layer._options.mainTextureRatio || 0.1)) || 1;
            textureSize.height = fixedTextureSize || Math.floor(textureSize.height * (this.layer._options.mainTextureRatio || 0.1)) || 1;

            textureCreationOptions = {
                size: textureSize,
                options: {
                    createMipMaps: false,
                    types: [this.layer._options.mainTextureType],
                    formats: [this.layer._options.mainTextureFormat],
                    samples: 1,
                    useSRGBBuffers: [false],
                    creationFlags: [0],
                },
                sizeIsPercentage: this.layer._options.mainTextureFixedSize ? false : targetTextureCreationOptions.sizeIsPercentage,
            };
            colorLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Color`, textureCreationOptions);
        }

        this._layerTextureDimensions = this._frameGraph.textureManager.getTextureAbsoluteDimensions(textureCreationOptions);

        // Creates a depth texture, used to render objects to the layer
        // We don't reuse the depth texture of the objectRendererTask, as the size of the layer texture will generally be different (smaller).
        const textureDepthCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: FrameGraphTextureManager.CloneTextureOptions(textureCreationOptions.options),
            sizeIsPercentage: textureCreationOptions.sizeIsPercentage,
        };

        textureDepthCreationOptions.options.formats![0] = Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

        const depthLayerOutput = this._frameGraph.textureManager.createRenderTargetTexture(`${this.name} Depth`, textureDepthCreationOptions);

        // Clears the textures
        this._clearLayerTextureTask.targetTexture = colorLayerOutput;
        this._clearLayerTextureTask.depthTexture = depthLayerOutput;
        this._clearLayerTextureTask.color = this.layer.neutralColor;
        this._clearLayerTextureTask.clearDepth = true;

        const clearTaskPass = this._clearLayerTextureTask.record(true);

        // Renders the objects to the layer texture
        this._objectRendererForLayerTask.targetTexture = this._clearLayerTextureTask.outputTexture;
        this._objectRendererForLayerTask.depthTexture = this._clearLayerTextureTask.outputDepthTexture;
        this._objectRendererForLayerTask.camera = this.objectRendererTask.camera;
        if (this._setObjectList) {
            this._objectRendererForLayerTask.objectList = this.objectRendererTask.objectList;
        }
        this._objectRendererForLayerTask.disableShadows = true;

        const objectRendererForLayerTaskPass = this._objectRendererForLayerTask.record(true);

        // Blurs the layer color texture
        let onBeforeBlurPass: FrameGraphPass<FrameGraphContext> | undefined;
        let onAfterBlurPass: FrameGraphPass<FrameGraphContext> | undefined;

        if (this._blurType !== FrameGraphBaseLayerBlurType.None) {
            let blurTextureType = 0;
            if (this._engine.getCaps().textureHalfFloatRender) {
                blurTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else {
                blurTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
            }

            textureCreationOptions.options.types![0] = blurTextureType;

            const blurTextureSizeRatio = (this.layer._options as any).blurTextureSizeRatio !== undefined ? (this.layer._options as any).blurTextureSizeRatio || 0.1 : undefined;
            if (blurTextureSizeRatio !== undefined) {
                textureSize.width = Math.floor(textureSize.width * blurTextureSizeRatio) || 1;
                textureSize.height = Math.floor(textureSize.height * blurTextureSizeRatio) || 1;
            }

            onBeforeBlurPass = this._onBeforeBlurTask?.record();

            const blurPasses: FrameGraphRenderPass[] = [];

            for (let i = 0; i < this._blurX.length; i++) {
                const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);

                this._blurX[i].sourceTexture = i === 0 ? this._objectRendererForLayerTask.outputTexture : this._blurY[i - 1].outputTexture;
                this._blurX[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
                this._blurX[i].targetTexture = blurXTextureHandle;
                blurPasses.push(this._blurX[i].record(true));

                const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);

                this._blurY[i].sourceTexture = this._blurX[i].outputTexture;
                this._blurY[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
                this._blurY[i].targetTexture = blurYTextureHandle;
                blurPasses.push(this._blurY[i].record(true));

                textureSize.width = textureSize.width >> 1;
                textureSize.height = textureSize.height >> 1;
            }

            onAfterBlurPass = this._onAfterBlurTask?.record();

            this.objectRendererTask.objectRenderer.onBeforeRenderObservable.remove(this._onBeforeObservableObserver2);
            this._onBeforeObservableObserver2 = this.objectRendererTask.objectRenderer.onBeforeRenderObservable.add(() => {
                const shouldRender = this.layer.shouldRender();

                if (onBeforeBlurPass) {
                    onBeforeBlurPass.disabled = !shouldRender;
                }
                for (let i = 0; i < blurPasses.length; i++) {
                    blurPasses[i].disabled = !shouldRender;
                }
                if (onAfterBlurPass) {
                    onAfterBlurPass.disabled = !shouldRender;
                }
            });
        }

        // Enables stencil (if stencil is needed) when rendering objects to the main texture
        // We also disable the internal passes if the layer should not render
        this.objectRendererTask.objectRenderer.onBeforeRenderObservable.remove(this._onBeforeObservableObserver);
        this._onBeforeObservableObserver = this.objectRendererTask.objectRenderer.onBeforeRenderObservable.add(() => {
            const shouldRender = this.layer.shouldRender();

            clearTaskPass.disabled = !shouldRender;
            objectRendererForLayerTaskPass.disabled = !shouldRender;

            if (shouldRender && this.layer.needStencil()) {
                this._engine.setStencilBuffer(true);
                this._engine.setStencilFunctionReference(1);
            }
        });

        this.objectRendererTask.objectRenderer.onAfterRenderObservable.remove(this._onAfterObservableObserver);
        this._onAfterObservableObserver = this.objectRendererTask.objectRenderer.onAfterRenderObservable.add(() => {
            if (this.layer.shouldRender() && this.layer.needStencil()) {
                this._engine.setStencilBuffer(false);
            }
        });

        // Composes the layer with the target texture
        this.layer.bindTexturesForCompose = undefined as any;

        this._clearAfterRenderingGroupObserver();

        const pass = this._frameGraph.addRenderPass(this.name);

        for (let i = 0; i < this._blurY.length; i++) {
            pass.addDependencies(this._blurY[i].outputTexture);
        }

        pass.setRenderTarget(this.outputTexture);
        if (this._setRenderTargetDepth) {
            pass.setRenderTargetDepth(this.objectRendererTask.depthTexture);
        }
        pass.setInitializeFunc((context) => {
            this.layer.bindTexturesForCompose = (effect: Effect) => {
                for (let i = 0; i < this._blurY.length; i++) {
                    context.bindTextureHandle(effect, `textureSampler${i > 0 ? i + 1 : ""}`, this._blurY[i].outputTexture);
                }
                additionalComposeBindings?.(context, effect);
            };

            if (this.layer._options.renderingGroupId === -1) {
                return;
            }

            this._onAfterRenderingGroupObserver = this._scene.onAfterRenderingGroupObservable.add((info) => {
                if (
                    !this.layer.shouldRender() ||
                    info.renderingGroupId !== this.layer._options.renderingGroupId ||
                    info.renderingManager !== this.objectRendererTask.objectRenderer.renderingManager
                ) {
                    return;
                }
                if (this._setObjectList) {
                    this._objectRendererForLayerTask.objectList = this.objectRendererTask.objectList;
                }
                context.saveDepthStates();
                context.setDepthStates(false, false);
                context._applyRenderTarget();
                this.layer.compose();
                context.restoreDepthStates();
            });
        });
        pass.setExecuteFunc((context) => {
            if (this._blurY.length > 0) {
                context.setTextureSamplingMode(this._blurY[this._blurY.length - 1].targetTexture!, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            }

            if (this.layer._options.renderingGroupId === -1 && this.layer.shouldRender()) {
                if (this._setObjectList) {
                    this._objectRendererForLayerTask.objectList = this.objectRendererTask.objectList; // in case the object list has changed in objectRendererTask
                }

                context.setDepthStates(false, false);
                context._applyRenderTarget();

                this.layer.compose();
            }
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        if (this._setRenderTargetDepth) {
            passDisabled.setRenderTargetDepth(this.objectRendererTask.depthTexture);
        }
        passDisabled.setExecuteFunc((_context) => {});
    }

    private _clearAfterRenderingGroupObserver() {
        this._scene.onAfterRenderingGroupObservable.remove(this._onAfterRenderingGroupObserver);
        this._onAfterRenderingGroupObserver = null;
    }

    public override dispose(): void {
        this._clearAfterRenderingGroupObserver();
        this._clearLayerTextureTask.dispose();
        this._objectRendererForLayerTask.dispose();
        this._onBeforeBlurTask?.dispose();
        this._onAfterBlurTask?.dispose();
        this.layer.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        super.dispose();
    }
}
