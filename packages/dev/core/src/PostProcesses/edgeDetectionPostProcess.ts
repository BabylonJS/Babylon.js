import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import type { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { Color3 } from "../Maths/math.color";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { RegisterClass } from "../Misc/typeStore";
import type { Scene } from "../scene";
import { EngineStore } from "../Engines/engineStore";

import "../Shaders/edgeDetection.fragment";

/**
 * The Edge Detection effect highlights the edges of objects in the scene like a toon.
 * This can be used for stylized rendering, outlining, or visual effects that require edge enhancement.
 */
export class EdgeDetectionPostProcess extends PostProcess {
    /**
     * Defines the color of the detected edges.
     */
    @serialize()
    public edgeColor: Color3 = new Color3(0, 0, 0);

    /**
     * Defines the intensity of the detected edges.
     * Higher values result in more pronounced edges.
     * default value: 0.2
     */
    @serialize()
    public edgeIntensity: number = 0.2;

    /**
     * Defines the width of the detected edges.
     * Higher values result in thicker edges.
     * default value: 0.2
     */
    @serialize()
    public edgeWidth: number = 0.2;

    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

    /**
     * Get the current class name of the current effect
     * @returns "EdgeDetectionPostProcess"
     */
    public override getClassName(): string {
        return "EdgeDetectionPostProcess";
    }

    /**
     * Creates a new instance of EdgeDetectionPostProcess.
     * @param name The name of the effect.
     * @param scene The scene where the edge detection post-process will be applied.
     * @param options The required width/height ratio or specific options for the post-process.
     * @param camera The camera to apply the post-process to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: TEXTURE_NEAREST_NEAREST)
     * @param reusable If the post-process can be reused on the same frame. (default: false)
     * @param textureType The type of textures used when performing the post-process. (default: TEXTURETYPE_HALF_FLOAT)
     */
    constructor(
        name: string,
        scene: Scene,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode: number = Constants.TEXTURE_NEAREST_NEAREST,
        reusable: boolean = false,
        textureType: number = Constants.TEXTURETYPE_HALF_FLOAT
    ) {
        super(
            name,
            "edgeDetection",
            ["width", "height", "edgeColor", "edgeIntensity", "edgeWidth", "renderMode"],
            ["normalSampler", "depthSampler"],
            options,
            camera,
            samplingMode,
            scene.getEngine(),
            reusable,
            null,
            textureType
        );

        this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();

        if (!this._geometryBufferRenderer) {
            // Geometry buffer renderer is not supported. So, work as a passthrough.
            Logger.Error("Geometry Buffer Renderer support is required for this post-process.");
        } else {
            // Geometry buffer renderer is supported.
            this.onApply = (effect: Effect) => {
                effect.setFloat("width", this.width);
                effect.setFloat("height", this.height);
                effect.setFloat("edgeIntensity", this.edgeIntensity);
                effect.setFloat("edgeWidth", this.edgeWidth);
                effect.setColor3("edgeColor", this.edgeColor);

                const normalTexture = this._geometryBufferRenderer!.getGBuffer().textures[1];
                const depthTexture = this._geometryBufferRenderer!.getGBuffer().textures[0];

                effect.setTexture("normalSampler", normalTexture);
                effect.setTexture("depthSampler", depthTexture);
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
            () =>
                new EdgeDetectionPostProcess(
                    parsedPostProcess.name,
                    scene,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    parsedPostProcess.textureType,
                    parsedPostProcess.reusable
                ),
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.EdgeDetectionPostProcess", EdgeDetectionPostProcess);
