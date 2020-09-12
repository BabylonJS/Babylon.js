import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from '../Rendering/geometryBufferRenderer';
import { serialize, SerializationHelper } from '../Misc/decorators';
import { PrePassRenderer } from "../Rendering/prePassRenderer";
import { ScreenSpaceReflectionsConfiguration } from "../Rendering/screenSpaceReflectionsConfiguration";

import "../Shaders/screenSpaceReflection.fragment";
import { _TypeStore } from '../Misc/typeStore';

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;

/**
 * The ScreenSpaceReflectionPostProcess performs realtime reflections using only and only the available informations on the screen (positions and normals).
 * Basically, the screen space reflection post-process will compute reflections according the material's reflectivity.
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
    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;
    private _prePassRenderer: PrePassRenderer;
    private _enableSmoothReflections: boolean = false;
    private _reflectionSamples: number = 64;
    private _smoothSteps: number = 5;
    private _ssrConfiguration: ScreenSpaceReflectionsConfiguration;

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
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false, forceGeometryBuffer = false) {
        super(name, "screenSpaceReflection", [
            "projection", "view", "threshold", "reflectionSpecularFalloffExponent", "strength", "step", "roughnessFactor"
        ], [
            "textureSampler", "normalSampler", "positionSampler", "reflectivitySampler"
        ], options, camera, samplingMode, engine, reusable,
        "#define SSR_SUPPORTED\n#define REFLECTION_SAMPLES 64\n#define SMOOTH_STEPS 5\n",
        textureType, undefined, null, blockCompilation);

        this._forceGeometryBuffer = forceGeometryBuffer;

        if (this._forceGeometryBuffer) {
            // Get geometry buffer renderer and update effect
            const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            if (geometryBufferRenderer) {
                if (geometryBufferRenderer.isSupported) {
                    geometryBufferRenderer.enablePosition = true;
                    geometryBufferRenderer.enableReflectivity = true;
                    this._geometryBufferRenderer = geometryBufferRenderer;
                }
            }
        } else {
            this._prePassRenderer = <PrePassRenderer>scene.enablePrePassRenderer();
            this._prePassRenderer.markAsDirty();
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
            } else{
                // Samplers
                const positionIndex = prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
                const roughnessIndex = prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                const normalIndex = prePassRenderer.getIndex(Constants.PREPASS_DEPTHNORMAL_TEXTURE_TYPE);

                effect.setTexture("normalSampler", prePassRenderer.prePassRT.textures[normalIndex]);
                effect.setTexture("positionSampler", prePassRenderer.prePassRT.textures[positionIndex]);
                effect.setTexture("reflectivitySampler", prePassRenderer.prePassRT.textures[roughnessIndex]);
            }

            // Uniforms
            const camera = scene.activeCamera;
            if (!camera) {
                return;
            }

            const viewMatrix = camera.getViewMatrix();
            const projectionMatrix = camera.getProjectionMatrix();

            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("view", viewMatrix);
            effect.setFloat("threshold", this.threshold);
            effect.setFloat("reflectionSpecularFalloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("strength", this.strength);
            effect.setFloat("step", this.step);
            effect.setFloat("roughnessFactor", this.roughnessFactor);
        };
    }

    /**
     * Gets wether or not smoothing reflections is enabled.
     * Enabling smoothing will require more GPU power and can generate a drop in FPS.
     */
    @serialize()
    public get enableSmoothReflections(): boolean {
        return this._enableSmoothReflections;
    }

    /**
     * Sets wether or not smoothing reflections is enabled.
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
            if (this._prePassRenderer) {
                defines.push("#define PREPASS_LAYOUT");
            }
        }
        if (this._enableSmoothReflections) {
            defines.push("#define ENABLE_SMOOTH_REFLECTIONS");
        }

        defines.push("#define REFLECTION_SAMPLES " + (this._reflectionSamples >> 0));
        defines.push("#define SMOOTH_STEPS " + (this._smoothSteps >> 0));

        this.updateEffect(defines.join("\n"));
    }

    /**
     * Sets the required values to the prepass renderer.
     * @param prePassRenderer defines the prepass renderer to setup
     * @returns true if the pre pass is needed.
     */
    public setPrePassRenderer(prePassRenderer: PrePassRenderer): boolean {
        let cfg = this._ssrConfiguration;
        if (!cfg) {
            cfg = new ScreenSpaceReflectionsConfiguration();
        }

        cfg.enabled = true;
        this._ssrConfiguration = prePassRenderer.addEffectConfiguration(cfg) as ScreenSpaceReflectionsConfiguration;
        return true;
    }

    /** @hidden */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(() => {
            return new ScreenSpaceReflectionPostProcess(
                parsedPostProcess.name, scene,
                parsedPostProcess.options, targetCamera,
                parsedPostProcess.renderTargetSamplingMode,
                scene.getEngine(), parsedPostProcess.textureType, parsedPostProcess.reusable);
        }, parsedPostProcess, scene, rootUrl);
    }
}

_TypeStore.RegisteredTypes["BABYLON.ScreenSpaceReflectionPostProcess"] = ScreenSpaceReflectionPostProcess;