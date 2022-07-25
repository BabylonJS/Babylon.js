import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { PostProcess } from "./postProcess";
import type { PostProcessOptions } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { serialize, SerializationHelper } from "../Misc/decorators";
import type { PrePassRenderer } from "../Rendering/prePassRenderer";
import { ScreenSpaceReflections2Configuration } from "../Rendering/screenSpaceReflections2Configuration";

import "../Shaders/screenSpaceReflection2.fragment";
import { RegisterClass } from "../Misc/typeStore";
import type { CubeTexture } from "../Materials/Textures/cubeTexture";

declare type Engine = import("../Engines/engine").Engine;
declare type Scene = import("../scene").Scene;

/**
 * The ScreenSpaceReflection2PostProcess performs realtime reflections using only the available information on the screen (positions, depth and normals).
 * Basically, the screen space reflection post-process will compute reflections according the material's properties.
 */
export class ScreenSpaceReflection2PostProcess extends PostProcess {
    private _isSceneRightHanded: boolean;

    /**
     * Gets or sets the maxDistance used to define how far we look for reflection during the ray-marching on the reflected ray. Default value is 20.0.
     */
    @serialize()
    public maxDistance: number = 20.0;
    /**
     * Gets or sets the resolution used for the first pass of the 2D ray marching algorithm.
     * Controls how many fragments are skipped while marching the reflected ray. Typically in interval [0.1, 1.0]. Default value is 0.5.
     * If resolution equals 0.0, every fragments are skiped and this results in no reflection at all.
     */
    @serialize()
    public resolution: number = 0.5;
    /**
     * Gets or sets the number of steps allowed for the second pass of the algorithm. More the steps is high, more the reflections will be precise. Default value is 15.
     */
    @serialize()
    public steps: number = 15;
    /**
     * Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene. Default value is 0.1.
     */
    @serialize()
    public thickness: number = 0.1;
    /**
     * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results. Default value is 1.0.
     */
    @serialize()
    public strength: number = 1.0;
    /**
     * Gets or sets the falloff exponent used while computing fresnel. More the exponent is high, more the reflections will be discrete. Default value is 3.0.
     */
    @serialize()
    public reflectionSpecularFalloffExponent: number = 1.0;
    /**
     * Gets or sets the factor applied when computing roughness. Default value is 0.2.
     */
    @serialize()
    public roughnessFactor: number = 0.2;
    /**
     * Gets or sets the distance at whitch the SSR algorithme no longer applies. Default value is 1000.
     */
    @serialize()
    public distanceFade: number = 1000.0;

    /**
     * Gets or sets the reflectivity value beyond which the SSR is no longer computed. Default value is 1.1.
     * It may be needed when the scene contains mirror like materials.
     * SSR and an other method may not match well, and it can be prettier to use only one method rather than a mix of methods in this case.
     */
    @serialize()
    public maxReflectivityForSSRReflections: number = 1.1;

    @serialize()
    private _environmentTexture: Nullable<CubeTexture> = null;

    /**
     * Gets the Skybox cubeTexture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance is reached.
     */
    get environmentTexture(): Nullable<CubeTexture> {
        return this._environmentTexture;
    }

    /**
     * Sets the Skybox cubeTexture to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance is reached.
     */
    set environmentTexture(backUpTex: Nullable<CubeTexture>) {
        this._environmentTexture = backUpTex;
        this._updateEffectDefines();
    }

    @serialize()
    private _environmentTextureIsProbe: boolean = false;

    /**
     * Gets the boolean defining if the environment texture is a Skybox (false) or a probe (true). Default value is false.
     */
    public get environmentTextureIsProbe(): boolean {
        return this._environmentTextureIsProbe;
    }

    /**
     * Sets the boolean defining if the environment texture is a Skybox (false) or a probe (true). Default value is false.
     */
    public set environmentTextureIsProbe(isProbe: boolean) {
        this._environmentTextureIsProbe = isProbe;
        this._updateEffectDefines();
    }

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

    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceReflection2PostProcess" string
     */
    public getClassName(): string {
        return "ScreenSpaceReflection2PostProcess";
    }

    /**
     * Creates a new instance of ScreenSpaceReflection2PostProcess.
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
        blockCompilation = true,
        forceGeometryBuffer = false
    ) {
        super(
            name,
            "screenSpaceReflection2",
            [
                "projection",
                "view",
                "maxDistance",
                "resolution",
                "steps",
                "thickness",
                "strength",
                "falloffExponent",
                "distanceFade",
                "minZ",
                "maxZ",
                "cameraPos",
                "maxReflectivityForSSRReflections",
                "roughnessFactor",
            ],
            ["textureSampler", "normalSampler", "depthSampler", "positionSampler", "reflectivitySampler", "backUpSampler"],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            "#define SSR_SUPPORTED\n",
            textureType,
            undefined,
            null,
            blockCompilation
        );

        if (!camera) {
            return;
        }

        // PrePass
        this._forceGeometryBuffer = forceGeometryBuffer;
        if (this._forceGeometryBuffer) {
            // Get geometry buffer renderer and update effect
            const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
            if (geometryBufferRenderer) {
                if (geometryBufferRenderer.isSupported) {
                    geometryBufferRenderer.enablePosition = true;
                    geometryBufferRenderer.enableReflectivity = true;
                }
            }
        } else {
            const prePassRenderer = scene.enablePrePassRenderer();
            prePassRenderer?.markAsDirty();
            this._prePassEffectConfiguration = new ScreenSpaceReflections2Configuration();
        }

        this._isSceneRightHanded = scene.useRightHandedSystem;
        this._updateEffectDefines();

        // On apply, send uniforms
        this.onApply = (effect: Effect) => {
            if (!this._prePassRenderer && !this._geometryBufferRenderer) {
                return;
            }

            if (this._geometryBufferRenderer) {
                // Samplers
                const positionIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
                const reflectivityIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("normalSampler", this._geometryBufferRenderer!.getGBuffer().textures[1]);
                effect.setTexture("positionSampler", this._geometryBufferRenderer!.getGBuffer().textures[positionIndex]);
                effect.setTexture("depthSampler", this._geometryBufferRenderer!.getGBuffer().textures[0]);
                effect.setTexture("reflectivitySampler", this._geometryBufferRenderer!.getGBuffer().textures[reflectivityIndex]);
            } else if (this._prePassRenderer) {
                // Samplers
                const normalIndex = this._prePassRenderer.getIndex(Constants.PREPASS_NORMAL_TEXTURE_TYPE);
                const positionIndex = this._prePassRenderer.getIndex(Constants.PREPASS_POSITION_TEXTURE_TYPE);
                const depthIndex = this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
                const reflectivityIndex = this._prePassRenderer.getIndex(Constants.PREPASS_REFLECTIVITY_TEXTURE_TYPE);
                effect.setTexture("normalSampler", this._prePassRenderer.getRenderTarget().textures[normalIndex]);
                effect.setTexture("positionSampler", this._prePassRenderer.getRenderTarget().textures[positionIndex]);
                effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[depthIndex]);
                effect.setTexture("reflectivitySampler", this._prePassRenderer.getRenderTarget().textures[reflectivityIndex]);
            }
            if (this._environmentTexture) {
                effect.setTexture("backUpSampler", this._environmentTexture);
            }

            effect.setFloat("resolution", this.resolution);
            effect.setInt("steps", this.steps);
            effect.setFloat("thickness", this.thickness);
            effect.setFloat("distanceFade", this.distanceFade);
            effect.setFloat("maxDistance", this.maxDistance);
            effect.setFloat("maxReflectivityForSSRReflections", this.maxReflectivityForSSRReflections);
            effect.setFloat("minZ", camera.minZ);
            effect.setFloat("maxZ", camera.maxZ);
            effect.setVector3("cameraPos", camera.position);

            const viewMatrix = camera.getViewMatrix(true);
            const projectionMatrix = camera.getProjectionMatrix(true);

            effect.setMatrix("projection", projectionMatrix);
            effect.setMatrix("view", viewMatrix);

            effect.setFloat("strength", this.strength);
            effect.setFloat("falloffExponent", this.reflectionSpecularFalloffExponent);
            effect.setFloat("roughnessFactor", this.roughnessFactor);
        };
    }

    private _updateEffectDefines(): void {
        const defines: string[] = [];
        if (this._geometryBufferRenderer || this._prePassRenderer) {
            defines.push("#define SSR_SUPPORTED");
        }

        if (this._isSceneRightHanded) {
            defines.push("#define RIGHT_HANDED_SCENE");
        }

        if (this._environmentTexture) {
            defines.push("#define BACKUP_TEXTURE");
        }

        if (this._environmentTextureIsProbe) {
            defines.push("#define BACKUP_TEXTURE_IS_PROBE");
        }

        this.updateEffect(defines.join("\n"));
    }

    /**
     * @param parsedPostProcess
     * @param targetCamera
     * @param scene
     * @param rootUrl
     * @returns
     */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new ScreenSpaceReflection2PostProcess(
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

RegisterClass("BABYLON.ScreenSpaceReflectionPost2Process", ScreenSpaceReflection2PostProcess);
