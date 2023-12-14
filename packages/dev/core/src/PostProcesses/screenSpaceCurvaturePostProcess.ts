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
import { serialize, SerializationHelper } from "../Misc/decorators";

import type { Engine } from "../Engines/engine";
import type { Scene } from "../scene";

/**
 * The Screen Space curvature effect can help highlighting ridge and valley of a model.
 */
export class ScreenSpaceCurvaturePostProcess extends PostProcess {
    /**
     * Defines how much ridge the curvature effect displays.
     */
    @serialize()
    public ridge: number = 1;

    /**
     * Defines how much valley the curvature effect displays.
     */
    @serialize()
    public valley: number = 1;

    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

    /**
     * Gets a string identifying the name of the class
     * @returns "ScreenSpaceCurvaturePostProcess" string
     */
    public getClassName(): string {
        return "ScreenSpaceCurvaturePostProcess";
    }

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
        engine?: Engine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(
            name,
            "screenSpaceCurvature",
            ["curvature_ridge", "curvature_valley"],
            ["textureSampler", "normalSampler"],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            undefined,
            textureType,
            undefined,
            null,
            blockCompilation
        );

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
                effect.setFloat("curvature_ridge", 0.5 / Math.max(this.ridge * this.ridge, 1e-4));
                effect.setFloat("curvature_valley", 0.7 / Math.max(this.valley * this.valley, 1e-4));

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
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
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
