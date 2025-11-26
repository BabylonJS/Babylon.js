import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import type { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";

import "../Rendering/geometryBufferRendererSceneComponent";
import "../Shaders/screenSpaceCurvature.fragment";
import { EngineStore } from "../Engines/engineStore";
import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Scene } from "../scene";
import { ThinScreenSpaceCurvaturePostProcess } from "./thinScreenSpaceCurvaturePostProcess";

/**
 * The Screen Space curvature effect can help highlighting ridge and valley of a model.
 */
export class ScreenSpaceCurvaturePostProcess extends PostProcess {
    /**
     * Defines how much ridge the curvature effect displays.
     */
    @serialize()
    public get ridge() {
        return this._effectWrapper.ridge;
    }

    public set ridge(value: number) {
        this._effectWrapper.ridge = value;
    }

    /**
     * Defines how much valley the curvature effect displays.
     */
    @serialize()
    public get valley() {
        return this._effectWrapper.valley;
    }

    public set valley(value: number) {
        this._effectWrapper.valley = value;
    }

    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceCurvaturePostProcess" string
     */
    public override getClassName(): string {
        return "ScreenSpaceCurvaturePostProcess";
    }

    protected override _effectWrapper: ThinScreenSpaceCurvaturePostProcess;

    /**
     * Creates a new instance ScreenSpaceCurvaturePostProcess
     * @param name The name of the effect.
     * @param scene The scene containing the objects to blur according to their velocity.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        scene: Scene,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const localOptions = {
            uniforms: ThinScreenSpaceCurvaturePostProcess.Uniforms,
            samplers: ThinScreenSpaceCurvaturePostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinScreenSpaceCurvaturePostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinScreenSpaceCurvaturePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();

        if (!this._geometryBufferRenderer) {
            // Geometry buffer renderer is not supported. So, work as a passthrough.
            Logger.Error("Multiple Render Target support needed for screen space curvature post process. Please use IsSupported test first.");
        } else {
            if (this._geometryBufferRenderer.generateNormalsInWorldSpace) {
                Logger.Error("ScreenSpaceCurvaturePostProcess does not support generateNormalsInWorldSpace=true for the geometry buffer renderer!");
            }

            // Geometry buffer renderer is supported.
            this.onApply = (effect: Effect) => {
                const normalTexture = this._geometryBufferRenderer!.getGBuffer().textures[1];
                effect.setTexture("normalSampler", normalTexture);
            };
        }
    }

    /**
     * Support test.
     */
    public static get IsSupported(): boolean {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }

        return engine.getCaps().drawBuffersExtension;
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new ScreenSpaceCurvaturePostProcess(
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

RegisterClass("BABYLON.ScreenSpaceCurvaturePostProcess", ScreenSpaceCurvaturePostProcess);
