import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { ImageProcessingPostProcess } from "../PostProcesses/imageProcessingPostProcess";
import { PostProcess } from "../PostProcesses/postProcess";
import { Effect } from "../Materials/effect";
import { Logger } from '../Misc/logger';
import { _DevTools } from '../Misc/devTools';
import { Color4 } from "../Maths/math.color";
import { PrePassEffectConfiguration } from "./prePassEffectConfiguration";

export type PrePassLayout = number[];
/**
 * Renders a pre pass of the scene
 * This means every mesh in the scene will be rendered to a render target texture
 * And then this texture will be composited to the rendering canvas with post processes
 * It is necessary for effects like subsurface scattering or deferred shading
 */
export class PrePassRenderer {
    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("PrePassRendererSceneComponent");
    }

    /**
     * Constant used to retrieve the irradiance texture index in the textures array
     * using getIndex(PrePassRenderer.IRRADIANCE_TEXTURE_TYPE)
     */
    public static readonly IRRADIANCE_TEXTURE_TYPE = 0;
    /**
     * Constant used to retrieve the position texture index in the textures array
     * using getIndex(PrePassRenderer.POSITION_TEXTURE_INDEX)
     */
    public static readonly POSITION_TEXTURE_TYPE = 1;
    /**
     * Constant used to retrieve the velocity texture index in the textures array
     * using getIndex(PrePassRenderer.VELOCITY_TEXTURE_INDEX)
     */
    public static readonly VELOCITY_TEXTURE_TYPE = 2;
    /**
     * Constant used to retrieve the reflectivity texture index in the textures array
     * using the getIndex(PrePassRenderer.REFLECTIVITY_TEXTURE_TYPE)
     */
    public static readonly REFLECTIVITY_TEXTURE_TYPE = 3;
    /**
     * Constant used to retrieve the lit color texture index in the textures array
     * using the getIndex(PrePassRenderer.COLOR_TEXTURE_TYPE)
     */
    public static readonly COLOR_TEXTURE_TYPE = 4;
    /**
     * Constant used to retrieve depth + normal index in the textures array
     * using the getIndex(PrePassRenderer.DEPTHNORMAL_TEXTURE_TYPE)
     */
    public static readonly DEPTHNORMAL_TEXTURE_TYPE = 5;
    /**
     * Constant used to retrieve albedo index in the textures array
     * using the getIndex(PrePassRenderer.ALBEDO_TEXTURE_TYPE)
     */
    public static readonly ALBEDO_TEXTURE_TYPE = 6;

    private _textureTypes = [
        PrePassRenderer.IRRADIANCE_TEXTURE_TYPE,
        PrePassRenderer.POSITION_TEXTURE_TYPE,
        PrePassRenderer.VELOCITY_TEXTURE_TYPE,
        PrePassRenderer.REFLECTIVITY_TEXTURE_TYPE,
        PrePassRenderer.COLOR_TEXTURE_TYPE,
        PrePassRenderer.DEPTHNORMAL_TEXTURE_TYPE,
        PrePassRenderer.ALBEDO_TEXTURE_TYPE,
    ];

    private _textureIndices: number[] = [];

    private _scene: Scene;
    private _engine: Engine;
    private _isDirty: boolean = false;

    /**
     * Number of textures in the multi render target texture where the scene is directly rendered
     */
    public readonly mrtCount: number = 4;

    /**
     * The render target where the scene is directly rendered
     */
    public prePassRT: MultiRenderTarget;
    private _mrtTypes = [
        Constants.TEXTURETYPE_HALF_FLOAT, // Original color
        Constants.TEXTURETYPE_HALF_FLOAT, // Irradiance
        Constants.TEXTURETYPE_HALF_FLOAT, // Depth (world units)
        Constants.TEXTURETYPE_UNSIGNED_INT // Albedo
    ];
    private _multiRenderAttachments: number[];
    private _defaultAttachments: number[];
    private _clearAttachments: number[];

    private _postProcesses: PostProcess[] = [];

    private readonly _clearColor = new Color4(0, 0, 0, 0);

    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * Configuration for prepass effects
     */
    private _effectConfigurations: PrePassEffectConfiguration[] = [];

    /**
     * Should materials render their geometry on the MRT
     */
    public materialsShouldRenderGeometry: boolean = false;

    /**
     * Should materials render the irradiance information on the MRT
     */
    public materialsShouldRenderIrradiance: boolean = false;

    private _mrtLayout: number[];

    private _enabled: boolean = false;

    /**
     * Indicates if the prepass is enabled
     */
    public get enabled() {
        return this._enabled;
    }

    /**
     * How many samples are used for MSAA of the scene render target
     */
    public get samples() {
        return this.prePassRT.samples;
    }

    public set samples(n: number) {
        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        this.prePassRT.samples = n;
    }

    /**
     * Instanciates a prepass renderer
     * @param scene The scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();

        PrePassRenderer._SceneComponentInitialization(this._scene);
    }

    private _initializeAttachments() {
        let gl = this._engine._gl;

        this._multiRenderAttachments = [];
        this._clearAttachments = [gl.NONE];
        this._defaultAttachments = [gl.COLOR_ATTACHMENT0];

        for (let i = 0; i < this.mrtCount; i++) {
            this._multiRenderAttachments.push((<any>gl)["COLOR_ATTACHMENT" + i]);

            if (i > 0) {
                this._clearAttachments.push((<any>gl)["COLOR_ATTACHMENT" + i]);
                this._defaultAttachments.push(gl.NONE);
            }
        }
    }

    private _createCompositionEffect() {
        this.prePassRT = new MultiRenderTarget("sceneprePassRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this.mrtCount, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: this._mrtTypes });
        this.prePassRT.samples = 1;

        this._initializeAttachments();

        this.imageProcessingPostProcess = new ImageProcessingPostProcess("sceneCompositionPass", 1, null, undefined, this._engine);
        this.imageProcessingPostProcess.autoClear = false;
    }

    /**
     * Indicates if rendering a prepass is supported
     */
    public get isSupported() {
        return this._engine.webGLVersion > 1;
    }

    /**
     * Sets the proper output textures to draw in the engine.
     * @param effect The effect that is drawn. It can be or not be compatible with drawing to several output textures.
     */
    public bindAttachmentsForEffect(effect: Effect) {
        if (this.enabled) {
            if (effect._multiTarget) {
                this._engine.bindAttachments(this._multiRenderAttachments);
            } else {
                this._engine.bindAttachments(this._defaultAttachments);
            }
        }
    }

    /**
     * @hidden
     */
    public _beforeCameraDraw() {
        if (this._isDirty) {
            this._update();
        }

        this._bindFrameBuffer();
    }

    /**
     * @hidden
     */
    public _afterCameraDraw() {
        if (this._enabled) {
            const firstCameraPP = this._scene.activeCamera && this._scene.activeCamera._getFirstPostProcess();
            if (firstCameraPP) {
                this._scene.postProcessManager._prepareFrame();
            }
            this._scene.postProcessManager.directRender(this._postProcesses, firstCameraPP ? firstCameraPP.inputTexture : null);
        }
    }

    private _checkRTSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.prePassRT.getRenderWidth();
        var height = this.prePassRT.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.prePassRT.resize({ width: requiredWidth, height: requiredHeight });

            this._bindPostProcessChain();
        }
    }

    private _bindFrameBuffer() {
        if (this._enabled) {
            this._checkRTSize();
            var internalTexture = this.prePassRT.getInternalTexture();
            if (internalTexture) {
                this._engine.bindFramebuffer(internalTexture);
            }
        }
    }

    /**
     * Clears the scene render target (in the sense of settings pixels to the scene clear color value)
     */
    public clear() {
        if (this._enabled) {
            this._bindFrameBuffer();

            // Regular clear color with the scene clear color of the 1st attachment
            this._engine.clear(this._scene.clearColor,
                this._scene.autoClear || this._scene.forceWireframe || this._scene.forcePointsCloud,
                this._scene.autoClearDepthAndStencil,
                this._scene.autoClearDepthAndStencil);

            // Clearing other attachment with 0 on all other attachments
            this._engine.bindAttachments(this._clearAttachments);
            this._engine.clear(this._clearColor, true, false, false);
            this._engine.bindAttachments(this._multiRenderAttachments);
        }
    }

    private _setState(enabled: boolean) {
        this._enabled = enabled;
        this._scene.prePass = enabled;

        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = enabled;
        }
    }

    /**
     * Adds an effect configuration
     */
    public addEffectConfiguration(cfg: PrePassEffectConfiguration) {
        // Do not add twice
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].name === cfg.name) {
                return;
            }
        }

        this._effectConfigurations.push(cfg);
    }

    /**
     * Returns the index of a texture in the multi render target texture array.
     * @param type Texture type
     * @return The index
     */
    public getIndex(type: number) : number {
        if (this._textureTypes.indexOf(type) === -1) {
            Logger.Error("PrePassRenderer : Unknown texture type");
            return -1;
        }

        return this._textureIndices[type];
    }

    private _enable() {
        this._resetPostProcessChain();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].enabled) {
                if (!this._effectConfigurations[i].postProcess) {
                    this._effectConfigurations[i].createPostProcess();
                }

                this._postProcesses.push(this._effectConfigurations[i].postProcess);
            }
        }

        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        this._postProcesses.push(this.imageProcessingPostProcess);
        this._bindPostProcessChain();
        this._setState(true);
    }

    private _disable() {
        this._setState(false);
        this._resetLayout();

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            this._effectConfigurations[i].enabled = false;
        }

        this.materialsShouldRenderGeometry = false;
        this.materialsShouldRenderIrradiance = false;
    }

    private _resetLayout() {
        for (let i = 0 ; i < this._textureTypes.length; i++) {
            this._textureIndices[this._textureTypes[i]] = -1;
        }

        this._textureIndices[PrePassRenderer.COLOR_TEXTURE_TYPE] = 0;
        this._mrtLayout = [PrePassRenderer.COLOR_TEXTURE_TYPE];
    }

    private _resetPostProcessChain() {
        this._postProcesses = [];
        if (this.imageProcessingPostProcess) {
            this.imageProcessingPostProcess.restoreDefaultInputTexture();
        }

        for (let i = 0; i < this._effectConfigurations.length; i++) {
            if (this._effectConfigurations[i].postProcess) {
                this._effectConfigurations[i].postProcess.restoreDefaultInputTexture();
            }
        }
    }

    private _bindPostProcessChain() {
        this._postProcesses[0].inputTexture = this.prePassRT.getInternalTexture()!;
    }

    /**
     * Marks the prepass renderer as dirty, triggering a check if the prepass is necessary for the next rendering.
     */
    public markAsDirty() {
        this._isDirty = true;
    }

    /**
     * Enables a texture on the MultiRenderTarget for prepass
     */
    public enableTexture(type: number) {
        if (this._textureTypes.indexOf(type) === -1) {
            Logger.Error("PrePassRenderer : Unknown texture type");
            return;
        }

        if (this._textureIndices[type] === -1) {
            this._textureIndices[type] = this._mrtLayout.length;
            this._mrtLayout.push(type);
        }
    }

    private _update() {
        this._disable();
        let enablePrePass = false;

        for (let i = 0; i < this._scene.materials.length; i++) {
            if (this._scene.materials[i].setPrePassRenderer(this)) {
                enablePrePass = true;
            }
        }

        const pipelines = this._scene.postProcessRenderPipelineManager.supportedPipelines;
        for (let i = 0; i < pipelines.length; i++) {
            if (pipelines[i].setPrePassRenderer(this)) {
                enablePrePass = true;
            }
        }

        this._isDirty = false;

        if (enablePrePass) {
            this._enable();
        }

        if (!this.enabled) {
            this._engine.bindAttachments(this._defaultAttachments);
        }
    }

    /**
     * Disposes the prepass renderer.
     */
    public dispose() {
        for (let i = 0; i < this._effectConfigurations.length; i++) {
            this._effectConfigurations[i].dispose();
        }

        this.imageProcessingPostProcess.dispose();
        this.prePassRT.dispose();
    }

}
