import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { GeometryBufferRenderer } from "../../Rendering/geometryBufferRenderer";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";

/**
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsSpatialBlurPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;
    private _outputTexture: ProceduralTexture;
    private _worldScale: number = 1.0;

    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    public getOutputTexture(): ProceduralTexture {
        return this._outputTexture;
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
                effect.setTexture("debugSampler", this._outputTexture);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }

    /**
     * Instanciates the importance sampling renderer
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The importance sampling renderer
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        const isWebGPU = this._engine.isWebGPU;
        const textureOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_UNSIGNED_INT,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowSpatialBlur.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowSpatialBlur.fragment")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture(
            "spatialBlurPass",
            {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
            },
            "iblShadowSpatialBlur",
            this._scene,
            textureOptions,
            false,
            false,
            Constants.TEXTURETYPE_UNSIGNED_INT
        );
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;

        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._update();

        this._scene.onBeforeCameraRenderObservable.add(() => {
            this._scene.onAfterRenderTargetsRenderObservable.addOnce(() => {
                if (this._outputTexture.isReady()) {
                    this._update();
                    this._outputTexture.render();
                }
            });
        });
    }

    private _update() {
        this._outputTexture.setTexture("voxelTracingSampler", this._renderPipeline.getVoxelTracingTexture());
        const iterationCount = 1;
        this._outputTexture.setVector4("blurParameters", new Vector4(iterationCount, this._worldScale, 0.0, 0.0));
        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            return;
        }
        const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
        this._outputTexture.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
        const wnormalIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
        this._outputTexture.setTexture("worldNormalSampler", geometryBufferRenderer.getGBuffer().textures[wnormalIndex]);
    }

    /** Called by render pipeline when canvas resized. */
    public resize() {
        this._outputTexture.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, false);
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return this._outputTexture && this._outputTexture.isReady() && !(this._debugPassPP && !this._debugPassPP.isReady());
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._outputTexture.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
