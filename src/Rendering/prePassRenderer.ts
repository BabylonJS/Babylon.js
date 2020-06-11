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

    public sceneCompositorPostProcess: SceneCompositorPostProcess;
    public subSurfaceScatteringPostProcess: SubSurfaceScatteringPostProcess;
    private _enabled: boolean = false;

    public get enabled() {
        return this._enabled;
    }

    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();

        this.prePassRT = new MultiRenderTarget("sceneprePassRT", { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, this.mrtCount, this._scene,
            { generateMipMaps: false, generateDepthTexture: true, defaultType: Constants.TEXTURETYPE_UNSIGNED_INT, types: this._mrtTypes });
        this.prePassRT.samples = 1;

        let gl = this._engine._gl;
        this._clearAttachments = [gl.NONE, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3];
        this._multiRenderAttachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3];
        this._defaultAttachments = [gl.COLOR_ATTACHMENT0, gl.NONE, gl.NONE, gl.NONE];
        this.sceneCompositorPostProcess = new SceneCompositorPostProcess("sceneCompositor", 1, null, undefined, this._engine);
        this.sceneCompositorPostProcess.inputTexture = this.prePassRT.getInternalTexture()!;
        this.subSurfaceScatteringPostProcess = new SubSurfaceScatteringPostProcess("subSurfaceScattering", this._scene, 1, null, undefined, this._engine);

        PrePassRenderer._SceneComponentInitialization(this._scene);
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

    public dispose() {
        this.sceneCompositorPostProcess.dispose();
        this.subSurfaceScatteringPostProcess.dispose();
        this.prePassRT.dispose();
    }

}
