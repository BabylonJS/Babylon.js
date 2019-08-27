import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Constants } from "../Engines/constants";
import { Scene } from '../scene';
import { GeometryBufferRenderer } from '../Rendering/geometryBufferRenderer';

import "../Shaders/screenSpaceReflection.fragment";

declare type Engine = import("../Engines/engine").Engine;
/**
 * The SharpenPostProcess applies a sharpen kernel to every pixel
 * See http://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
export class ScreenSpaceReflectionPostProcess extends PostProcess {
    public threshold: number;
    public strength: number;
    public reflectionSpecularFalloffExponent: number;

    /**
     * Creates a new instance ConvolutionPostProcess
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
    constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        let supported = true;

        // Get geometry buffer renderer
        const geometryBufferRenderer = scene.enableGeometryBufferRenderer();
        if (!geometryBufferRenderer) {
            supported = false;
        }
        if (geometryBufferRenderer) {
            if (!geometryBufferRenderer.isSupported) {
                supported = false;
            } else {
                geometryBufferRenderer.enablePosition = true;
                geometryBufferRenderer.enableRoughness = true;
            }
        }

        // Super!
        super(name, "screenSpaceReflection", [
            "projection", "view", "threshold", "reflectionSpecularFalloffExponent", "strength"
        ], [
            "textureSampler", "normalSampler", "positionSampler", "roughnessSampler"
        ], options, camera, samplingMode, engine, reusable,
        supported ? "#define SSR_SUPPORTED" : "#define SSR_UNSUPPORTED",
        textureType, undefined, null, blockCompilation);

        // Setup up this
        this.threshold = 1;
        this.strength = 1;
        this.reflectionSpecularFalloffExponent = 3;

        // On apply, send uniforms
        this.onApply = (effect: Effect) => {
            if (!geometryBufferRenderer) {
                return;
            }

            // Samplers
            const positionIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
            const roughnessIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.ROUGHNESS_TEXTURE_TYPE);

            effect.setTexture("normalSampler", geometryBufferRenderer.getGBuffer().textures[1]);
            effect.setTexture("positionSampler", geometryBufferRenderer.getGBuffer().textures[positionIndex]);
            effect.setTexture("roughnessSampler", geometryBufferRenderer.getGBuffer().textures[roughnessIndex]);

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
        };
    }
}
