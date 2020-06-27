import { PBRBaseMaterial } from "../Materials/PBR/pbrBaseMaterial";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { ImageProcessingPostProcess } from "../PostProcesses/imageProcessingPostProcess";
import { SubSurfaceScatteringPostProcess } from "../PostProcesses/subSurfaceScatteringPostProcess";
import { Effect } from "../Materials/effect";
import { _DevTools } from '../Misc/devTools';
import { Color4 } from "../Maths/math.color";
import { SubSurfaceConfiguration } from "./subSurfaceConfiguration";
import { SSAO2RenderingPipeline } from "../PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline";

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

    private readonly _clearColor = new Color4(0, 0, 0, 0);

    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * Post process for subsurface scattering
     */
    public subSurfaceScatteringPostProcess: SubSurfaceScatteringPostProcess;

    /**
     * Configuration for sub surface scattering post process
     */
    public subSurfaceConfiguration: SubSurfaceConfiguration;

    // TODO
    public ssaoConfiguration: boolean = false;

    public materialsShouldRenderGeometry: boolean = false;

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

        this.subSurfaceConfiguration = new SubSurfaceConfiguration();
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

        // TODO same remark as below, create PP chain
        if (!this.subSurfaceScatteringPostProcess) {
            this.imageProcessingPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
        }

        this.imageProcessingPostProcess.autoClear = false;
    }

    private _createSubSurfaceScatteringEffect() {
        // TODO : Could probably be moved in subsurface configuration
        this.subSurfaceScatteringPostProcess = new SubSurfaceScatteringPostProcess("subSurfaceScattering", this._scene, 1, null, undefined, this._engine);
        this.subSurfaceScatteringPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
        this.subSurfaceScatteringPostProcess.autoClear = false;
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

            // TODO : change with list of postprocess (setup pipeline ?)
            if (this.subSurfaceScatteringPostProcess) {
                this.subSurfaceScatteringPostProcess.activate(this._scene.activeCamera);
            }
            this.imageProcessingPostProcess.activate(this._scene.activeCamera);

            // TODO : same as above
            if (this.subSurfaceScatteringPostProcess) {
                this._scene.postProcessManager.directRender([this.subSurfaceScatteringPostProcess], this.imageProcessingPostProcess.inputTexture);
            }

            // TODO make it a clean function in scene.ts
            let doNotBindFB = false;
            if (this._scene.postProcessManager) {
                doNotBindFB = true;
                this._scene.postProcessManager._prepareFrame();
            }
            this._scene.postProcessManager.directRender([this.imageProcessingPostProcess], null, false, 0, 0, doNotBindFB);
        }
    }

    private _checkRTSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.prePassRT.getRenderWidth();
        var height = this.prePassRT.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.prePassRT.resize({ width: requiredWidth, height: requiredHeight });

            // TODO : same as above, PP chain
            if (!this.subSurfaceScatteringPostProcess) {
                this.imageProcessingPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
            } else {
                this.subSurfaceScatteringPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
            }
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

    private _enable() {
        if (this.subSurfaceConfiguration.enabled && !this.subSurfaceScatteringPostProcess) {
            this._createSubSurfaceScatteringEffect();
        }

        if (!this.imageProcessingPostProcess) {
            this._createCompositionEffect();
        }

        this._setState(true);
    }

    private _disable() {
        this._setState(false);
        this.subSurfaceConfiguration.enabled = false;
        this.ssaoConfiguration = false;
        this.materialsShouldRenderGeometry = true;
    }

    /**
     * Marks the prepass renderer as dirty, triggering a check if the prepass is necessary for the next rendering.
     */
    public markAsDirty() {
        this._isDirty = true;
    }

    private _update() {
        this._disable();

        // Subsurface scattering
        for (let i = 0; i < this._scene.materials.length; i++) {
            const material = this._scene.materials[i] as PBRBaseMaterial;

            if (material.subSurface && material.subSurface.isScatteringEnabled) {
                this.subSurfaceConfiguration.enabled = true;
                this._enable();
            }
        }

        const pipelines = this._scene.postProcessRenderPipelineManager.supportedPipelines;
        for (let i = 0; i < pipelines.length; i++) {
            if (pipelines[i] instanceof SSAO2RenderingPipeline) {
                this.ssaoConfiguration = true;
                this.materialsShouldRenderGeometry = true;
                this._enable();
            }
        }

        this._isDirty = false;

        if (!this.enabled) {
            this._engine.bindAttachments(this._defaultAttachments);
        }
    }

    /**
     * Disposes the prepass renderer.
     */
    public dispose() {
        this.imageProcessingPostProcess.dispose();
        this.subSurfaceScatteringPostProcess.dispose();
        this.prePassRT.dispose();
        this.subSurfaceConfiguration.dispose();
    }

}
