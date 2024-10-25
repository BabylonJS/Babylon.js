import type { Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import type { Camera } from "core/Cameras/camera";
import type { Effect } from "core/Materials/effect";
import type { PostProcessOptions } from "core/PostProcesses/postProcess";
import { PostProcess } from "core/PostProcesses/postProcess";
import { Constants } from "core/Engines/constants";
import "core/Rendering/geometryBufferRendererSceneComponent";
import type { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { Color3 } from "core/Maths/math.color";
import { serialize } from "core/Misc/decorators";
import { SerializationHelper } from "core/Misc/decorators.serialization";
import { RegisterClass } from "core/Misc/typeStore";
import { EngineStore } from "core/Engines/engineStore";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import type { Scene } from "core/scene";
import "./edgeDetection.fragment";

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
     * default: 0.2  (min:0, max:1)
     */
    @serialize()
    public edgeIntensity: number = 0.2;

    /**
     * Defines the width of the detected edges.
     * Higher values result in thicker edges.
     * default: 0.2 (min:0.125, max:1)
     */
    @serialize()
    public edgeWidth: number = 0.2;

    /**
     * Defines the render mode.
     * default: 0
     * 0: general, 1: normal, 2: depth, 3: outline only
     */
    @serialize()
    public renderMode: number = 0;

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
        samplingMode?: number,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
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

                const h1 = new RenderTargetTexture("h1", { width: this.width, height: this.height }, scene, {
                    samplingMode: Constants.TEXTURE_NEAREST_NEAREST,
                    generateMipMaps: false,
                    generateDepthBuffer: false,
                    type: Constants.TEXTURETYPE_HALF_FLOAT,
                });

                switch (this.renderMode) {
                    case 0:
                        break;
                    case 1:
                        effect.setTexture("textureSampler", this._geometryBufferRenderer!.getGBuffer().textures[1]);
                        effect.setFloat("edgeWidth", 0);
                        break;
                    case 2:
                        effect.setTexture("textureSampler", this._geometryBufferRenderer!.getGBuffer().textures[0]);
                        effect.setFloat("edgeWidth", 0);
                        break;
                    case 3:
                        effect.setTexture("textureSampler", h1);
                        break;
                }
                effect.setInt("renderMode", this.renderMode);
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
