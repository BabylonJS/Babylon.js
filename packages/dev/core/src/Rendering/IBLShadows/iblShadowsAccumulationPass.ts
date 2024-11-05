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
import { Observable } from "../../Misc/observable";

/**
 * This should not be instanciated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsAccumulationPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;

    // First, render the accumulation pass with both position buffers, motion buffer, shadow buffer, and the previous accumulation buffer
    private _outputTexture: ProceduralTexture;
    private _oldAccumulationCopy: ProceduralTexture;
    private _oldPositionCopy: ProceduralTexture;
    private _accumulationParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;

    /**
     * Is the effect enabled
     */
    public enabled: boolean = true;

    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    public getOutputTexture(): ProceduralTexture {
        return this._outputTexture;
    }

    /**
     * Observable that triggers when the accumulation texture is ready
     */
    public onReadyObservable: Observable<void> = new Observable<void>();

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

    private _debugPassName: string = "Shadow Accumulation Debug Pass";

    /**
     * Gets the name of the debug pass
     * @returns The name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    public get remenance(): number {
        return this._remenance;
    }

    /**
     * A value that controls how much of the previous frame's accumulation to keep.
     * The higher the value, the faster the shadows accumulate but the more potential ghosting you'll see.
     */
    public set remenance(value: number) {
        this._remenance = value;
    }
    private _remenance: number = 0.9;

    /**
     * Reset the accumulation.
     */
    public get reset(): boolean {
        return this._reset;
    }
    /**
     * Reset the accumulation.
     */
    public set reset(value: boolean) {
        this._reset = value;
    }
    private _reset: boolean = true;

    /**
     * Tell the pass that the camera is moving. This will cause the accumulation
     * rate to change.
     */
    public set isMoving(value: boolean) {
        this._isMoving = value;
    }
    private _isMoving: boolean = false;

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
                textureFormat: Constants.TEXTUREFORMAT_RGBA,
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
     * Instantiates the accumulation pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The accumulation pass
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        const isWebGPU = this._engine.isWebGPU;

        const outputTextureOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowAccumulation.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowAccumulation.fragment")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture(
            "shadowAccumulationPass",
            {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
            },
            "iblShadowAccumulation",
            this._scene,
            outputTextureOptions
        );
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;
        this._outputTexture.onGeneratedObservable.addOnce(() => {
            this.onReadyObservable.notifyObservers();
        });

        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._setOutputTextureBindings();

        let counter = 0;
        this._scene.onBeforeRenderObservable.add(() => {
            counter = 0;
        });
        this._scene.onAfterRenderTargetsRenderObservable.add(() => {
            if (++counter == 2) {
                if (this.enabled && this._outputTexture.isReady()) {
                    this._setOutputTextureBindings();
                    this._outputTexture.render();
                }
            }
        });

        // Create the accumulation texture for the previous frame.
        // We'll copy the output of the accumulation pass to this texture at the start of every frame.
        const accumulationOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/pass.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/pass.fragment")]);
                }
            },
        };

        this._oldAccumulationCopy = new ProceduralTexture(
            "oldAccumulationRT",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            "pass",
            this._scene,
            accumulationOptions,
            false
        );

        this._oldAccumulationCopy.autoClear = false;
        this._oldAccumulationCopy.refreshRate = 1;
        this._oldAccumulationCopy.onBeforeGenerationObservable.add(this._setAccumulationCopyBindings.bind(this));
        this._setAccumulationCopyBindings();

        // Create the local position texture for the previous frame.
        // We'll copy the previous local position texture to this texture at the start of every frame.
        const localPositionOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_HALF_FLOAT,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            generateMipMaps: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/pass.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/pass.fragment")]);
                }
            },
        };

        this._oldPositionCopy = new ProceduralTexture(
            "oldLocalPositionRT",
            { width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() },
            "pass",
            this._scene,
            localPositionOptions,
            false
        );
        this._updatePositionCopy();
        this._oldPositionCopy.autoClear = false;
        this._oldPositionCopy.refreshRate = 1;
        this._oldPositionCopy.onBeforeGenerationObservable.add(this._updatePositionCopy.bind(this));
    }

    private _setOutputTextureBindings() {
        const remenance = this._isMoving ? this.remenance : 0.99;
        this._accumulationParams.set(remenance, this.reset ? 1.0 : 0.0, 0.0, 0.0);
        this._outputTexture.setTexture("spatialBlurSampler", this._renderPipeline._getSpatialBlurTexture());
        this._outputTexture.setVector4("accumulationParameters", this._accumulationParams);
        this._outputTexture.setTexture("oldAccumulationSampler", this._oldAccumulationCopy ? this._oldAccumulationCopy : this._renderPipeline._dummyTexture2d);
        this._outputTexture.setTexture("prevPositionSampler", this._oldPositionCopy ? this._oldPositionCopy : this._renderPipeline._dummyTexture2d);

        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            return;
        }
        const velocityIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE);
        this._outputTexture.setTexture("motionSampler", geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
        const wPositionIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
        this._outputTexture.setTexture("positionSampler", geometryBufferRenderer.getGBuffer().textures[wPositionIndex]);

        this.reset = false;
        this._isMoving = false;
    }

    private _updatePositionCopy() {
        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        const index = geometryBufferRenderer!.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
        this._oldPositionCopy.setTexture("textureSampler", geometryBufferRenderer!.getGBuffer().textures[index]);
    }

    private _setAccumulationCopyBindings() {
        this._oldAccumulationCopy.setTexture("textureSampler", this._outputTexture);
    }

    /**
     * Called by render pipeline when canvas resized.
     * @param scaleFactor The factor by which to scale the canvas size.
     */
    public resize(scaleFactor: number = 1.0) {
        const newSize = {
            width: Math.max(1.0, Math.floor(this._engine.getRenderWidth() * scaleFactor)),
            height: Math.max(1.0, Math.floor(this._engine.getRenderHeight() * scaleFactor)),
        };
        this._outputTexture.resize(newSize, false);
        this._oldAccumulationCopy.resize(newSize, false);
        this._oldPositionCopy.resize({ width: this._engine.getRenderWidth(), height: this._engine.getRenderHeight() }, false);
        this.reset = true;
    }

    private _disposeTextures() {
        this._oldAccumulationCopy.dispose();
        this._oldPositionCopy.dispose();
        this._outputTexture.dispose();
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return (
            this._oldAccumulationCopy &&
            this._oldAccumulationCopy.isReady() &&
            this._oldPositionCopy &&
            this._oldPositionCopy.isReady() &&
            this._outputTexture.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady())
        );
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        this._disposeTextures();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
