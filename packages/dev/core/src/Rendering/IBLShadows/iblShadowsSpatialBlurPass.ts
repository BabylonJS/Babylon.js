import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import type { Effect } from "../../Materials/effect";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

/**
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsSpatialBlurPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    // private _renderPipeline: IblShadowsRenderPipeline;
    private _outputPP: PostProcess;
    private _worldScale: number = 1.0;

    /**
     * Gets the pass post process
     * @returns The post process
     */
    public getPassPP(): PostProcess {
        return this._outputPP;
    }

    /**
     * Gets the debug pass post process
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }
    private _debugPassName: string = "Spatial Blur Debug Pass";
    /**
     * Sets the name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /**
     * The scale of the voxel grid in world space. This is used to scale the blur radius in world space.
     * @param scale The scale of the voxel grid in world space.
     */
    public setWorldScale(scale: number) {
        this._worldScale = scale;
    }

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;
    private _debugPassPP: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }

    /**
     * Creates the debug post process effect for this pass
     */
    private _createDebugPass() {
        if (!this._debugPassPP) {
            const isWebGPU = this._engine.isWebGPU;
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                textureFormat: Constants.TEXTUREFORMAT_R,
                textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
                samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: false,
                shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
                extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblShadowDebug.fragment"));
                    } else {
                        list.push(import("../../Shaders/iblShadowDebug.fragment"));
                    }
                },
            };
            this._debugPassPP = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPassPP.autoClear = false;
            this._debugPassPP.onApplyObservable.add((effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTextureFromPostProcessOutput("debugSampler", this._outputPP);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }

    /**
     * Instanciates the importance sampling renderer
     * @param scene Scene to attach to
     * @returns The importance sampling renderer
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._createTextures();
    }

    private _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
        const ppOptions: PostProcessOptions = {
            width: this._engine.getRenderWidth(),
            height: this._engine.getRenderHeight(),
            textureFormat: Constants.TEXTUREFORMAT_RG,
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            uniforms: ["blurParameters"],
            samplers: ["shadowSampler", "worldNormalSampler", "linearDepthSampler"],
            engine: this._engine,
            reusable: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/iblShadowSpatialBlur.fragment"));
                } else {
                    list.push(import("../../Shaders/iblShadowSpatialBlur.fragment"));
                }
            },
        };
        this._outputPP = new PostProcess("spacialBlurPP", "iblShadowSpatialBlur", ppOptions);
        this._outputPP.autoClear = false;
        this._outputPP.onApplyObservable.add((effect) => {
            this._updatePostProcess(effect);
        });
    }

    private _updatePostProcess(effect: Effect) {
        const iterationCount = 1;
        effect.setVector4("blurParameters", new Vector4(iterationCount, this._worldScale, 0.0, 0.0));
        const prePassRenderer = this._scene.prePassRenderer;
        if (prePassRenderer) {
            const wnormalIndex = prePassRenderer.getIndex(Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE);
            const depthIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
            if (wnormalIndex >= 0) effect.setTexture("worldNormalSampler", prePassRenderer.getRenderTarget().textures[wnormalIndex]);
            if (depthIndex >= 0) effect.setTexture("linearDepthSampler", prePassRenderer.getRenderTarget().textures[depthIndex]);
        }
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return this._outputPP.isReady() && !(this._debugPassPP && !this._debugPassPP.isReady());
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._outputPP.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
