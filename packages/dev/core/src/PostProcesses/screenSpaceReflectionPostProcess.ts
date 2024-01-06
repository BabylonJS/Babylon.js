import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { serialize, SerializationHelper } from "../Misc/decorators";
import type { PrePassRenderer } from "../Rendering/prePassRenderer";
import { ScreenSpaceReflectionsConfiguration } from "../Rendering/screenSpaceReflectionsConfiguration";

import "../Shaders/screenSpaceReflection.fragment";
import { RegisterClass } from "../Misc/typeStore";

import type { Engine } from "../Engines/engine";
import type { Scene } from "../scene";
import { Logger } from "core/Misc/logger";

/**
 * The ScreenSpaceReflectionPostProcess performs realtime reflections using only and only the available informations on the screen (positions and normals).
 * Basically, the screen space reflection post-process will compute reflections according the material's reflectivity.
 * @deprecated Use the new SSRRenderingPipeline instead.
 */
export class ScreenSpaceReflectionPostProcess extends PostProcess {
    /**
     * Gets or sets a reflection threshold mainly used to adjust the reflection's height.
     */
    @serialize()
    public threshold: number = 1.2;
    /**
     * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results.
     */
    @serialize()
    public strength: number = 1;
    /**
     * Gets or sets the falloff exponent used while computing fresnel. More the exponent is high, more the reflections will be discrete.
     */
    @serialize()
    public reflectionSpecularFalloffExponent: number = 3;
    /**
     * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Typically in interval [0.1, 1.0]
     */
    @serialize()
    public step: number = 1.0;
    /**
     * Gets or sets the factor applied when computing roughness. Default value is 0.2.
     */
    @serialize()
    public roughnessFactor: number = 0.2;

    private _forceGeometryBuffer: boolean = false;
    private get _geometryBufferRenderer(): Nullable<GeometryBufferRenderer> {
        if (!this._forceGeometryBuffer) {
            return null;
        }

        return this._scene.geometryBufferRenderer;
    }

    private get _prePassRenderer(): Nullable<PrePassRenderer> {
        if (this._forceGeometryBuffer) {
            return null;
        }

        return this._scene.prePassRenderer;
    }

    private _enableSmoothReflections: boolean = false;
    private _reflectionSamples: number = 64;
    private _smoothSteps: number = 5;
    private _isSceneRightHanded: boolean;

    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceReflectionPostProcess" string
     */
    public getClassName(): string {
        return "ScreenSpaceReflectionPostProcess";
    }

    /**
     * Creates a new instance of ScreenSpaceReflectionPostProcess.
     * @param name The name of the effect.
     * @param scene The scene containing the objects to calculate reflections.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: true)
     * @param forceGeometryBuffer If this post process should use geometry buffer instead of prepass (default: false)
     */
    constructor(
        name: string,
        scene: Scene,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: Engine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false,
        forceGeometryBuffer = false
    ) {
        super(
            name,
            "screenSpaceReflection",
            ["projection", "view", "threshold", "reflectionSpecularFalloffExponent", "strength", "stepSize", "roughnessFactor"],
            ["textureSampler", "normalSampler", "positionSampler", "reflectivitySampler"],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            "#define SSR_SUPPORTED\n#define REFLECTION_SAMPLES 64\n#define SMOOTH_STEPS 5\n",
            textureType,
            undefined,
            null,
            blockCompilation
        );

        this._forceGeometryBuffer = forceGeometryBuffer;

        if (this._forceGeometryBuffer) {
            // Get geometry buffer renderer and update effect
            const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            if (geometryBufferRenderer) {
                if (geometryBufferRenderer.isSupported) {
                    geometryBufferRenderer.enablePosition = true;
                    geometryBufferRenderer.enableReflectivity = true;

                    if (geometryBufferRenderer.generateNormalsInWorldSpace) {
                        Logger.Error("ScreenSpaceReflectionPostProcess does not support generateNormalsInWorldSpace=true for the geometry buffer renderer!");
                    }
                }
            }
        } else {
            const prePassRenderer = scene.enablePrePassRenderer();
            prePassRenderer?.markAsDirty();
            if (prePassRenderer?.generateNormalsInWorldSpace) {
                Logger.Error("ScreenSpaceReflectionPostProcess does not support generateNormalsInWorldSpace=true for the prepass renderer!");
            }
            this._prePassEffectConfiguration = new ScreenSpaceReflectionsConfiguration();
        }

        this._updateEffectDefines();

        // On apply, send uniforms
        this.onApply = (effect: Effect) => {
            const geometryBufferRenderer = this._geometryBufferRenderer;
            const prePassRenderer = this._prePassRenderer;

            if (!prePassRenderer && !geometryBufferRenderer) {
                return;
            }

            if (geometryBufferRenderer) {
                // Samplers
                const positionIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
                const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);

                effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
                effect.setTexture("positionSampler", geometryBufferRenderer.getGBuffer().textures[positionIndex]);
                effect.setTexture("reflectivitySampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);
            } else if (prePassRenderer) {
                // Samplers
                const positionIndex = prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);

                effect.setTexture("normalSampler", prePassRenderer.getRenderTarget().textures[normalIndex]);
                effect.setTexture("positionSampler", prePassRenderer.getRenderTarget().textures[positionIndex]);
                effect.setTexture("reflectivitySampler", prePassRenderer.getRenderTarget().textures[roughnessIndex]);
            }

            // Uniforms
            const camera = scene.activeCamera;
            if (!camera) {
                return;
            }

            const viewMatrix = camera.getViewMatrix(true);
            const projectionMatrix = camera.getProjectionMatrix(true);

            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("view", viewMatrix);
            effect.setFloat("threshold", this.threshold);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("strength", this.strength);
            effect.setFloat("stepSize", this.step);
            effect.setFloat("roughnessFactor", this.roughnessFactor);
        };

        this._isSceneRightHanded = scene.useRightHandedSystem;
    }

    /**
     * Gets whether or not smoothing reflections is enabled.
     * Enabling smoothing will require more GPU power and can generate a drop in FPS.
     */
    @serialize()
    public get enableSmoothReflections(): boolean {
        return this._enableSmoothReflections;
    }

    /**
     * Sets whether or not smoothing reflections is enabled.
     * Enabling smoothing will require more GPU power and can generate a drop in FPS.
     */
    public set enableSmoothReflections(enabled: boolean) {
        if (enabled === this._enableSmoothReflections) {
            return;
        }

        this._enableSmoothReflections = enabled;
        this._updateEffectDefines();
    }

    /**
     * Gets the number of samples taken while computing reflections. More samples count is high,
     * more the post-process wil require GPU power and can generate a drop in FPS. Basically in interval [25, 100].
     */
    @serialize()
    public get reflectionSamples(): number {
        return this._reflectionSamples;
    }

    /**
     * Sets the number of samples taken while computing reflections. More samples count is high,
     * more the post-process wil require GPU power and can generate a drop in FPS. Basically in interval [25, 100].
     */
    public set reflectionSamples(samples: number) {
        if (samples === this._reflectionSamples) {
            return;
        }

        this._reflectionSamples = samples;
        this._updateEffectDefines();
    }

    /**
     * Gets the number of samples taken while smoothing reflections. More samples count is high,
     * more the post-process will require GPU power and can generate a drop in FPS.
     * Default value (5.0) work pretty well in all cases but can be adjusted.
     */
    @serialize()
    public get smoothSteps(): number {
        return this._smoothSteps;
    }

    /*
     * Sets the number of samples taken while smoothing reflections. More samples count is high,
     * more the post-process will require GPU power and can generate a drop in FPS.
     * Default value (5.0) work pretty well in all cases but can be adjusted.
     */
    public set smoothSteps(steps: number) {
        if (steps === this._smoothSteps) {
            return;
        }

        this._smoothSteps = steps;
        this._updateEffectDefines();
    }

    private _updateEffectDefines(): void {
        const defines: string[] = [];
        if (this._geometryBufferRenderer || this._prePassRenderer) {
            defines.push("#define SSR_SUPPORTED");
        }
        if (this._enableSmoothReflections) {
            defines.push("#define ENABLE_SMOOTH_REFLECTIONS");
        }
        if (this._isSceneRightHanded) {
            defines.push("#define RIGHT_HANDED_SCENE");
        }

        defines.push("#define REFLECTION_SAMPLES " + (this._reflectionSamples >> 0));
        defines.push("#define SMOOTH_STEPS " + (this._smoothSteps >> 0));

        this.updateEffect(defines.join("\n"));
    }

    /**
     * @internal
     */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new ScreenSpaceReflectionPostProcess(
                    parsedPostProcess.name,
                    scene,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.textureType,
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.ScreenSpaceReflectionPostProcess", ScreenSpaceReflectionPostProcess);
