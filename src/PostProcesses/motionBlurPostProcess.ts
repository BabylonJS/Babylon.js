import { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Vector2 } from "../Maths/math.vector";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";

import "../Animations/animatable";
import '../Rendering/geometryBufferRendererSceneComponent';
import "../Shaders/motionBlur.fragment";

declare type Engine = import("../Engines/engine").Engine;

/**
 * The Motion Blur Post Process which blurs an image based on the objects velocity in scene.
 * Velocity can be affected by each object's rotation, position and scale depending on the transformation speed.
 * As an example, all you have to do is to create the post-process:
 *  var mb = new BABYLON.MotionBlurPostProcess(
 *      'mb', // The name of the effect.
 *      scene, // The scene containing the objects to blur according to their velocity.
 *      1.0, // The required width/height ratio to downsize to before computing the render pass.
 *      camera // The camera to apply the render pass to.
 * );
 * Then, all objects moving, rotating and/or scaling will be blurred depending on the transformation speed.
 */
export class MotionBlurPostProcess extends PostProcess {
    /**
     * Defines how much the image is blurred by the movement. Default value is equal to 1
     */
    public motionStrength: number = 1;

    /**
     * Gets the number of iterations are used for motion blur quality. Default value is equal to 32
     */
    public get motionBlurSamples(): number {
        return this._motionBlurSamples;
    }

    /**
     * Sets the number of iterations to be used for motion blur quality
     */
    public set motionBlurSamples(samples: number) {
        this._motionBlurSamples = samples;

        if (this._geometryBufferRenderer) {
            this.updateEffect("#define GEOMETRY_SUPPORTED\n#define SAMPLES " + samples.toFixed(1));
        }
    }

    private _motionBlurSamples: number = 32;
    private _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

    /**
     * Creates a new instance MotionBlurPostProcess
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
        super(name, "motionBlur", ["motionStrength", "motionScale", "screenSize"], ["velocitySampler"], options, camera, samplingMode, engine, reusable, "#define GEOMETRY_SUPPORTED\n#define SAMPLES 64.0", textureType, undefined, null, blockCompilation);

        this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();

        if (!this._geometryBufferRenderer) {
            // Geometry buffer renderer is not supported. So, work as a passthrough.
            Logger.Warn("Multiple Render Target support needed to compute object based motion blur");
            this.updateEffect();
        } else {
            // Geometry buffer renderer is supported.
            this._geometryBufferRenderer.enableVelocity = true;

            this.onApply = (effect: Effect) => {
                effect.setVector2("screenSize", new Vector2(this.width, this.height));

                effect.setFloat("motionScale", scene.getAnimationRatio());
                effect.setFloat("motionStrength", this.motionStrength);

                if (this._geometryBufferRenderer) {
                    const velocityIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE);
                    effect.setTexture("velocitySampler", this._geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
                }
            };
        }
    }

    /**
     * Excludes the given skinned mesh from computing bones velocities.
     * Computing bones velocities can have a cost and that cost. The cost can be saved by calling this function and by passing the skinned mesh reference to ignore.
     * @param skinnedMesh The mesh containing the skeleton to ignore when computing the velocity map.
     */
    public excludeSkinnedMesh(skinnedMesh: AbstractMesh): void {
        if (this._geometryBufferRenderer && skinnedMesh.skeleton) {
            this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity.push(skinnedMesh);
        }
    }

    /**
     * Removes the given skinned mesh from the excluded meshes to integrate bones velocities while rendering the velocity map.
     * @param skinnedMesh The mesh containing the skeleton that has been ignored previously.
     * @see excludeSkinnedMesh to exclude a skinned mesh from bones velocity computation.
     */
    public removeExcludedSkinnedMesh(skinnedMesh: AbstractMesh): void {
        if (this._geometryBufferRenderer && skinnedMesh.skeleton) {
            const index = this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity.indexOf(skinnedMesh);
            if (index !== -1) {
                this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity.splice(index, 1);
            }
        }
    }

    /**
     * Disposes the post process.
     * @param camera The camera to dispose the post process on.
     */
    public dispose(camera?: Camera): void {
        if (this._geometryBufferRenderer) {
            // Clear previous transformation matrices dictionary used to compute objects velocities
            this._geometryBufferRenderer._previousTransformationMatrices = {};
            this._geometryBufferRenderer._previousBonesTransformationMatrices = {};
            this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity = [];
        }

        super.dispose(camera);
    }
}
