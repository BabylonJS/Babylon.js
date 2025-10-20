import type { Camera, Nullable, Scene } from "core/index";
import { ThinSSAO2PostProcess } from "core/PostProcesses/thinSSAO2PostProcess";
import { ThinSSAO2BlurPostProcess } from "core/PostProcesses/thinSSAO2BlurPostProcess";
import { ThinSSAO2CombinePostProcess } from "core/PostProcesses/thinSSAO2CombinePostProcess";

/**
 * The SSAO2 rendering pipeline is used to generate ambient occlusion effects.
 */
export class ThinSSAO2RenderingPipeline {
    /** @internal */
    public readonly _ssaoPostProcess: ThinSSAO2PostProcess;
    /** @internal */
    public readonly _ssaoBlurXPostProcess: ThinSSAO2BlurPostProcess;
    /** @internal */
    public readonly _ssaoBlurYPostProcess: ThinSSAO2BlurPostProcess;
    /** @internal */
    public readonly _ssaoCombinePostProcess: ThinSSAO2CombinePostProcess;

    /**
     * Gets or sets the name of the rendering pipeline
     */
    public name: string;

    /**
     * The camera to which the rendering pipeline will be applied.
     */
    public get camera() {
        return this._ssaoPostProcess.camera;
    }

    public set camera(camera: Nullable<Camera>) {
        this._ssaoPostProcess.camera = camera;
        this._ssaoCombinePostProcess.camera = camera;
    }

    /**
     * Number of samples used for the SSAO calculations. Default value is 8.
     */
    public set samples(n: number) {
        this._ssaoPostProcess.samples = n;
    }
    public get samples(): number {
        return this._ssaoPostProcess.samples;
    }

    /**
     * The output strength of the SSAO post-process. Default value is 1.0.
     */
    public get totalStrength() {
        return this._ssaoPostProcess.totalStrength;
    }

    public set totalStrength(value: number) {
        this._ssaoPostProcess.totalStrength = value;
    }

    /**
     * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
     */
    public get radius() {
        return this._ssaoPostProcess.radius;
    }

    public set radius(value: number) {
        this._ssaoPostProcess.radius = value;
    }

    /**
     * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
     */
    public get maxZ() {
        return this._ssaoPostProcess.maxZ;
    }

    public set maxZ(value: number) {
        this._ssaoPostProcess.maxZ = value;
    }

    /**
     * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much.
     */
    public get minZAspect() {
        return this._ssaoPostProcess.minZAspect;
    }

    public set minZAspect(value: number) {
        this._ssaoPostProcess.minZAspect = value;
    }

    /**
     * The base color of the SSAO post-process
     * The final result is "base + ssao" between [0, 1]
     */
    public get base() {
        return this._ssaoPostProcess.base;
    }

    public set base(value: number) {
        this._ssaoPostProcess.base = value;
    }

    /**
     * Used in SSAO calculations to compensate for accuracy issues with depth values. Default 0.02.
     *
     * Normally you do not need to change this value, but you can experiment with it if you get a lot of in false self-occlusion on flat surfaces when using fewer than 16 samples. Useful range is normally [0..0.1] but higher values is allowed.
     */
    public get epsilon(): number {
        return this._ssaoPostProcess.epsilon;
    }

    public set epsilon(n: number) {
        this._ssaoPostProcess.epsilon = n;
    }

    /**
     * Skips the denoising (blur) stage of the SSAO calculations.
     *
     * Useful to temporarily set while experimenting with the other SSAO2 settings.
     */
    public set bypassBlur(b: boolean) {
        this._ssaoBlurXPostProcess.bypassBlur = b;
        this._ssaoBlurYPostProcess.bypassBlur = b;
    }

    public get bypassBlur(): boolean {
        return this._ssaoBlurXPostProcess.bypassBlur;
    }

    /**
     * Enables the configurable bilateral denoising (blurring) filter. Default is true.
     * Set to false to instead use a legacy bilateral filter that can't be configured.
     *
     * The denoising filter runs after the SSAO calculations and is a very important step. Both options results in a so called bilateral being used, but the "expensive" one can be
     * configured in several ways to fit your scene.
     */
    public set expensiveBlur(b: boolean) {
        this._ssaoBlurXPostProcess.expensiveBlur = b;
        this._ssaoBlurYPostProcess.expensiveBlur = b;
    }

    public get expensiveBlur(): boolean {
        return this._ssaoBlurXPostProcess.expensiveBlur;
    }

    /**
     * The number of samples the bilateral filter uses in both dimensions when denoising the SSAO calculations. Default value is 16.
     *
     * A higher value should result in smoother shadows but will use more processing time in the shaders.
     *
     * A high value can cause the shadows to get to blurry or create visible artifacts (bands) near sharp details in the geometry. The artifacts can sometimes be mitigated by increasing the bilateralSoften setting.
     */
    public get bilateralSamples() {
        return this._ssaoBlurXPostProcess.bilateralSamples;
    }

    public set bilateralSamples(n: number) {
        this._ssaoBlurXPostProcess.bilateralSamples = n;
        this._ssaoBlurYPostProcess.bilateralSamples = n;
    }

    /**
     * Controls the shape of the denoising kernel used by the bilateral filter. Default value is 0.
     *
     * By default the bilateral filter acts like a box-filter, treating all samples on the same depth with equal weights. This is effective to maximize the denoising effect given a limited set of samples. However, it also often results in visible ghosting around sharp shadow regions and can spread out lines over large areas so they are no longer visible.
     *
     * Increasing this setting will make the filter pay less attention to samples further away from the center sample, reducing many artifacts but at the same time increasing noise.
     *
     * Useful value range is [0..1].
     */
    public get bilateralSoften() {
        return this._ssaoBlurXPostProcess.bilateralSoften;
    }

    public set bilateralSoften(n: number) {
        this._ssaoBlurXPostProcess.bilateralSoften = n;
        this._ssaoBlurYPostProcess.bilateralSoften = n;
    }

    /**
     * How forgiving the bilateral denoiser should be when rejecting samples. Default value is 0.
     *
     * A higher value results in the bilateral filter being more forgiving and thus doing a better job at denoising slanted and curved surfaces, but can lead to shadows spreading out around corners or between objects that are close to each other depth wise.
     *
     * Useful value range is normally [0..1], but higher values are allowed.
     */
    public get bilateralTolerance() {
        return this._ssaoBlurXPostProcess.bilateralTolerance;
    }

    public set bilateralTolerance(n: number) {
        this._ssaoBlurXPostProcess.bilateralTolerance = n;
        this._ssaoBlurYPostProcess.bilateralTolerance = n;
    }

    /**
     * Indicates that the combine stage should use the current camera viewport to render the SSAO result on only a portion of the output texture (default: true).
     */
    public get useViewportInCombineStage() {
        return this._ssaoCombinePostProcess.useViewportInCombineStage;
    }

    public set useViewportInCombineStage(b: boolean) {
        this._ssaoCombinePostProcess.useViewportInCombineStage = b;
    }

    /**
     * Checks if all the post processes in the pipeline are ready.
     * @returns true if all the post processes in the pipeline are ready
     */
    public isReady(): boolean {
        return this._ssaoPostProcess.isReady() && this._ssaoBlurXPostProcess.isReady() && this._ssaoBlurYPostProcess.isReady() && this._ssaoCombinePostProcess.isReady();
    }

    private _scene: Scene;

    /**
     * Constructor of the SSR rendering pipeline
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     */
    constructor(name: string, scene: Scene) {
        this.name = name;
        this._scene = scene;

        this._ssaoPostProcess = new ThinSSAO2PostProcess(this.name, this._scene);
        this._ssaoBlurXPostProcess = new ThinSSAO2BlurPostProcess(this.name + " BlurX", this._scene.getEngine(), true);
        this._ssaoBlurYPostProcess = new ThinSSAO2BlurPostProcess(this.name + " BlurY", this._scene.getEngine(), false);
        this._ssaoCombinePostProcess = new ThinSSAO2CombinePostProcess(this.name + " Combiner", this._scene.getEngine());
    }

    /**
     * Disposes of the pipeline
     */
    public dispose(): void {
        this._ssaoPostProcess?.dispose();
        this._ssaoBlurXPostProcess?.dispose();
        this._ssaoBlurYPostProcess?.dispose();
        this._ssaoCombinePostProcess?.dispose();
    }
}
