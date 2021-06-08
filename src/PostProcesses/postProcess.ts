import { Nullable } from "../types";
import { SmartArray } from "../Misc/smartArray";
import { Observable, Observer } from "../Misc/observable";
import { Vector2 } from "../Maths/math.vector";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";
import { RenderTargetCreationOptions } from "../Materials/Textures/renderTargetCreationOptions";
import "../Shaders/postprocess.vertex";
import { IInspectable } from '../Misc/iInspectable';
import { Engine } from '../Engines/engine';
import { Color4 } from '../Maths/math.color';

import "../Engines/Extensions/engine.renderTarget";
import { NodeMaterial } from '../Materials/Node/nodeMaterial';
import { serialize, serializeAsColor4, SerializationHelper } from '../Misc/decorators';
import { _TypeStore } from '../Misc/typeStore';
import { DrawWrapper } from "../Materials/drawWrapper";
import { AbstractScene } from "../abstractScene";

declare type Scene = import("../scene").Scene;
declare type InternalTexture = import("../Materials/Textures/internalTexture").InternalTexture;
declare type WebVRFreeCamera = import("../Cameras/VR/webVRCamera").WebVRFreeCamera;
declare type Animation = import("../Animations/animation").Animation;
declare type PrePassRenderer = import("../Rendering/prePassRenderer").PrePassRenderer;
declare type PrePassEffectConfiguration = import("../Rendering/prePassEffectConfiguration").PrePassEffectConfiguration;

/**
 * Size options for a post process
 */
export type PostProcessOptions = { width: number, height: number };

type TextureCache = {texture: InternalTexture, postProcessChannel: number, lastUsedRenderId : number};

/**
 * PostProcess can be used to apply a shader to a texture after it has been rendered
 * See https://doc.babylonjs.com/how_to/how_to_use_postprocesses
 */
export class PostProcess {
    /** @hidden */
    public _parentContainer: Nullable<AbstractScene> = null;

    /**
     * Gets or sets the unique id of the post process
     */
    @serialize()
    public uniqueId: number;

    /** Name of the PostProcess. */
    @serialize()
    public name: string;

    /**
    * Width of the texture to apply the post process on
    */
    @serialize()
    public width = -1;

    /**
    * Height of the texture to apply the post process on
    */
    @serialize()
    public height = -1;

    /**
     * Gets the node material used to create this postprocess (null if the postprocess was manually created)
     */
    public nodeMaterialSource: Nullable<NodeMaterial> = null;

    /**
    * Internal, reference to the location where this postprocess was output to. (Typically the texture on the next postprocess in the chain)
    * @hidden
    */
    public _outputTexture: Nullable<InternalTexture> = null;
    /**
    * Sampling mode used by the shader
    * See https://doc.babylonjs.com/classes/3.1/texture
    */
    @serialize()
    public renderTargetSamplingMode: number;
    /**
    * Clear color to use when screen clearing
    */
    @serializeAsColor4()
    public clearColor: Color4;
    /**
    * If the buffer needs to be cleared before applying the post process. (default: true)
    * Should be set to false if shader will overwrite all previous pixels.
    */
    @serialize()
    public autoClear = true;
    /**
    * Type of alpha mode to use when performing the post process (default: Engine.ALPHA_DISABLE)
    */
    @serialize()
    public alphaMode = Constants.ALPHA_DISABLE;
    /**
    * Sets the setAlphaBlendConstants of the babylon engine
    */
    @serialize()
    public alphaConstants: Color4;
    /**
    * Animations to be used for the post processing
    */
    public animations = new Array<Animation>();

    /**
     * Enable Pixel Perfect mode where texture is not scaled to be power of 2.
     * Can only be used on a single postprocess or on the last one of a chain. (default: false)
     */
    @serialize()
    public enablePixelPerfectMode = false;

    /**
     * Force the postprocess to be applied without taking in account viewport
     */
    @serialize()
    public forceFullscreenViewport = true;

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/how_to/debug_layer#extensibility
     */
    public inspectableCustomProperties: IInspectable[];

    /**
     * Scale mode for the post process (default: Engine.SCALEMODE_FLOOR)
     *
     * | Value | Type                                | Description |
     * | ----- | ----------------------------------- | ----------- |
     * | 1     | SCALEMODE_FLOOR                     | [engine.scalemode_floor](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_floor) |
     * | 2     | SCALEMODE_NEAREST                   | [engine.scalemode_nearest](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_nearest) |
     * | 3     | SCALEMODE_CEILING                   | [engine.scalemode_ceiling](https://doc.babylonjs.com/api/classes/babylon.engine#scalemode_ceiling) |
     *
     */
    @serialize()
    public scaleMode = Constants.SCALEMODE_FLOOR;
    /**
    * Force textures to be a power of two (default: false)
    */
    @serialize()
    public alwaysForcePOT = false;

    @serialize("samples")
    private _samples = 1;

    /**
    * Number of sample textures (default: 1)
    */
    public get samples() {
        return this._samples;
    }

    public set samples(n: number) {
        this._samples = Math.min(n, this._engine.getCaps().maxMSAASamples);

        this._textures.forEach((texture) => {
            if (texture.samples !== this._samples) {
                this._engine.updateRenderTargetTextureSampleCount(texture, this._samples);
            }
        });
    }

    /**
    * Modify the scale of the post process to be the same as the viewport (default: false)
    */
    @serialize()
    public adaptScaleToCurrentViewport = false;

    private _camera: Camera;
    protected _scene: Scene;
    private _engine: Engine;

    private _options: number | PostProcessOptions;
    private _reusable = false;
    private _renderId = 0;
    private _textureType: number;
    private _textureFormat: number;
    /**
    * Smart array of input and output textures for the post process.
    * @hidden
    */
    public _textures = new SmartArray<InternalTexture>(2);
    /**
    * Smart array of input and output textures for the post process.
    * @hidden
    */
    private _textureCache: TextureCache[] = [];
    /**
    * The index in _textures that corresponds to the output texture.
    * @hidden
    */
    public _currentRenderTextureInd = 0;
    private _drawWrapper: DrawWrapper;
    private _samplers: string[];
    private _fragmentUrl: string;
    private _vertexUrl: string;
    private _parameters: string[];
    protected _postProcessDefines: Nullable<string>;
    private _scaleRatio = new Vector2(1, 1);
    protected _indexParameters: any;
    private _shareOutputWithPostProcess: Nullable<PostProcess>;
    private _texelSize = Vector2.Zero();
    /** @hidden */
    public _forcedOutputTexture: Nullable<InternalTexture>;

    /**
    * Prepass configuration in case this post process needs a texture from prepass
    * @hidden
    */
    public _prePassEffectConfiguration: PrePassEffectConfiguration;

    /**
     * Returns the fragment url or shader name used in the post process.
     * @returns the fragment url or name in the shader store.
     */
    public getEffectName(): string {
        return this._fragmentUrl;
    }

    // Events

    /**
    * An event triggered when the postprocess is activated.
    */
    public onActivateObservable = new Observable<Camera>();

    private _onActivateObserver: Nullable<Observer<Camera>>;
    /**
    * A function that is added to the onActivateObservable
    */
    public set onActivate(callback: Nullable<(camera: Camera) => void>) {
        if (this._onActivateObserver) {
            this.onActivateObservable.remove(this._onActivateObserver);
        }
        if (callback) {
            this._onActivateObserver = this.onActivateObservable.add(callback);
        }
    }

    /**
    * An event triggered when the postprocess changes its size.
    */
    public onSizeChangedObservable = new Observable<PostProcess>();

    private _onSizeChangedObserver: Nullable<Observer<PostProcess>>;
    /**
    * A function that is added to the onSizeChangedObservable
    */
    public set onSizeChanged(callback: (postProcess: PostProcess) => void) {
        if (this._onSizeChangedObserver) {
            this.onSizeChangedObservable.remove(this._onSizeChangedObserver);
        }
        this._onSizeChangedObserver = this.onSizeChangedObservable.add(callback);
    }

    /**
    * An event triggered when the postprocess applies its effect.
    */
    public onApplyObservable = new Observable<Effect>();

    private _onApplyObserver: Nullable<Observer<Effect>>;
    /**
    * A function that is added to the onApplyObservable
    */
    public set onApply(callback: (effect: Effect) => void) {
        if (this._onApplyObserver) {
            this.onApplyObservable.remove(this._onApplyObserver);
        }
        this._onApplyObserver = this.onApplyObservable.add(callback);
    }

    /**
    * An event triggered before rendering the postprocess
    */
    public onBeforeRenderObservable = new Observable<Effect>();

    private _onBeforeRenderObserver: Nullable<Observer<Effect>>;
    /**
    * A function that is added to the onBeforeRenderObservable
    */
    public set onBeforeRender(callback: (effect: Effect) => void) {
        if (this._onBeforeRenderObserver) {
            this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
        }
        this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
    }

    /**
    * An event triggered after rendering the postprocess
    */
    public onAfterRenderObservable = new Observable<Effect>();

    private _onAfterRenderObserver: Nullable<Observer<Effect>>;
    /**
    * A function that is added to the onAfterRenderObservable
    */
    public set onAfterRender(callback: (efect: Effect) => void) {
        if (this._onAfterRenderObserver) {
            this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
        }
        this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
    }

    /**
    * The input texture for this post process and the output texture of the previous post process. When added to a pipeline the previous post process will
    * render it's output into this texture and this texture will be used as textureSampler in the fragment shader of this post process.
    */
    public get inputTexture(): InternalTexture {
        return this._textures.data[this._currentRenderTextureInd];
    }

    public set inputTexture(value: InternalTexture) {
        this._forcedOutputTexture = value;
    }

    /**
    * Since inputTexture should always be defined, if we previously manually set `inputTexture`,
    * the only way to unset it is to use this function to restore its internal state
    */
    public restoreDefaultInputTexture() {
        if (this._forcedOutputTexture) {
            this._forcedOutputTexture = null;
            this.markTextureDirty();
        }
    }

    /**
    * Gets the camera which post process is applied to.
    * @returns The camera the post process is applied to.
    */
    public getCamera(): Camera {
        return this._camera;
    }

    /**
    * Gets the texel size of the postprocess.
    * See https://en.wikipedia.org/wiki/Texel_(graphics)
    */
    public get texelSize(): Vector2 {
        if (this._shareOutputWithPostProcess) {
            return this._shareOutputWithPostProcess.texelSize;
        }

        if (this._forcedOutputTexture) {
            this._texelSize.copyFromFloats(1.0 / this._forcedOutputTexture.width, 1.0 / this._forcedOutputTexture.height);
        }

        return this._texelSize;
    }

    /**
     * Creates a new instance PostProcess
     * @param name The name of the PostProcess.
     * @param fragmentUrl The url of the fragment shader to be used.
     * @param parameters Array of the names of uniform non-sampler2D variables that will be passed to the shader.
     * @param samplers Array of the names of uniform sampler2D variables that will be passed to the shader.
     * @param options The required width/height ratio to downsize to before computing the render pass. (Use 1.0 for full size)
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param defines String of defines that will be set when running the fragment shader. (default: null)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param vertexUrl The url of the vertex shader to be used. (default: "postprocess")
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param blockCompilation If the shader should not be compiled immediatly. (default: false)
     * @param textureFormat Format of textures used when performing the post process. (default: TEXTUREFORMAT_RGBA)
     */
    constructor(
        name: string,
        fragmentUrl: string, parameters: Nullable<string[]>, samplers: Nullable<string[]>, options: number | PostProcessOptions, camera: Nullable<Camera>,
        samplingMode: number = Constants.TEXTURE_NEAREST_SAMPLINGMODE, engine?: Engine, reusable?: boolean, defines: Nullable<string> = null, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, vertexUrl: string = "postprocess",
        indexParameters?: any, blockCompilation = false, textureFormat = Constants.TEXTUREFORMAT_RGBA) {

            this.name = name;
            if (camera != null) {
                this._camera = camera;
                this._scene = camera.getScene();
                camera.attachPostProcess(this);
                this._engine = this._scene.getEngine();

                this._scene.postProcesses.push(this);
                this.uniqueId = this._scene.getUniqueId();
            }
            else if (engine) {
                this._engine = engine;
                this._engine.postProcesses.push(this);
            }
            this._options = options;
            this.renderTargetSamplingMode = samplingMode ? samplingMode : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            this._reusable = reusable || false;
            this._textureType = textureType;
            this._textureFormat = textureFormat;

            this._samplers = samplers || [];
            this._samplers.push("textureSampler");

            this._fragmentUrl = fragmentUrl;
            this._vertexUrl = vertexUrl;
            this._parameters = parameters || [];

            this._parameters.push("scale");

            this._indexParameters = indexParameters;
            this._drawWrapper = new DrawWrapper(this._engine);

            if (!blockCompilation) {
                this.updateEffect(defines);
            }
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "PostProcess" string
     */
    public getClassName(): string {
        return "PostProcess";
    }

    /**
     * Gets the engine which this post process belongs to.
     * @returns The engine the post process was enabled with.
     */
    public getEngine(): Engine {
        return this._engine;
    }

    /**
     * The effect that is created when initializing the post process.
     * @returns The created effect corresponding the the postprocess.
     */
    public getEffect(): Effect {
        return this._drawWrapper.effect!;
    }

    /**
     * To avoid multiple redundant textures for multiple post process, the output the output texture for this post process can be shared with another.
     * @param postProcess The post process to share the output with.
     * @returns This post process.
     */
    public shareOutputWith(postProcess: PostProcess): PostProcess {
        this._disposeTextures();

        this._shareOutputWithPostProcess = postProcess;

        return this;
    }

    /**
     * Reverses the effect of calling shareOutputWith and returns the post process back to its original state.
     * This should be called if the post process that shares output with this post process is disabled/disposed.
     */
    public useOwnOutput() {
        if (this._textures.length == 0) {
            this._textures = new SmartArray<InternalTexture>(2);
        }

        this._shareOutputWithPostProcess = null;
    }

    /**
     * Updates the effect with the current post process compile time values and recompiles the shader.
     * @param defines Define statements that should be added at the beginning of the shader. (default: null)
     * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
     * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param onCompiled Called when the shader has been compiled.
     * @param onError Called if there is an error when compiling a shader.
     * @param vertexUrl The url of the vertex shader to be used (default: the one given at construction time)
     * @param fragmentUrl The url of the fragment shader to be used (default: the one given at construction time)
     */
    public updateEffect(defines: Nullable<string> = null, uniforms: Nullable<string[]> = null, samplers: Nullable<string[]> = null, indexParameters?: any,
        onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, vertexUrl?: string, fragmentUrl?: string) {
        this._postProcessDefines = defines;
        this._drawWrapper.effect = this._engine.createEffect({ vertex: vertexUrl ?? this._vertexUrl, fragment: fragmentUrl ?? this._fragmentUrl },
            ["position"],
            uniforms || this._parameters,
            samplers || this._samplers,
            defines !== null ? defines : "",
            undefined,
            onCompiled,
            onError,
            indexParameters || this._indexParameters
        );
    }

    /**
     * The post process is reusable if it can be used multiple times within one frame.
     * @returns If the post process is reusable
     */
    public isReusable(): boolean {
        return this._reusable;
    }

    /** invalidate frameBuffer to hint the postprocess to create a depth buffer */
    public markTextureDirty(): void {
        this.width = -1;
    }

    private _createRenderTargetTexture(textureSize: { width: number, height: number }, textureOptions: RenderTargetCreationOptions, channel = 0) {
        for (let i = 0; i < this._textureCache.length; i++) {
            if (this._textureCache[i].texture.width === textureSize.width &&
                this._textureCache[i].texture.height === textureSize.height &&
                this._textureCache[i].postProcessChannel === channel) {
                return this._textureCache[i].texture;
            }
        }

        const tex = this._engine.createRenderTargetTexture(textureSize, textureOptions);
        this._textureCache.push({ texture: tex, postProcessChannel: channel, lastUsedRenderId : -1 });

        return tex;
    }

    private _flushTextureCache() {
        const currentRenderId = this._renderId;

        for (let i = this._textureCache.length - 1; i >= 0; i--) {
            if (currentRenderId - this._textureCache[i].lastUsedRenderId > 100) {
                let currentlyUsed = false;
                for (var j = 0; j < this._textures.length; j++) {
                    if (this._textures.data[j] === this._textureCache[i].texture) {
                        currentlyUsed = true;
                        break;
                    }
                }

                if (!currentlyUsed) {
                    this._engine._releaseTexture(this._textureCache[i].texture);
                    this._textureCache.splice(i, 1);
                }
            }
        }
    }

    private _resize(width: number, height: number, camera: Camera, needMipMaps: boolean, forceDepthStencil?: boolean) {
        if (this._textures.length > 0) {
            this._textures.reset();
        }

        this.width = width;
        this.height = height;

        let textureSize = { width: this.width, height: this.height };
        let textureOptions = {
            generateMipMaps: needMipMaps,
            generateDepthBuffer: forceDepthStencil || camera._postProcesses.indexOf(this) === 0,
            generateStencilBuffer: (forceDepthStencil || camera._postProcesses.indexOf(this) === 0) && this._engine.isStencilEnable,
            samplingMode: this.renderTargetSamplingMode,
            type: this._textureType,
            format: this._textureFormat
        };

        this._textures.push(this._createRenderTargetTexture(textureSize, textureOptions, 0));

        if (this._reusable) {
            this._textures.push(this._createRenderTargetTexture(textureSize, textureOptions, 1));
        }

        this._texelSize.copyFromFloats(1.0 / this.width, 1.0 / this.height);

        this.onSizeChangedObservable.notifyObservers(this);
    }

    /**
     * Activates the post process by intializing the textures to be used when executed. Notifies onActivateObservable.
     * When this post process is used in a pipeline, this is call will bind the input texture of this post process to the output of the previous.
     * @param camera The camera that will be used in the post process. This camera will be used when calling onActivateObservable.
     * @param sourceTexture The source texture to be inspected to get the width and height if not specified in the post process constructor. (default: null)
     * @param forceDepthStencil If true, a depth and stencil buffer will be generated. (default: false)
     * @returns The target texture that was bound to be written to.
     */
    public activate(camera: Nullable<Camera>, sourceTexture: Nullable<InternalTexture> = null, forceDepthStencil?: boolean): InternalTexture {
        camera = camera || this._camera;

        var scene = camera.getScene();
        var engine = scene.getEngine();
        var maxSize = engine.getCaps().maxTextureSize;

        var requiredWidth = ((sourceTexture ? sourceTexture.width : this._engine.getRenderWidth(true)) * <number>this._options) | 0;
        var requiredHeight = ((sourceTexture ? sourceTexture.height : this._engine.getRenderHeight(true)) * <number>this._options) | 0;

        // If rendering to a webvr camera's left or right eye only half the width should be used to avoid resize when rendered to screen
        var webVRCamera = (<WebVRFreeCamera>camera.parent);
        if (webVRCamera && (webVRCamera.leftCamera == camera || webVRCamera.rightCamera == camera)) {
            requiredWidth /= 2;
        }

        var desiredWidth = ((<PostProcessOptions>this._options).width || requiredWidth);
        var desiredHeight = (<PostProcessOptions>this._options).height || requiredHeight;

        const needMipMaps =
            this.renderTargetSamplingMode !== Constants.TEXTURE_NEAREST_LINEAR &&
            this.renderTargetSamplingMode !== Constants.TEXTURE_NEAREST_NEAREST &&
            this.renderTargetSamplingMode !== Constants.TEXTURE_LINEAR_LINEAR;

        if (!this._shareOutputWithPostProcess && !this._forcedOutputTexture) {

            if (this.adaptScaleToCurrentViewport) {
                let currentViewport = engine.currentViewport;

                if (currentViewport) {
                    desiredWidth *= currentViewport.width;
                    desiredHeight *= currentViewport.height;
                }
            }

            if (needMipMaps || this.alwaysForcePOT) {
                if (!(<PostProcessOptions>this._options).width) {
                    desiredWidth = engine.needPOTTextures ? Engine.GetExponentOfTwo(desiredWidth, maxSize, this.scaleMode) : desiredWidth;
                }

                if (!(<PostProcessOptions>this._options).height) {
                    desiredHeight = engine.needPOTTextures ? Engine.GetExponentOfTwo(desiredHeight, maxSize, this.scaleMode) : desiredHeight;
                }
            }

            if (this.width !== desiredWidth || this.height !== desiredHeight) {
                this._resize(desiredWidth, desiredHeight, camera, needMipMaps, forceDepthStencil);
            }

            this._textures.forEach((texture) => {
                if (texture.samples !== this.samples) {
                    this._engine.updateRenderTargetTextureSampleCount(texture, this.samples);
                }
            });

            this._flushTextureCache();
            this._renderId++;
        }

        var target: InternalTexture;

        if (this._shareOutputWithPostProcess) {
            target = this._shareOutputWithPostProcess.inputTexture;
        } else if (this._forcedOutputTexture) {
            target = this._forcedOutputTexture;

            this.width = this._forcedOutputTexture.width;
            this.height = this._forcedOutputTexture.height;
        } else {
            target = this.inputTexture;

            let cache;
            for (let i = 0; i < this._textureCache.length; i++) {
                if (this._textureCache[i].texture === target) {
                    cache = this._textureCache[i];
                    break;
                }
            }

            if (cache) {
                cache.lastUsedRenderId = this._renderId;
            }
        }

        // Bind the input of this post process to be used as the output of the previous post process.
        if (this.enablePixelPerfectMode) {
            this._scaleRatio.copyFromFloats(requiredWidth / desiredWidth, requiredHeight / desiredHeight);
            this._engine.bindFramebuffer(target, 0, requiredWidth, requiredHeight, this.forceFullscreenViewport);
        }
        else {
            this._scaleRatio.copyFromFloats(1, 1);
            this._engine.bindFramebuffer(target, 0, undefined, undefined, this.forceFullscreenViewport);
        }

        this._engine._debugInsertMarker?.(`post process ${this.name} input`);

        this.onActivateObservable.notifyObservers(camera);

        // Clear
        if (this.autoClear && this.alphaMode === Constants.ALPHA_DISABLE) {
            this._engine.clear(this.clearColor ? this.clearColor : scene.clearColor, scene._allowPostProcessClearColor, true, true);
        }

        if (this._reusable) {
            this._currentRenderTextureInd = (this._currentRenderTextureInd + 1) % 2;
        }
        return target;
    }

    /**
     * If the post process is supported.
     */
    public get isSupported(): boolean {
        return this._drawWrapper.effect!.isSupported;
    }

    /**
     * The aspect ratio of the output texture.
     */
    public get aspectRatio(): number {
        if (this._shareOutputWithPostProcess) {
            return this._shareOutputWithPostProcess.aspectRatio;
        }

        if (this._forcedOutputTexture) {
            return this._forcedOutputTexture.width / this._forcedOutputTexture.height;
        }
        return this.width / this.height;
    }

    /**
     * Get a value indicating if the post-process is ready to be used
     * @returns true if the post-process is ready (shader is compiled)
     */
    public isReady(): boolean {
        return this._drawWrapper.effect?.isReady() ?? false;
    }

    /**
     * Binds all textures and uniforms to the shader, this will be run on every pass.
     * @returns the effect corresponding to this post process. Null if not compiled or not ready.
     */
    public apply(): Nullable<Effect> {
        // Check
        if (!this._drawWrapper.effect?.isReady()) {
            return null;
        }

        // States
        this._engine.enableEffect(this._drawWrapper);
        this._engine.setState(false);
        this._engine.setDepthBuffer(false);
        this._engine.setDepthWrite(false);

        // Alpha
        this._engine.setAlphaMode(this.alphaMode);
        if (this.alphaConstants) {
            this.getEngine().setAlphaConstants(this.alphaConstants.r, this.alphaConstants.g, this.alphaConstants.b, this.alphaConstants.a);
        }

        // Bind the output texture of the preivous post process as the input to this post process.
        var source: InternalTexture;
        if (this._shareOutputWithPostProcess) {
            source = this._shareOutputWithPostProcess.inputTexture;
        } else if (this._forcedOutputTexture) {
            source = this._forcedOutputTexture;
        } else {
            source = this.inputTexture;
        }

        this._drawWrapper.effect._bindTexture("textureSampler", source);

        // Parameters
        this._drawWrapper.effect.setVector2("scale", this._scaleRatio);
        this.onApplyObservable.notifyObservers(this._drawWrapper.effect);

        return this._drawWrapper.effect;
    }

    private _disposeTextures() {
        if (this._shareOutputWithPostProcess || this._forcedOutputTexture) {
            this._disposeTextureCache();
            return;
        }

        this._disposeTextureCache();
        this._textures.dispose();
    }

    private _disposeTextureCache() {
        for (let i = this._textureCache.length - 1; i >= 0; i--) {
            this._engine._releaseTexture(this._textureCache[i].texture);
        }

        this._textureCache.length = 0;
    }

    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup.
     * @returns true if the pre pass is needed.
     */
    public setPrePassRenderer(prePassRenderer: PrePassRenderer): boolean {
        if (this._prePassEffectConfiguration) {
            this._prePassEffectConfiguration = prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
            this._prePassEffectConfiguration.enabled = true;
            return true;
        }

        return false;
    }

    /**
     * Disposes the post process.
     * @param camera The camera to dispose the post process on.
     */
    public dispose(camera?: Camera): void {
        camera = camera || this._camera;

        this._disposeTextures();

        let index;
        if (this._scene) {
            index = this._scene.postProcesses.indexOf(this);
            if (index !== -1) {
                this._scene.postProcesses.splice(index, 1);
            }
        }

        if (this._parentContainer) {
            const index = this._parentContainer.postProcesses.indexOf(this);
            if (index > -1) {
                this._parentContainer.postProcesses.splice(index, 1);
            }
            this._parentContainer = null;
        }

        index = this._engine.postProcesses.indexOf(this);
        if (index !== -1) {
            this._engine.postProcesses.splice(index, 1);
        }

        if (!camera) {
            return;
        }
        camera.detachPostProcess(this);

        index = camera._postProcesses.indexOf(this);
        if (index === 0 && camera._postProcesses.length > 0) {
            var firstPostProcess = this._camera._getFirstPostProcess();
            if (firstPostProcess) {
                firstPostProcess.markTextureDirty();
            }
        }

        this.onActivateObservable.clear();
        this.onAfterRenderObservable.clear();
        this.onApplyObservable.clear();
        this.onBeforeRenderObservable.clear();
        this.onSizeChangedObservable.clear();
    }

    /**
     * Serializes the particle system to a JSON object
     * @returns the JSON object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this);
        var camera = this.getCamera() || this._scene && this._scene.activeCamera;
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.cameraId = camera ? camera.id : null;
        serializationObject.reusable = this._reusable;
        serializationObject.textureType = this._textureType;
        serializationObject.fragmentUrl = this._fragmentUrl;
        serializationObject.parameters = this._parameters;
        serializationObject.samplers = this._samplers;
        serializationObject.options = this._options;
        serializationObject.defines = this._postProcessDefines;
        serializationObject.textureFormat = this._textureFormat;
        serializationObject.vertexUrl = this._vertexUrl;
        serializationObject.indexParameters = this._indexParameters;

        return serializationObject;
    }

    /**
     * Clones this post process
     * @returns a new post process similar to this one
     */
    public clone(): Nullable<PostProcess> {
        const serializationObject = this.serialize();
        serializationObject._engine = this._engine;
        serializationObject.cameraId = null;

        const result = PostProcess.Parse(serializationObject, this._scene, "");

        if (!result) {
            return null;
        }

        result.onActivateObservable = this.onActivateObservable.clone();
        result.onSizeChangedObservable = this.onSizeChangedObservable.clone();
        result.onApplyObservable = this.onApplyObservable.clone();
        result.onBeforeRenderObservable = this.onBeforeRenderObservable.clone();
        result.onAfterRenderObservable = this.onAfterRenderObservable.clone();

        result._prePassEffectConfiguration = this._prePassEffectConfiguration;

        return result;
    }

    /**
     * Creates a material from parsed material data
     * @param parsedPostProcess defines parsed post process data
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures
     * @returns a new post process
     */
    public static Parse(parsedPostProcess: any, scene: Scene, rootUrl: string): Nullable<PostProcess> {
        var postProcessType = _TypeStore.GetClass(parsedPostProcess.customType);

        if (!postProcessType || !postProcessType._Parse) {
            return null;
        }

        var camera = scene ? scene.getCameraById(parsedPostProcess.cameraId) : null;
        return postProcessType._Parse(parsedPostProcess, camera, scene, rootUrl);
    }

    /** @hidden */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) : Nullable<PostProcess> {
        return SerializationHelper.Parse(() => {
            return new PostProcess(
                parsedPostProcess.name,
                parsedPostProcess.fragmentUrl,
                parsedPostProcess.parameters,
                parsedPostProcess.samplers,
                parsedPostProcess.options,
                targetCamera,
                parsedPostProcess.renderTargetSamplingMode,
                parsedPostProcess._engine,
                parsedPostProcess.reusable,
                parsedPostProcess.defines,
                parsedPostProcess.textureType,
                parsedPostProcess.vertexUrl,
                parsedPostProcess.indexParameters,
                false,
                parsedPostProcess.textureFormat
                );
        }, parsedPostProcess, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.PostProcess"] = PostProcess;
