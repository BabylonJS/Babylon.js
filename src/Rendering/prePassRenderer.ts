import { PBRBaseMaterial } from "../Materials/PBR/pbrBaseMaterial";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";
import { ImageProcessingPostProcess } from "../PostProcesses/imageProcessingPostProcess";
import { SubSurfaceScatteringPostProcess } from "../PostProcesses/subSurfaceScatteringPostProcess";
import { Effect } from "../Materials/effect";
import { Logger } from "../Misc/logger";
import { _DevTools } from '../Misc/devTools';
import { Color3 } from "../Maths/math.color";

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
        Constants.TEXTURETYPE_UNSIGNED_INT, // Original color
        Constants.TEXTURETYPE_HALF_FLOAT, // Irradiance
        Constants.TEXTURETYPE_HALF_FLOAT, // Depth (world units)
        Constants.TEXTURETYPE_UNSIGNED_INT
    ];
    private _multiRenderAttachments: number[];
    private _defaultAttachments: number[];
    private _clearAttachments: number[];

    private _ssDiffusionS: number[] = [];
    private _ssFilterRadii: number[] = [];
    private _ssDiffusionD: number[] = [];

    /**
     * Diffusion profile color for subsurface scattering
     */
    public get ssDiffusionS() {
        return this._ssDiffusionS;
    }

    /**
     * Diffusion profile max color channel value for subsurface scattering
     */
    public get ssDiffusionD() {
        return this._ssDiffusionD;
    }

    /**
     * Diffusion profile filter radius for subsurface scattering
     */
    public get ssFilterRadii() {
        return this._ssFilterRadii;
    }

    /**
     * Defines the ratio real world => scene units.
     * Used for subsurface scattering
     */
    public metersPerUnit: number = 1;

    /**
     * Image processing post process for composition
     */
    public imageProcessingPostProcess: ImageProcessingPostProcess;

    /**
     * Post process for subsurface scattering
     */
    public subSurfaceScatteringPostProcess: SubSurfaceScatteringPostProcess;
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
        if (!this.subSurfaceScatteringPostProcess) {
            this._createEffects();
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

        // Adding default diffusion profile
        this.addDiffusionProfile(new Color3(1, 1, 1));
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

    private _createEffects() {
        this.prePassRT = new MultiRenderTarget("sceneprePassRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this.mrtCount, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: this._mrtTypes });
        this.prePassRT.samples = 1;

        this._initializeAttachments();

        this.imageProcessingPostProcess = new ImageProcessingPostProcess("sceneCompositionPass", 1, null, undefined, this._engine);
        this.subSurfaceScatteringPostProcess = new SubSurfaceScatteringPostProcess("subSurfaceScattering", this._scene, 1, null, undefined, this._engine);
        this.subSurfaceScatteringPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
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
    public drawBuffers(effect: Effect) {
        if (this.enabled) {
            if (effect._multiTarget) {
                this._engine.renderToAttachments(this._multiRenderAttachments);
            } else {
                this._engine.renderToAttachments(this._defaultAttachments);
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
            // this.imageProcessingPostProcess.activate(this._scene.activeCamera);
            this.subSurfaceScatteringPostProcess.autoClear = false;
            this.subSurfaceScatteringPostProcess.activate(this._scene.activeCamera);
            this.imageProcessingPostProcess.activate(this._scene.activeCamera);
            this._scene.postProcessManager.directRender([this.subSurfaceScatteringPostProcess], this.imageProcessingPostProcess.inputTexture);
            this._scene.postProcessManager.directRender([this.imageProcessingPostProcess], null, false, 0, 0, false);
            // this.getEngine().restoreDefaultFramebuffer(); // Restore back buffer if needed
            // this._scene.postProcessManager._prepareFrame();
        }
    }

    private _checkRTSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.prePassRT.getRenderWidth();
        var height = this.prePassRT.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.prePassRT.resize({ width: requiredWidth, height: requiredHeight });
            this.subSurfaceScatteringPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
        }
    }

    private _bindFrameBuffer() {
        if (this._enabled) {
            this._checkRTSize();
            var internalTexture = this.prePassRT.getInternalTexture();
            if (internalTexture) {
                this._engine.bindFramebuffer(internalTexture);
            } else {
                Logger.Error("High Definition pipeline error.");
            }
            return;
        }
    }

    /**
     * Clears the scene render target (in the sense of settings pixels to the scene clear color value)
     */
    public clear() {
        if (this._enabled) {
            this._bindFrameBuffer();
            this._engine.clear(this._scene.clearColor,
                this._scene.autoClear || this._scene.forceWireframe || this._scene.forcePointsCloud,
                this._scene.autoClearDepthAndStencil,
                this._scene.autoClearDepthAndStencil);
            this._engine.clearColorAttachments(this.prePassRT.getInternalTexture()!, this._clearAttachments);
        }
    }

    private _enable() {
        if (!this.subSurfaceScatteringPostProcess) {
            this._createEffects();
        }
        this._enabled = true;
        this._scene.prePass = true;
        this.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = true;
    }

    private _disable() {
        this._enabled = false;
        this._scene.prePass = false;
        this.imageProcessingPostProcess.imageProcessingConfiguration.applyByPostProcess = false;
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
                this._enable();
            }
        }

        // add SSAO 2 etc..

        this._isDirty = false;

        if (!this.enabled) {
            this._engine.renderToAttachments(this._defaultAttachments);
        }
    }

    /**
     * Adds a new diffusion profile.
     * Useful for more realistic subsurface scattering on diverse materials.
     * @param color The color of the diffusion profile. Should be the average color of the material.
     * @return The index of the diffusion profile for the material subsurface configuration
     */
    public addDiffusionProfile(color: Color3) : number {
        if (this.ssDiffusionD.length >= 5) {
            // We only suppport 5 diffusion profiles
            Logger.Error("You already reached the maximum number of diffusion profiles.");
            return -1;
        }

        // Do not add doubles
        for (let i = 0; i < this._ssDiffusionS.length / 3; i++) {
            if (this._ssDiffusionS[i * 3] === color.r &&
                this._ssDiffusionS[i * 3 + 1] === color.g &&
                this._ssDiffusionS[i * 3 + 2] === color.b) {
                return i;
            }
        }

        this._ssDiffusionS.push(color.r, color.b, color.g);
        this._ssDiffusionD.push(Math.max(Math.max(color.r, color.b), color.g));
        this._ssFilterRadii.push(this.getDiffusionProfileParameters(color));
        this._scene.ssDiffusionProfileColors.push(color);

        return this._ssDiffusionD.length - 1;
    }

    /**
     * Deletes all diffusion profiles.
     * Note that in order to render subsurface scattering, you should have at least 1 diffusion profile.
     */
    public clearAllDiffusionProfiles() {
        this._ssDiffusionD = [];
        this._ssDiffusionS = [];
        this._ssFilterRadii = [];
        this._scene.ssDiffusionProfileColors = [];
    }

    /**
     * @hidden
     */
    public getDiffusionProfileParameters(color: Color3)
    {
        const cdf = 0.997;
        // Importance sample the normalized diffuse reflectance profile for the computed value of 's'.
        // ------------------------------------------------------------------------------------
        // R[r, phi, s]   = s * (Exp[-r * s] + Exp[-r * s / 3]) / (8 * Pi * r)
        // PDF[r, phi, s] = r * R[r, phi, s]
        // CDF[r, s]      = 1 - 1/4 * Exp[-r * s] - 3/4 * Exp[-r * s / 3]
        // ------------------------------------------------------------------------------------
        // We importance sample the color channel with the widest scattering distance.
        const maxScatteringDistance = Math.max(color.r, color.g, color.b);

        return this._sampleBurleyDiffusionProfile(cdf, maxScatteringDistance);
    }

    // https://zero-radiance.github.io/post/sampling-diffusion/
    // Performs sampling of a Normalized Burley diffusion profile in polar coordinates.
    // 'u' is the random number (the value of the CDF): [0, 1).
    // rcp(s) = 1 / ShapeParam = ScatteringDistance.
    // Returns the sampled radial distance, s.t. (u = 0 -> r = 0) and (u = 1 -> r = Inf).
    private _sampleBurleyDiffusionProfile(u: number, rcpS: number)
    {
        u = 1 - u; // Convert CDF to CCDF

        let g = 1 + (4 * u) * (2 * u + Math.sqrt(1 + (4 * u) * u));
        let n = Math.pow(g, -1.0 / 3.0);                      // g^(-1/3)
        let p = (g * n) * n;                                   // g^(+1/3)
        let c = 1 + p + n;                                     // 1 + g^(+1/3) + g^(-1/3)
        let x = 3 * Math.log(c / (4 * u));

        return x * rcpS;
    }

    /**
     * Disposes the prepass renderer.
     */
    public dispose() {
        this.imageProcessingPostProcess.dispose();
        this.subSurfaceScatteringPostProcess.dispose();
        this.prePassRT.dispose();
    }

}
