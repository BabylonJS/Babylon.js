
import { Camera } from "../../../Cameras/camera";
import { Effect } from "../../../Materials/effect";
import { Texture } from "../../../Materials/Textures/texture";
import { DynamicTexture } from "../../../Materials/Textures/dynamicTexture";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture";
import { PostProcess } from "../../../PostProcesses/postProcess";
import { PostProcessRenderPipeline } from "../../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "../../../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { Scene } from "../../../scene";

import "../../../PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent";

import "../../../Shaders/chromaticAberration.fragment";
import "../../../Shaders/lensHighlights.fragment";
import "../../../Shaders/depthOfField.fragment";

/**
 * BABYLON.JS Chromatic Aberration GLSL Shader
 * Author: Olivier Guyot
 * Separates very slightly R, G and B colors on the edges of the screen
 * Inspired by Francois Tarlier & Martins Upitis
 */
export class LensRenderingPipeline extends PostProcessRenderPipeline {

    // Lens effects can be of the following:
    // - chromatic aberration (slight shift of RGB colors)
    // - blur on the edge of the lens
    // - lens distortion
    // - depth-of-field blur & highlights enhancing
    // - depth-of-field 'bokeh' effect (shapes appearing in blurred areas)
    // - grain effect (noise or custom texture)

    // Two additional texture samplers are needed:
    // - depth map (for depth-of-field)
    // - grain texture

    /**
     * @ignore
     * The chromatic aberration PostProcess id in the pipeline
     */
    public LensChromaticAberrationEffect: string = "LensChromaticAberrationEffect";
    /**
     * @ignore
     * The highlights enhancing PostProcess id in the pipeline
     */
    public HighlightsEnhancingEffect: string = "HighlightsEnhancingEffect";
    /**
     * @ignore
    * The depth-of-field PostProcess id in the pipeline
    */
    public LensDepthOfFieldEffect: string = "LensDepthOfFieldEffect";

    private _scene: Scene;
    private _depthTexture: RenderTargetTexture;
    private _grainTexture: Texture;

    private _chromaticAberrationPostProcess: PostProcess;
    private _highlightsPostProcess: PostProcess;
    private _depthOfFieldPostProcess: PostProcess;

    private _edgeBlur: number;
    private _grainAmount: number;
    private _chromaticAberration: number;
    private _distortion: number;
    private _highlightsGain: number;
    private _highlightsThreshold: number;
    private _dofDistance: number;
    private _dofAperture: number;
    private _dofDarken: number;
    private _dofPentagon: boolean;
    private _blurNoise: boolean;

    /**
     * @constructor
     *
     * Effect parameters are as follow:
     * {
     *      chromatic_aberration: number;       // from 0 to x (1 for realism)
     *      edge_blur: number;                  // from 0 to x (1 for realism)
     *      distortion: number;                 // from 0 to x (1 for realism)
     *      grain_amount: number;               // from 0 to 1
     *      grain_texture: BABYLON.Texture;     // texture to use for grain effect; if unset, use random B&W noise
     *      dof_focus_distance: number;         // depth-of-field: focus distance; unset to disable (disabled by default)
     *      dof_aperture: number;               // depth-of-field: focus blur bias (default: 1)
     *      dof_darken: number;                 // depth-of-field: darken that which is out of focus (from 0 to 1, disabled by default)
     *      dof_pentagon: boolean;              // depth-of-field: makes a pentagon-like "bokeh" effect
     *      dof_gain: number;                   // depth-of-field: highlights gain; unset to disable (disabled by default)
     *      dof_threshold: number;              // depth-of-field: highlights threshold (default: 1)
     *      blur_noise: boolean;                // add a little bit of noise to the blur (default: true)
     * }
     * Note: if an effect parameter is unset, effect is disabled
     *
     * @param name The rendering pipeline name
     * @param parameters - An object containing all parameters (see above)
     * @param scene The scene linked to this pipeline
     * @param ratio The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
     * @param cameras The array of cameras that the rendering pipeline will be attached to
     */
    constructor(name: string, parameters: any, scene: Scene, ratio: number = 1.0, cameras?: Camera[]) {
        super(scene.getEngine(), name);

        this._scene = scene;

        // Fetch texture samplers
        this._depthTexture = scene.enableDepthRenderer().getDepthMap(); // Force depth renderer "on"
        if (parameters.grain_texture) { this._grainTexture = parameters.grain_texture; }
        else { this._createGrainTexture(); }

        // save parameters
        this._edgeBlur = parameters.edge_blur ? parameters.edge_blur : 0;
        this._grainAmount = parameters.grain_amount ? parameters.grain_amount : 0;
        this._chromaticAberration = parameters.chromatic_aberration ? parameters.chromatic_aberration : 0;
        this._distortion = parameters.distortion ? parameters.distortion : 0;
        this._highlightsGain = parameters.dof_gain !== undefined ? parameters.dof_gain : -1;
        this._highlightsThreshold = parameters.dof_threshold ? parameters.dof_threshold : 1;
        this._dofDistance = parameters.dof_focus_distance !== undefined ? parameters.dof_focus_distance : -1;
        this._dofAperture = parameters.dof_aperture ? parameters.dof_aperture : 1;
        this._dofDarken = parameters.dof_darken ? parameters.dof_darken : 0;
        this._dofPentagon = parameters.dof_pentagon !== undefined ? parameters.dof_pentagon : true;
        this._blurNoise = parameters.blur_noise !== undefined ? parameters.blur_noise : true;

        // Create effects
        this._createChromaticAberrationPostProcess(ratio);
        this._createHighlightsPostProcess(ratio);
        this._createDepthOfFieldPostProcess(ratio / 4);

        // Set up pipeline
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.LensChromaticAberrationEffect, () => { return this._chromaticAberrationPostProcess; }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.HighlightsEnhancingEffect, () => { return this._highlightsPostProcess; }, true));
        this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.LensDepthOfFieldEffect, () => { return this._depthOfFieldPostProcess; }, true));

        if (this._highlightsGain === -1) {
            this._disableEffect(this.HighlightsEnhancingEffect, null);
        }

        // Finish
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }
    }

    /**
     * Get the class name
     * @returns "LensRenderingPipeline"
     */
    public getClassName(): string {
        return "LensRenderingPipeline";
    }

    // Properties

    /**
     * Gets associated scene
     */
    public get scene(): Scene {
        return this._scene;
    }

    /**
     * Gets or sets the edge blur
     */
    public get edgeBlur(): number {
        return this._edgeBlur;
    }

    public set edgeBlur(value: number) {
        this.setEdgeBlur(value);
    }

    /**
     * Gets or sets the grain amount
     */
    public get grainAmount(): number {
        return this._grainAmount;
    }

    public set grainAmount(value: number) {
        this.setGrainAmount(value);
    }

    /**
     * Gets or sets the chromatic aberration amount
     */
    public get chromaticAberration(): number {
        return this._chromaticAberration;
    }

    public set chromaticAberration(value: number) {
        this.setChromaticAberration(value);
    }

    /**
     * Gets or sets the depth of field aperture
     */
    public get dofAperture(): number {
        return this._dofAperture;
    }

    public set dofAperture(value: number) {
        this.setAperture(value);
    }

    /**
     * Gets or sets the edge distortion
     */
    public get edgeDistortion(): number {
        return this._distortion;
    }

    public set edgeDistortion(value: number) {
        this.setEdgeDistortion(value);
    }

    /**
     * Gets or sets the depth of field distortion
     */
    public get dofDistortion(): number {
        return this._dofDistance;
    }

    public set dofDistortion(value: number) {
        this.setFocusDistance(value);
    }

    /**
     * Gets or sets the darken out of focus amount
     */
    public get darkenOutOfFocus(): number {
        return this._dofDarken;
    }

    public set darkenOutOfFocus(value: number) {
        this.setDarkenOutOfFocus(value);
    }

    /**
     * Gets or sets a boolean indicating if blur noise is enabled
     */
    public get blurNoise(): boolean {
        return this._blurNoise;
    }

    public set blurNoise(value: boolean) {
        this._blurNoise = value;
    }

    /**
     * Gets or sets a boolean indicating if pentagon bokeh is enabled
     */
    public get pentagonBokeh(): boolean {
        return this._pentagonBokehIsEnabled;
    }

    public set pentagonBokeh(value: boolean) {
        if (value) {
            this.enablePentagonBokeh();
        } else {
            this.disablePentagonBokeh();
        }
    }

    /**
     * Gets or sets the highlight grain amount
     */
    public get highlightsGain(): number {
        return this._highlightsGain;
    }

    public set highlightsGain(value: number) {
        this.setHighlightsGain(value);
    }

    /**
     * Gets or sets the highlight threshold
     */
    public get highlightsThreshold(): number {
        return this._highlightsThreshold;
    }

    public set highlightsThreshold(value: number) {
        this.setHighlightsThreshold(value);
    }

    // public methods (self explanatory)
    /**
     * Sets the amount of blur at the edges
     * @param amount blur amount
     */
    public setEdgeBlur(amount: number) { this._edgeBlur = amount; }
    /**
     * Sets edge blur to 0
     */
    public disableEdgeBlur() { this._edgeBlur = 0; }
    /**
     * Sets the amount of grain
     * @param amount Amount of grain
     */
    public setGrainAmount(amount: number) { this._grainAmount = amount; }
    /**
     * Set grain amount to 0
     */
    public disableGrain() { this._grainAmount = 0; }
    /**
     * Sets the chromatic aberration amount
     * @param amount amount of chromatic aberration
     */
    public setChromaticAberration(amount: number) { this._chromaticAberration = amount; }
    /**
     * Sets chromatic aberration amount to 0
     */
    public disableChromaticAberration() { this._chromaticAberration = 0; }
    /**
     * Sets the EdgeDistortion amount
     * @param amount amount of EdgeDistortion
     */
    public setEdgeDistortion(amount: number) { this._distortion = amount; }
    /**
     * Sets edge distortion to 0
     */
    public disableEdgeDistortion() { this._distortion = 0; }
    /**
     * Sets the FocusDistance amount
     * @param amount amount of FocusDistance
     */
    public setFocusDistance(amount: number) { this._dofDistance = amount; }
    /**
    * Disables depth of field
    */
    public disableDepthOfField() { this._dofDistance = -1; }
    /**
     * Sets the Aperture amount
     * @param amount amount of Aperture
     */
    public setAperture(amount: number) { this._dofAperture = amount; }
    /**
     * Sets the DarkenOutOfFocus amount
     * @param amount amount of DarkenOutOfFocus
     */
    public setDarkenOutOfFocus(amount: number) { this._dofDarken = amount; }

    private _pentagonBokehIsEnabled = false;
    /**
     * Creates a pentagon bokeh effect
     */
    public enablePentagonBokeh() {
        this._highlightsPostProcess.updateEffect("#define PENTAGON\n");
        this._pentagonBokehIsEnabled = true;
    }
    /**
     * Disables the pentagon bokeh effect
     */
    public disablePentagonBokeh() {
        this._pentagonBokehIsEnabled = false;
        this._highlightsPostProcess.updateEffect();
    }
    /**
     * Enables noise blur
     */
    public enableNoiseBlur() { this._blurNoise = true; }
    /**
     * Disables noise blur
     */
    public disableNoiseBlur() { this._blurNoise = false; }
    /**
     * Sets the HighlightsGain amount
     * @param amount amount of HighlightsGain
     */
    public setHighlightsGain(amount: number) {
        this._highlightsGain = amount;
    }
    /**
     * Sets the HighlightsThreshold amount
     * @param amount amount of HighlightsThreshold
     */
    public setHighlightsThreshold(amount: number) {
        if (this._highlightsGain === -1) {
            this._highlightsGain = 1.0;
        }
        this._highlightsThreshold = amount;
    }
    /**
     * Disables highlights
     */
    public disableHighlights() {
        this._highlightsGain = -1;
    }

    /**
     * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
     * @param disableDepthRender If the scene's depth rendering should be disabled (default: false)
     */
    public dispose(disableDepthRender: boolean = false): void {
        this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

        (<any>this._chromaticAberrationPostProcess) = null;
        (<any>this._highlightsPostProcess) = null;
        (<any>this._depthOfFieldPostProcess) = null;

        this._grainTexture.dispose();

        if (disableDepthRender) {
            this._scene.disableDepthRenderer();
        }
    }

    // colors shifting and distortion
    private _createChromaticAberrationPostProcess(ratio: number): void {
        this._chromaticAberrationPostProcess = new PostProcess("LensChromaticAberration", "chromaticAberration",
            ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"],      // uniforms
            [],                                         // samplers
            ratio, null, Texture.TRILINEAR_SAMPLINGMODE,
            this._scene.getEngine(), false);

        this._chromaticAberrationPostProcess.onApply = (effect: Effect) => {
            effect.setFloat('chromatic_aberration', this._chromaticAberration);
            effect.setFloat('screen_width', this._scene.getEngine().getRenderWidth());
            effect.setFloat('screen_height', this._scene.getEngine().getRenderHeight());
            effect.setFloat('radialIntensity', 1);
            effect.setFloat2('direction', 17, 17);
            effect.setFloat2('centerPosition', 0.5, 0.5);
        };
    }

    // highlights enhancing
    private _createHighlightsPostProcess(ratio: number): void {
        this._highlightsPostProcess = new PostProcess("LensHighlights", "lensHighlights",
            ["gain", "threshold", "screen_width", "screen_height"],      // uniforms
            [],     // samplers
            ratio,
            null, Texture.TRILINEAR_SAMPLINGMODE,
            this._scene.getEngine(), false, this._dofPentagon ? "#define PENTAGON\n" : "");

        this._highlightsPostProcess.onApply = (effect: Effect) => {
            effect.setFloat('gain', this._highlightsGain);
            effect.setFloat('threshold', this._highlightsThreshold);
            effect.setTextureFromPostProcess("textureSampler", this._chromaticAberrationPostProcess);
            effect.setFloat('screen_width', this._scene.getEngine().getRenderWidth());
            effect.setFloat('screen_height', this._scene.getEngine().getRenderHeight());
        };
    }

    // colors shifting and distortion
    private _createDepthOfFieldPostProcess(ratio: number): void {
        this._depthOfFieldPostProcess = new PostProcess("LensDepthOfField", "depthOfField",
            [
                "grain_amount", "blur_noise", "screen_width", "screen_height", "distortion", "dof_enabled",
                "screen_distance", "aperture", "darken", "edge_blur", "highlights", "near", "far"
            ],
            ["depthSampler", "grainSampler", "highlightsSampler"],
            ratio, null, Texture.TRILINEAR_SAMPLINGMODE,
            this._scene.getEngine(), false);

        this._depthOfFieldPostProcess.onApply = (effect: Effect) => {

            effect.setTexture("depthSampler", this._depthTexture);
            effect.setTexture("grainSampler", this._grainTexture);
            effect.setTextureFromPostProcess("textureSampler", this._highlightsPostProcess);
            effect.setTextureFromPostProcess("highlightsSampler", this._depthOfFieldPostProcess);

            effect.setFloat('grain_amount', this._grainAmount);
            effect.setBool('blur_noise', this._blurNoise);

            effect.setFloat('screen_width', this._scene.getEngine().getRenderWidth());
            effect.setFloat('screen_height', this._scene.getEngine().getRenderHeight());

            effect.setFloat('distortion', this._distortion);

            effect.setBool('dof_enabled', (this._dofDistance !== -1));
            effect.setFloat('screen_distance', 1.0 / (0.1 - 1.0 / this._dofDistance));
            effect.setFloat('aperture', this._dofAperture);
            effect.setFloat('darken', this._dofDarken);

            effect.setFloat('edge_blur', this._edgeBlur);

            effect.setBool('highlights', (this._highlightsGain !== -1));

            if (this._scene.activeCamera) {
                effect.setFloat('near', this._scene.activeCamera.minZ);
                effect.setFloat('far', this._scene.activeCamera.maxZ);
            }
        };
    }

    // creates a black and white random noise texture, 512x512
    private _createGrainTexture(): void {
        var size = 512;

        this._grainTexture = new DynamicTexture("LensNoiseTexture", size, this._scene, false, Texture.BILINEAR_SAMPLINGMODE);
        this._grainTexture.wrapU = Texture.WRAP_ADDRESSMODE;
        this._grainTexture.wrapV = Texture.WRAP_ADDRESSMODE;

        var context = (<DynamicTexture>this._grainTexture).getContext();

        var rand = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        var value;
        for (var x = 0; x < size; x++) {
            for (var y = 0; y < size; y++) {
                value = Math.floor(rand(0.42, 0.58) * 255);
                context.fillStyle = 'rgb(' + value + ', ' + value + ', ' + value + ')';
                context.fillRect(x, y, 1, 1);
            }
        }
        (<DynamicTexture>this._grainTexture).update(false);
    }
}
