import { PBRBaseMaterial } from "../Materials/PBR/PBRBaseMaterial";
import { MultiRenderTarget } from "../Materials/Textures/multiRenderTarget";
import { Scene } from "../scene";
import { Engine } from "../Engines/Engine";
import { Constants } from "../Engines/constants";
import { SceneCompositorPostProcess } from "../PostProcesses/sceneCompositorPostProcess";
import { SubSurfaceScatteringPostProcess } from "../PostProcesses/subSurfaceScatteringPostProcess";
import { Effect } from "../Materials/effect";
import { Logger } from "../Misc/logger";
import { _DevTools } from '../Misc/devTools';
import { Color3 } from "../Maths/math.color";

export class PrePassRenderer {
    /** @hidden */
    public static _SceneComponentInitialization: (scene: Scene) => void = (_) => {
        throw _DevTools.WarnImport("PrePassRendererSceneComponent");
    }

    private _scene: Scene;
    private _engine: Engine;
    private _isDirty: boolean = false;

    public mrtCount: number = 4;
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

    public ssDiffusionS: number[] = [];
    public ssFilterRadii: number[] = [];
    public ssDiffusionD: number[] = [];

    public sceneCompositorPostProcess: SceneCompositorPostProcess;
    public subSurfaceScatteringPostProcess: SubSurfaceScatteringPostProcess;
    private _enabled: boolean = false;

    public get enabled() {
        return this._enabled;
    }

    public get samples() {
        return this.prePassRT.samples;
    }

    public set samples(n: number) {
        this.prePassRT.samples = n;
    }

    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        PrePassRenderer._SceneComponentInitialization(this._scene);

        this.prePassRT = new MultiRenderTarget("sceneprePassRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this.mrtCount, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: this._mrtTypes });
        this.prePassRT.samples = 1;

        this._initializeAttachments();

        // Adding default diffusion profile
        this.addDiffusionProfile(new Color3(1, 1, 1));
        this.sceneCompositorPostProcess = new SceneCompositorPostProcess("sceneCompositor", 1, null, undefined, this._engine);
        this.sceneCompositorPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
        this.subSurfaceScatteringPostProcess = new SubSurfaceScatteringPostProcess("subSurfaceScattering", this._scene, 1, null, undefined, this._engine);
    }

    private _initializeAttachments() {
        let gl = this._engine._gl;

        this._multiRenderAttachments = [];
        this._clearAttachments = [gl.NONE];
        this._defaultAttachments = [gl.COLOR_ATTACHMENT0];

        for (let i = 0; i < this.mrtCount; i++) {
            this._multiRenderAttachments.push((<any>gl)["COLOR_ATTACHMENT" + i]);

            if (i > 0) {
                this._clearAttachments.push((<any>gl)["COLOR_ATTACHMENT" + i])
                this._defaultAttachments.push(gl.NONE)
            }
        }
    }

    public get isSupported() {
        // TODO
        return true;
    }

    public drawBuffers(effect: Effect) {
        if (this.enabled) {
            if (effect._multiTarget) {
                this._engine.renderToAttachments(this._multiRenderAttachments);
            } else {
                this._engine.renderToAttachments(this._defaultAttachments);      
            }
        }
    }

    public _beforeCameraDraw() {
        if (this._isDirty) {
            this._update();
        }

        this._bindFrameBuffer();
    }

    public _afterCameraDraw() {
        if (this._enabled) {
            // this.sceneCompositorPostProcess.activate(this._scene.activeCamera);
            this.sceneCompositorPostProcess.autoClear = false;
            this.sceneCompositorPostProcess.activate(this._scene.activeCamera);
            this.subSurfaceScatteringPostProcess.activate(this._scene.activeCamera);
            this._scene.postProcessManager.directRender([this.sceneCompositorPostProcess], this.subSurfaceScatteringPostProcess.inputTexture);
            // this.getEngine().restoreDefaultFramebuffer(); // Restore back buffer if needed
            // this._scene.postProcessManager._prepareFrame();
            this._scene.postProcessManager.directRender([this.subSurfaceScatteringPostProcess], null, false, 0, 0, false);
        }
    }

    private _checkRTSize() {
        var requiredWidth = this._engine.getRenderWidth(true);
        var requiredHeight = this._engine.getRenderHeight(true);
        var width = this.prePassRT.getRenderWidth();
        var height = this.prePassRT.getRenderHeight();

        if (width !== requiredWidth || height !== requiredHeight) {
            this.prePassRT.resize({ width: requiredWidth, height: requiredHeight });
            this.sceneCompositorPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
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
        this._enabled = true;
        this._scene.prePass = true;
    }

    private _disable() {
        this._enabled = false;
        this._scene.prePass = false;
    }

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

        // SSAO 2
        // TODO

        this._isDirty = false;

        if (!this.enabled) {
            this._engine.renderToAttachments(this._defaultAttachments);
        }
    }


    public addDiffusionProfile(color: Color3) : number {
        if (this.ssDiffusionD.length >= 5) {
            // We only suppport 5 diffusion profiles
            Logger.Error("You already reached the maximum number of diffusion profiles.");
            return -1;
        }

        // Do not add doubles
        for (let i = 0; i < this.ssDiffusionS.length / 3; i++) {
            if (this.ssDiffusionS[i * 3] === color.r && 
                this.ssDiffusionS[i * 3 + 1] === color.g && 
                this.ssDiffusionS[i * 3 + 2] === color.b) {
                return i;
            }
        }

        this.ssDiffusionS.push(color.r, color.b, color.g);
        this.ssDiffusionD.push(Math.max(Math.max(color.r, color.b), color.g));
        this.ssFilterRadii.push(this.getDiffusionProfileParameters(color));
        this._scene.ssDiffusionProfileColors.push(color);

        return this.ssDiffusionD.length - 1;
    }

    public clearAllDiffusionProfiles() {
        this.ssDiffusionD = [];
        this.ssDiffusionS = [];
        this.ssFilterRadii = [];
        this._scene.ssDiffusionProfileColors = [];
    }

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

    public dispose() {
        this.sceneCompositorPostProcess.dispose();
        this.subSurfaceScatteringPostProcess.dispose();
        this.prePassRT.dispose();
    }

}
