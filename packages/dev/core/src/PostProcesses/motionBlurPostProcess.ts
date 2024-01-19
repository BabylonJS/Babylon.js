import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Matrix, TmpVectors, Vector2 } from "../Maths/math.vector";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";
import { GeometryBufferRenderer } from "../Rendering/geometryBufferRenderer";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { MotionBlurConfiguration } from "../Rendering/motionBlurConfiguration";
import type { PrePassRenderer } from "../Rendering/prePassRenderer";

import "../Animations/animatable";
import "../Rendering/geometryBufferRendererSceneComponent";
import "../Shaders/motionBlur.fragment";
import { serialize, SerializationHelper } from "../Misc/decorators";
import { RegisterClass } from "../Misc/typeStore";

import type { Engine } from "../Engines/engine";
import type { Scene } from "../scene";

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
    @serialize()
    public motionStrength: number = 1;

    /**
     * Gets the number of iterations are used for motion blur quality. Default value is equal to 32
     */
    @serialize()
    public get motionBlurSamples(): number {
        return this._motionBlurSamples;
    }

    /**
     * Sets the number of iterations to be used for motion blur quality
     */
    public set motionBlurSamples(samples: number) {
        this._motionBlurSamples = samples;
        this._updateEffect();
    }

    private _motionBlurSamples: number = 32;

    /**
     * Gets whether or not the motion blur post-process is in object based mode.
     */
    @serialize()
    public get isObjectBased(): boolean {
        return this._isObjectBased;
    }

    /**
     * Sets whether or not the motion blur post-process is in object based mode.
     */
    public set isObjectBased(value: boolean) {
        if (this._isObjectBased === value) {
            return;
        }

        this._isObjectBased = value;
        this._applyMode();
    }

    private _isObjectBased: boolean = true;

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

    private _invViewProjection: Nullable<Matrix> = null;
    private _previousViewProjection: Nullable<Matrix> = null;

    /**
     * Gets a string identifying the name of the class
     * @returns "MotionBlurPostProcess" string
     */
    public getClassName(): string {
        return "MotionBlurPostProcess";
    }

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
            "motionBlur",
            ["motionStrength", "motionScale", "screenSize", "inverseViewProjection", "prevViewProjection", "projection"],
            ["velocitySampler", "depthSampler"],
            options,
            camera,
            samplingMode,
            engine,
            reusable,
            "#define GEOMETRY_SUPPORTED\n#define SAMPLES 64.0\n#define OBJECT_BASED",
            textureType,
            undefined,
            null,
            blockCompilation
        );

        this._forceGeometryBuffer = forceGeometryBuffer;

        // Set up assets
        if (this._forceGeometryBuffer) {
            scene.enableGeometryBufferRenderer();

            if (this._geometryBufferRenderer) {
                this._geometryBufferRenderer.enableVelocity = this._isObjectBased;
            }
        } else {
            scene.enablePrePassRenderer();

            if (this._prePassRenderer) {
                this._prePassRenderer.markAsDirty();
                this._prePassEffectConfiguration = new MotionBlurConfiguration();
            }
        }

        this._applyMode();
    }

    /**
     * Excludes the given skinned mesh from computing bones velocities.
     * Computing bones velocities can have a cost and that cost. The cost can be saved by calling this function and by passing the skinned mesh reference to ignore.
     * @param skinnedMesh The mesh containing the skeleton to ignore when computing the velocity map.
     */
    public excludeSkinnedMesh(skinnedMesh: AbstractMesh): void {
        if (skinnedMesh.skeleton) {
            let list;
            if (this._geometryBufferRenderer) {
                list = this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity;
            } else if (this._prePassRenderer) {
                list = this._prePassRenderer.excludedSkinnedMesh;
            } else {
                return;
            }
            list.push(skinnedMesh);
        }
    }

    /**
     * Removes the given skinned mesh from the excluded meshes to integrate bones velocities while rendering the velocity map.
     * @param skinnedMesh The mesh containing the skeleton that has been ignored previously.
     * @see excludeSkinnedMesh to exclude a skinned mesh from bones velocity computation.
     */
    public removeExcludedSkinnedMesh(skinnedMesh: AbstractMesh): void {
        if (skinnedMesh.skeleton) {
            let list;
            if (this._geometryBufferRenderer) {
                list = this._geometryBufferRenderer.excludedSkinnedMeshesFromVelocity;
            } else if (this._prePassRenderer) {
                list = this._prePassRenderer.excludedSkinnedMesh;
            } else {
                return;
            }

            const index = list.indexOf(skinnedMesh);
            if (index !== -1) {
                list.splice(index, 1);
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

    /**
     * Called on the mode changed (object based or screen based).
     * @returns void
     */
    private _applyMode() {
        if (!this._geometryBufferRenderer && !this._prePassRenderer) {
            // We can't get a velocity or depth texture. So, work as a passthrough.
            Logger.Warn("Multiple Render Target support needed to compute object based motion blur");
            return this.updateEffect();
        }

        if (this._geometryBufferRenderer) {
            this._geometryBufferRenderer.enableVelocity = this._isObjectBased;
        }

        this._updateEffect();

        this._invViewProjection = null;
        this._previousViewProjection = null;

        if (this.isObjectBased) {
            if (this._prePassRenderer && this._prePassEffectConfiguration) {
                this._prePassEffectConfiguration.texturesRequired[0] = Constants.PREPASS_VELOCITY_TEXTURE_TYPE;
            }

            this.onApply = (effect: Effect) => this._onApplyObjectBased(effect);
        } else {
            this._invViewProjection = Matrix.Identity();
            this._previousViewProjection = this._scene.getTransformMatrix().clone();

            if (this._prePassRenderer && this._prePassEffectConfiguration) {
                this._prePassEffectConfiguration.texturesRequired[0] = Constants.PREPASS_DEPTH_TEXTURE_TYPE;
            }

            this.onApply = (effect: Effect) => this._onApplyScreenBased(effect);
        }
    }

    /**
     * Called on the effect is applied when the motion blur post-process is in object based mode.
     * @param effect
     */
    private _onApplyObjectBased(effect: Effect): void {
        effect.setVector2("screenSize", new Vector2(this.width, this.height));

        effect.setFloat("motionScale", this._scene.getAnimationRatio());
        effect.setFloat("motionStrength", this.motionStrength);

        if (this._geometryBufferRenderer) {
            const velocityIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE);
            effect.setTexture("velocitySampler", this._geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
        } else if (this._prePassRenderer) {
            const velocityIndex = this._prePassRenderer.getIndex(Constants.PREPASS_VELOCITY_TEXTURE_TYPE);
            effect.setTexture("velocitySampler", this._prePassRenderer.getRenderTarget().textures[velocityIndex]);
        }
    }

    /**
     * Called on the effect is applied when the motion blur post-process is in screen based mode.
     * @param effect
     */
    private _onApplyScreenBased(effect: Effect): void {
        const viewProjection = TmpVectors.Matrix[0];
        viewProjection.copyFrom(this._scene.getTransformMatrix());

        viewProjection.invertToRef(this._invViewProjection!);
        effect.setMatrix("inverseViewProjection", this._invViewProjection!);

        effect.setMatrix("prevViewProjection", this._previousViewProjection!);
        this._previousViewProjection!.copyFrom(viewProjection);

        effect.setMatrix("projection", this._scene.getProjectionMatrix());

        effect.setVector2("screenSize", new Vector2(this.width, this.height));

        effect.setFloat("motionScale", this._scene.getAnimationRatio());
        effect.setFloat("motionStrength", this.motionStrength);

        if (this._geometryBufferRenderer) {
            const depthIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.DEPTH_TEXTURE_TYPE);
            effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[depthIndex]);
        } else if (this._prePassRenderer) {
            const depthIndex = this._prePassRenderer.getIndex(Constants.PREPASS_DEPTH_TEXTURE_TYPE);
            effect.setTexture("depthSampler", this._prePassRenderer.getRenderTarget().textures[depthIndex]);
        }
    }

    /**
     * Called on the effect must be updated (changed mode, samples count, etc.).
     */
    private _updateEffect(): void {
        if (this._geometryBufferRenderer || this._prePassRenderer) {
            const defines: string[] = [
                "#define GEOMETRY_SUPPORTED",
                "#define SAMPLES " + this._motionBlurSamples.toFixed(1),
                this._isObjectBased ? "#define OBJECT_BASED" : "#define SCREEN_BASED",
            ];

            this.updateEffect(defines.join("\n"));
        }
    }

    /**
     * @internal
     */
    public static _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<MotionBlurPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new MotionBlurPostProcess(
                    parsedPostProcess.name,
                    scene,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable,
                    parsedPostProcess.textureType,
                    false
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.MotionBlurPostProcess", MotionBlurPostProcess);
