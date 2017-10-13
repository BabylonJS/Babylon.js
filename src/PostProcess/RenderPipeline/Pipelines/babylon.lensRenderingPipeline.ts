// BABYLON.JS Chromatic Aberration GLSL Shader
// Author: Olivier Guyot
// Separates very slightly R, G and B colors on the edges of the screen
// Inspired by Francois Tarlier & Martins Upitis


module BABYLON {
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
        * The chromatic aberration PostProcess id in the pipeline
        * @type {string}
        */
        public LensChromaticAberrationEffect: string = "LensChromaticAberrationEffect";
        /**
        * The highlights enhancing PostProcess id in the pipeline
        * @type {string}
        */
        public HighlightsEnhancingEffect: string = "HighlightsEnhancingEffect";
        /**
        * The depth-of-field PostProcess id in the pipeline
        * @type {string}
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
         * @param {string} name - The rendering pipeline name
         * @param {object} parameters - An object containing all parameters (see above)
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
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

        // public methods (self explanatory)

        public setEdgeBlur(amount: number) { this._edgeBlur = amount; }
        public disableEdgeBlur() { this._edgeBlur = 0; }
        public setGrainAmount(amount: number) { this._grainAmount = amount; }
        public disableGrain() { this._grainAmount = 0; }
        public setChromaticAberration(amount: number) { this._chromaticAberration = amount; }
        public disableChromaticAberration() { this._chromaticAberration = 0; }
        public setEdgeDistortion(amount: number) { this._distortion = amount; }
        public disableEdgeDistortion() { this._distortion = 0; }
        public setFocusDistance(amount: number) { this._dofDistance = amount; }
        public disableDepthOfField() { this._dofDistance = -1; }
        public setAperture(amount: number) { this._dofAperture = amount; }
        public setDarkenOutOfFocus(amount: number) { this._dofDarken = amount; }
        public enablePentagonBokeh() {
            this._highlightsPostProcess.updateEffect("#define PENTAGON\n");
        }
        public disablePentagonBokeh() {
            this._highlightsPostProcess.updateEffect();
        }
        public enableNoiseBlur() { this._blurNoise = true; }
        public disableNoiseBlur() { this._blurNoise = false; }
        public setHighlightsGain(amount: number) {
            this._highlightsGain = amount;
        }
        public setHighlightsThreshold(amount: number) {
            if (this._highlightsGain === -1) {
                this._highlightsGain = 1.0;
            }
            this._highlightsThreshold = amount;
        }
        public disableHighlights() {
            this._highlightsGain = -1;
        }

        /**
         * Removes the internal pipeline assets and detaches the pipeline from the scene cameras
         */
        public dispose(disableDepthRender: boolean = false): void {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

            this._chromaticAberrationPostProcess = undefined;
            this._highlightsPostProcess = undefined;
            this._depthOfFieldPostProcess = undefined;

            this._grainTexture.dispose();

            if (disableDepthRender)
                this._scene.disableDepthRenderer();
        }

        // colors shifting and distortion
        private _createChromaticAberrationPostProcess(ratio: number): void {
            this._chromaticAberrationPostProcess = new PostProcess("LensChromaticAberration", "chromaticAberration",
                ["chromatic_aberration", "screen_width", "screen_height"],      // uniforms
                [],                                         // samplers
                ratio, null, Texture.TRILINEAR_SAMPLINGMODE,
                this._scene.getEngine(), false);

            this._chromaticAberrationPostProcess.onApply = (effect: Effect) => {
                effect.setFloat('chromatic_aberration', this._chromaticAberration);
                effect.setFloat('screen_width', this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', this._scene.getEngine().getRenderingCanvas().height);
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
                effect.setFloat('screen_width', this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', this._scene.getEngine().getRenderingCanvas().height);
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

                effect.setFloat('screen_width', this._scene.getEngine().getRenderingCanvas().width);
                effect.setFloat('screen_height', this._scene.getEngine().getRenderingCanvas().height);

                effect.setFloat('distortion', this._distortion);

                effect.setBool('dof_enabled', (this._dofDistance !== -1));
                effect.setFloat('screen_distance', 1.0 / (0.1 - 1.0 / this._dofDistance));
                effect.setFloat('aperture', this._dofAperture);
                effect.setFloat('darken', this._dofDarken);

                effect.setFloat('edge_blur', this._edgeBlur);

                effect.setBool('highlights', (this._highlightsGain !== -1));

                effect.setFloat('near', this._scene.activeCamera.minZ);
                effect.setFloat('far', this._scene.activeCamera.maxZ);
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
            }

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
}
