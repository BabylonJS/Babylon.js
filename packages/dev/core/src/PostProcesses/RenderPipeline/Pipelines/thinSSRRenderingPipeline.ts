import type { Nullable, CubeTexture, Scene, Camera } from "core/index";
import { Vector2 } from "core/Maths/math.vector";
import { ThinSSRPostProcess } from "core/PostProcesses/thinSSRPostProcess";
import { ThinSSRBlurPostProcess } from "core/PostProcesses/thinSSRBlurPostProcess";
import { ThinSSRBlurCombinerPostProcess } from "core/PostProcesses/thinSSRBlurCombinerPostProcess";

/**
 * The SSR rendering pipeline is used to generate a reflection based on a flat mirror model.
 */
export class ThinSSRRenderingPipeline {
    /** @internal */
    public readonly _ssrPostProcess: ThinSSRPostProcess;
    /** @internal */
    public readonly _ssrBlurXPostProcess: ThinSSRBlurPostProcess;
    /** @internal */
    public readonly _ssrBlurYPostProcess: ThinSSRBlurPostProcess;
    /** @internal */
    public readonly _ssrBlurCombinerPostProcess: ThinSSRBlurCombinerPostProcess;

    /**
     * Gets or sets the name of the rendering pipeline
     */
    public name: string;

    /**
     * Gets or sets a boolean indicating if the SSR rendering pipeline is supported
     */
    public get isSSRSupported(): boolean {
        return this._ssrPostProcess.isSSRSupported;
    }

    public set isSSRSupported(supported: boolean) {
        this._ssrPostProcess.isSSRSupported = supported;
    }

    /**
     * Gets or sets the maxDistance used to define how far we look for reflection during the ray-marching on the reflected ray (default: 1000).
     * Note that this value is a view (camera) space distance (not pixels!).
     */
    public get maxDistance() {
        return this._ssrPostProcess.maxDistance;
    }

    public set maxDistance(distance: number) {
        this._ssrPostProcess.maxDistance = distance;
    }

    /**
     * Gets or sets the step size used to iterate until the effect finds the color of the reflection's pixel. Should be an integer \>= 1 as it is the number of pixels we advance at each step (default: 1).
     * Use higher values to improve performances (but at the expense of quality).
     */
    public get step() {
        return this._ssrPostProcess.step;
    }

    public set step(step: number) {
        this._ssrPostProcess.step = step;
    }

    /**
     * Gets or sets the thickness value used as tolerance when computing the intersection between the reflected ray and the scene (default: 0.5).
     * If setting "enableAutomaticThicknessComputation" to true, you can use lower values for "thickness" (even 0), as the geometry thickness
     * is automatically computed thank to the regular depth buffer + the backface depth buffer
     */
    public get thickness() {
        return this._ssrPostProcess.thickness;
    }

    public set thickness(thickness: number) {
        this._ssrPostProcess.thickness = thickness;
    }

    /**
     * Gets or sets the current reflection strength. 1.0 is an ideal value but can be increased/decreased for particular results (default: 1).
     */
    public get strength() {
        return this._ssrPostProcess.strength;
    }

    public set strength(strength: number) {
        this._ssrPostProcess.strength = strength;
        this._ssrBlurCombinerPostProcess.strength = strength;
    }

    /**
     * Gets or sets the falloff exponent used to compute the reflection strength. Higher values lead to fainter reflections (default: 1).
     */
    public get reflectionSpecularFalloffExponent() {
        return this._ssrPostProcess.reflectionSpecularFalloffExponent;
    }

    public set reflectionSpecularFalloffExponent(exponent: number) {
        this._ssrPostProcess.reflectionSpecularFalloffExponent = exponent;
        this._ssrBlurCombinerPostProcess.reflectionSpecularFalloffExponent = exponent;
    }

    /**
     * Maximum number of steps during the ray marching process after which we consider an intersection could not be found (default: 1000).
     * Should be an integer value.
     */
    public get maxSteps() {
        return this._ssrPostProcess.maxSteps;
    }

    public set maxSteps(steps: number) {
        this._ssrPostProcess.maxSteps = steps;
    }

    /**
     * Gets or sets the factor applied when computing roughness. Default value is 0.2.
     * When blurring based on roughness is enabled (meaning blurDispersionStrength \> 0), roughnessFactor is used as a global roughness factor applied on all objects.
     * If you want to disable this global roughness set it to 0.
     */
    public get roughnessFactor() {
        return this._ssrPostProcess.roughnessFactor;
    }

    public set roughnessFactor(factor: number) {
        this._ssrPostProcess.roughnessFactor = factor;
    }

    /**
     * Number of steps to skip at start when marching the ray to avoid self collisions (default: 1)
     * 1 should normally be a good value, depending on the scene you may need to use a higher value (2 or 3)
     */
    public get selfCollisionNumSkip() {
        return this._ssrPostProcess.selfCollisionNumSkip;
    }

    public set selfCollisionNumSkip(skip: number) {
        this._ssrPostProcess.selfCollisionNumSkip = skip;
    }

    /**
     * Gets or sets the minimum value for one of the reflectivity component of the material to consider it for SSR (default: 0.04).
     * If all r/g/b components of the reflectivity is below or equal this value, the pixel will not be considered reflective and SSR won't be applied.
     */
    public get reflectivityThreshold() {
        return this._ssrPostProcess.reflectivityThreshold;
    }

    public set reflectivityThreshold(threshold: number) {
        const currentThreshold = this._ssrPostProcess.reflectivityThreshold;

        if (threshold === currentThreshold) {
            return;
        }

        this._ssrPostProcess.reflectivityThreshold = threshold;
        this._ssrBlurCombinerPostProcess.reflectivityThreshold = threshold;
    }

    /**
     * Gets or sets the downsample factor used to reduce the size of the texture used to compute the SSR contribution (default: 0).
     * Use 0 to render the SSR contribution at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     * Note that it is used only when blurring is enabled (blurDispersionStrength \> 0), because in that mode the SSR contribution is generated in a separate texture.
     */
    public ssrDownsample = 0;

    /**
     * Gets or sets the blur dispersion strength. Set this value to 0 to disable blurring (default: 0.03)
     * The reflections are blurred based on the roughness of the surface and the distance between the pixel shaded and the reflected pixel: the higher the distance the more blurry the reflection is.
     * blurDispersionStrength allows to increase or decrease this effect.
     */
    public get blurDispersionStrength() {
        return this._ssrBlurXPostProcess.blurStrength;
    }

    public set blurDispersionStrength(strength: number) {
        if (strength === this._ssrBlurXPostProcess.blurStrength) {
            return;
        }

        this._ssrPostProcess.useBlur = strength > 0;

        this._ssrBlurXPostProcess.blurStrength = strength;
        this._ssrBlurYPostProcess.blurStrength = strength;
    }

    /**
     * Gets or sets the downsample factor used to reduce the size of the textures used to blur the reflection effect (default: 0).
     * Use 0 to blur at full resolution, 1 to render at half resolution, 2 to render at 1/3 resolution, etc.
     */
    public blurDownsample = 0;

    /**
     * Gets or sets whether or not smoothing reflections is enabled (default: false)
     * Enabling smoothing will require more GPU power.
     * Note that this setting has no effect if step = 1: it's only used if step \> 1.
     */
    public get enableSmoothReflections(): boolean {
        return this._ssrPostProcess.enableSmoothReflections;
    }

    public set enableSmoothReflections(enabled: boolean) {
        this._ssrPostProcess.enableSmoothReflections = enabled;
    }

    /**
     * Gets or sets the environment cube texture used to define the reflection when the reflected rays of SSR leave the view space or when the maxDistance/maxSteps is reached.
     */
    public get environmentTexture() {
        return this._ssrPostProcess.environmentTexture;
    }

    public set environmentTexture(texture: Nullable<CubeTexture>) {
        this._ssrPostProcess.environmentTexture = texture;
    }

    /**
     * Gets or sets the boolean defining if the environment texture is a standard cubemap (false) or a probe (true). Default value is false.
     * Note: a probe cube texture is treated differently than an ordinary cube texture because the Y axis is reversed.
     */
    public get environmentTextureIsProbe(): boolean {
        return this._ssrPostProcess.environmentTextureIsProbe;
    }

    public set environmentTextureIsProbe(isProbe: boolean) {
        this._ssrPostProcess.environmentTextureIsProbe = isProbe;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated at the screen borders (default: true).
     */
    public get attenuateScreenBorders() {
        return this._ssrPostProcess.attenuateScreenBorders;
    }

    public set attenuateScreenBorders(attenuate: boolean) {
        this._ssrPostProcess.attenuateScreenBorders = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the distance of the intersection (default: true).
     */
    public get attenuateIntersectionDistance() {
        return this._ssrPostProcess.attenuateIntersectionDistance;
    }

    public set attenuateIntersectionDistance(attenuate: boolean) {
        this._ssrPostProcess.attenuateIntersectionDistance = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated according to the number of iterations performed to find the intersection (default: true).
     */
    public get attenuateIntersectionIterations() {
        return this._ssrPostProcess.attenuateIntersectionIterations;
    }

    public set attenuateIntersectionIterations(attenuate: boolean) {
        this._ssrPostProcess.attenuateIntersectionIterations = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the reflections should be attenuated when the reflection ray is facing the camera (the view direction) (default: false).
     */
    public get attenuateFacingCamera() {
        return this._ssrPostProcess.attenuateFacingCamera;
    }

    public set attenuateFacingCamera(attenuate: boolean) {
        this._ssrPostProcess.attenuateFacingCamera = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the backface reflections should be attenuated (default: false).
     */
    public get attenuateBackfaceReflection() {
        return this._ssrPostProcess.attenuateBackfaceReflection;
    }

    public set attenuateBackfaceReflection(attenuate: boolean) {
        this._ssrPostProcess.attenuateBackfaceReflection = attenuate;
    }

    /**
     * Gets or sets a boolean indicating if the ray should be clipped to the frustum (default: true).
     * You can try to set this parameter to false to save some performances: it may produce some artefacts in some cases, but generally they won't really be visible
     */
    public get clipToFrustum() {
        return this._ssrPostProcess.clipToFrustum;
    }

    public set clipToFrustum(clip: boolean) {
        this._ssrPostProcess.clipToFrustum = clip;
    }

    /**
     * Gets or sets a boolean indicating whether the blending between the current color pixel and the reflection color should be done with a Fresnel coefficient (default: false).
     * It is more physically accurate to use the Fresnel coefficient (otherwise it uses the reflectivity of the material for blending), but it is also more expensive when you use blur (when blurDispersionStrength \> 0).
     */
    public get useFresnel() {
        return this._ssrPostProcess.useFresnel;
    }

    public set useFresnel(fresnel: boolean) {
        this._ssrPostProcess.useFresnel = fresnel;
        this._ssrBlurCombinerPostProcess.useFresnel = fresnel;
    }

    /**
     * Gets or sets a boolean defining if geometry thickness should be computed automatically (default: false).
     * When enabled, a depth renderer is created which will render the back faces of the scene to a depth texture (meaning additional work for the GPU).
     * In that mode, the "thickness" property is still used as an offset to compute the ray intersection, but you can typically use a much lower
     * value than when enableAutomaticThicknessComputation is false (it's even possible to use a value of 0 when using low values for "step")
     * Note that for performance reasons, this option will only apply to the first camera to which the rendering pipeline is attached!
     */
    public get enableAutomaticThicknessComputation(): boolean {
        return this._ssrPostProcess.enableAutomaticThicknessComputation;
    }

    public set enableAutomaticThicknessComputation(automatic: boolean) {
        if (this._ssrPostProcess.enableAutomaticThicknessComputation === automatic) {
            return;
        }

        this._ssrPostProcess.enableAutomaticThicknessComputation = automatic;
    }

    /**
     * Gets or sets a boolean defining if the input color texture is in gamma space (default: true)
     * The SSR effect works in linear space, so if the input texture is in gamma space, we must convert the texture to linear space before applying the effect
     */
    public get inputTextureColorIsInGammaSpace(): boolean {
        return this._ssrPostProcess.inputTextureColorIsInGammaSpace;
    }

    public set inputTextureColorIsInGammaSpace(gammaSpace: boolean) {
        if (this._ssrPostProcess.inputTextureColorIsInGammaSpace === gammaSpace) {
            return;
        }

        this._ssrPostProcess.inputTextureColorIsInGammaSpace = gammaSpace;
        this._ssrBlurCombinerPostProcess.inputTextureColorIsInGammaSpace = gammaSpace;
    }

    /**
     * Gets or sets a boolean defining if the output color texture generated by the SSR pipeline should be in gamma space (default: true)
     * If you have a post-process that comes after the SSR and that post-process needs the input to be in a linear space, you must disable generateOutputInGammaSpace
     */
    public get generateOutputInGammaSpace(): boolean {
        return this._ssrPostProcess.generateOutputInGammaSpace;
    }

    public set generateOutputInGammaSpace(gammaSpace: boolean) {
        if (this._ssrPostProcess.generateOutputInGammaSpace === gammaSpace) {
            return;
        }

        this._ssrPostProcess.generateOutputInGammaSpace = gammaSpace;
        this._ssrBlurCombinerPostProcess.generateOutputInGammaSpace = gammaSpace;
    }

    /**
     * Gets or sets a boolean indicating if the effect should be rendered in debug mode (default: false).
     * In this mode, colors have this meaning:
     *   - blue: the ray hit the max distance (we reached maxDistance)
     *   - red: the ray ran out of steps (we reached maxSteps)
     *   - yellow: the ray went off screen
     *   - green: the ray hit a surface. The brightness of the green color is proportional to the distance between the ray origin and the intersection point: A brighter green means more computation than a darker green.
     * In the first 3 cases, the final color is calculated by mixing the skybox color with the pixel color (if environmentTexture is defined), otherwise the pixel color is not modified
     * You should try to get as few blue/red/yellow pixels as possible, as this means that the ray has gone further than if it had hit a surface.
     */
    public get debug(): boolean {
        return this._ssrPostProcess.debug;
    }

    public set debug(value: boolean) {
        if (this._ssrPostProcess.debug === value) {
            return;
        }

        this._ssrPostProcess.debug = value;
        this._ssrBlurCombinerPostProcess.debug = value;
    }

    /**
     * Gets or sets the camera to use to render the reflection
     */
    public get camera() {
        return this._ssrPostProcess.camera;
    }

    public set camera(camera: Nullable<Camera>) {
        this._ssrPostProcess.camera = camera;
        this._ssrBlurCombinerPostProcess.camera = camera;
    }

    /**
     * Gets or sets a boolean indicating if the depth buffer stores screen space depth instead of camera view space depth.
     */
    public get useScreenspaceDepth() {
        return this._ssrPostProcess.useScreenspaceDepth;
    }

    public set useScreenspaceDepth(use: boolean) {
        this._ssrPostProcess.useScreenspaceDepth = use;
        this._ssrBlurCombinerPostProcess.useScreenspaceDepth = use;
    }

    /**
     * Gets or sets a boolean indicating if the normals are in world space (false by default, meaning normals are in camera view space).
     */
    public get normalsAreInWorldSpace() {
        return this._ssrPostProcess.normalsAreInWorldSpace;
    }

    public set normalsAreInWorldSpace(normalsAreInWorldSpace: boolean) {
        this._ssrPostProcess.normalsAreInWorldSpace = normalsAreInWorldSpace;
        this._ssrBlurCombinerPostProcess.normalsAreInWorldSpace = normalsAreInWorldSpace;
    }

    /**
     * Gets or sets a boolean indicating if the normals are encoded as unsigned, that is normalUnsigned = normal*0.5+0.5 (false by default).
     */
    public get normalsAreUnsigned() {
        return this._ssrPostProcess.normalsAreUnsigned;
    }

    public set normalsAreUnsigned(normalsAreUnsigned: boolean) {
        this._ssrPostProcess.normalsAreUnsigned = normalsAreUnsigned;
        this._ssrBlurCombinerPostProcess.normalsAreUnsigned = normalsAreUnsigned;
    }

    /**
     * Checks if all the post processes in the pipeline are ready.
     * @returns true if all the post processes in the pipeline are ready
     */
    public isReady(): boolean {
        return this._ssrPostProcess.isReady() && this._ssrBlurXPostProcess.isReady() && this._ssrBlurYPostProcess.isReady() && this._ssrBlurCombinerPostProcess.isReady();
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

        this._ssrPostProcess = new ThinSSRPostProcess(this.name, this._scene);
        this._ssrBlurXPostProcess = new ThinSSRBlurPostProcess(this.name + " BlurX", this._scene.getEngine(), new Vector2(1, 0));
        this._ssrBlurYPostProcess = new ThinSSRBlurPostProcess(this.name + " BlurY", this._scene.getEngine(), new Vector2(0, 1));
        this._ssrBlurCombinerPostProcess = new ThinSSRBlurCombinerPostProcess(this.name + " BlurCombiner", this._scene.getEngine());

        this._ssrPostProcess.useBlur = this._ssrBlurXPostProcess.blurStrength > 0;
    }

    /**
     * Disposes of the pipeline
     */
    public dispose(): void {
        this._ssrPostProcess?.dispose();
        this._ssrBlurXPostProcess?.dispose();
        this._ssrBlurYPostProcess?.dispose();
        this._ssrBlurCombinerPostProcess?.dispose();
    }
}
