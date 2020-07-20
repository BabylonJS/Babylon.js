import { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { Scene } from "../scene";

import '../Rendering/geometryBufferRendererSceneComponent';
import "../Shaders/screenSpaceCurvature.fragment";
import { EngineStore } from '../Engines/engineStore';

declare type Engine = import("../Engines/engine").Engine;

/**
 * The Screen Space curvature effect can help highlighting ridge and valley of a model.
 */
export class ScreenSpaceCurvaturePostProcess extends PostProcess {
    /**
     * Defines how much ridge the curvature effect displays.
     */
    public ridge: number = 1;

    /**
     * Defines how much valley the curvature effect displays.
     */
    public valley: number = 1;

    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

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
    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "screenSpaceCurvature", ["curvature_ridge", "curvature_valley"], ["textureSampler", "normalSampler"], options, camera, samplingMode, engine, reusable, undefined, textureType, undefined, null, blockCompilation);

        this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();

        if (!this._geometryBufferRenderer) {
            // Geometry buffer renderer is not supported. So, work as a passthrough.
            Logger.Error("Multiple Render Target support needed for screen space curvature post process. Please use IsSupported test first.");
        } else {
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
        var engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }

        return engine.webGLVersion > 1 || engine.getCaps().drawBuffersExtension;
    }
}
