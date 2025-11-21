import type { EffectWrapperCreationOptions, Scene } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Matrix, TmpVectors } from "../Maths/math.vector";

/**
 * Post process used to apply a motion blur post process
 */
export class ThinMotionBlurPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "motionBlur";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["motionStrength", "motionScale", "screenSize", "inverseViewProjection", "prevViewProjection", "projection"];

    /**
     * The list of samplers used by the effect
     */
    public static readonly Samplers = ["velocitySampler", "depthSampler"];

    /**
     * The default defines used by the effect
     */
    public static readonly Defines = "#define GEOMETRY_SUPPORTED\n#define SAMPLES 64.0\n#define OBJECT_BASED";

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/motionBlur.fragment"));
        } else {
            list.push(import("../Shaders/motionBlur.fragment"));
        }
    }

    private _scene: Scene;
    private _invViewProjection = Matrix.Identity();
    private _previousViewProjection = Matrix.Identity();

    /**
     * Constructs a new motion blur post process
     * @param name Name of the effect
     * @param scene The scene the effect belongs to
     * @param options Options to configure the effect
     */
    constructor(name: string, scene: Scene, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: scene.getEngine(),
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinMotionBlurPostProcess.FragmentUrl,
            uniforms: ThinMotionBlurPostProcess.Uniforms,
            samplers: ThinMotionBlurPostProcess.Samplers,
            defines: ThinMotionBlurPostProcess.Defines,
        });

        this._scene = scene;

        this._applyMode();
    }

    /**
     * Defines how much the image is blurred by the movement. Default value is equal to 1
     */
    public motionStrength: number = 1;

    private _motionBlurSamples: number = 32;

    /**
     * Gets the number of iterations that are used for motion blur quality. Default value is equal to 32
     */
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

    private _isObjectBased: boolean = true;

    /**
     * Gets whether or not the motion blur post-process is in object based mode.
     */
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

    /**
     * The width of the source texture
     */
    public textureWidth: number = 0;

    /**
     * The height of the source texture
     */
    public textureHeight: number = 0;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        effect.setFloat("motionScale", this._scene.getAnimationRatio());
        effect.setFloat("motionStrength", this.motionStrength);

        if (!this.isObjectBased) {
            const viewProjection = TmpVectors.Matrix[0];
            viewProjection.copyFrom(this._scene.getTransformMatrix());

            viewProjection.invertToRef(this._invViewProjection);
            effect.setMatrix("inverseViewProjection", this._invViewProjection);

            effect.setMatrix("prevViewProjection", this._previousViewProjection);
            this._previousViewProjection.copyFrom(viewProjection);

            effect.setMatrix("projection", this._scene.getProjectionMatrix());
        }
    }

    private _updateEffect(): void {
        const defines: string[] = [
            "#define GEOMETRY_SUPPORTED",
            "#define SAMPLES " + this._motionBlurSamples.toFixed(1),
            this._isObjectBased ? "#define OBJECT_BASED" : "#define SCREEN_BASED",
        ];

        this.updateEffect(defines.join("\n"));
    }

    private _applyMode() {
        this._updateEffect();
        this._previousViewProjection.copyFrom(this._scene.getTransformMatrix());
    }
}
