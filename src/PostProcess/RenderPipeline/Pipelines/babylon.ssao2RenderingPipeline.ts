module BABYLON {
    export class SSAO2RenderingPipeline extends PostProcessRenderPipeline {
        // Members

        /**
        * The PassPostProcess id in the pipeline that contains the original scene color
        * @type {string}
        */
        public SSAOOriginalSceneColorEffect: string = "SSAOOriginalSceneColorEffect";
        /**
        * The SSAO PostProcess id in the pipeline
        * @type {string}
        */
        public SSAORenderEffect: string = "SSAORenderEffect";
        /**
        * The horizontal blur PostProcess id in the pipeline
        * @type {string}
        */
        public SSAOBlurHRenderEffect: string = "SSAOBlurHRenderEffect";
        /**
        * The vertical blur PostProcess id in the pipeline
        * @type {string}
        */
        public SSAOBlurVRenderEffect: string = "SSAOBlurVRenderEffect";
        /**
        * The PostProcess id in the pipeline that combines the SSAO-Blur output with the original scene color (SSAOOriginalSceneColorEffect)
        * @type {string}
        */
        public SSAOCombineRenderEffect: string = "SSAOCombineRenderEffect";

        /**
        * The output strength of the SSAO post-process. Default value is 1.0.
        * @type {number}
        */
        @serialize()
        public totalStrength: number = 1.0;

        /**
        * Maximum depth value to still render AO. A smooth falloff makes the dimming more natural, so there will be no abrupt shading change.
        * @type {number}
        */
        @serialize()
        public maxZ: number = 100.0;

        /**
        * In order to save performances, SSAO radius is clamped on close geometry. This ratio changes by how much
        * @type {number}
        */
        @serialize()
        public minZAspect: number = 0.2;

        /**
        * Number of samples used for the SSAO calculations. Default value is 8
        * @type {number}
        */
        @serialize("samples")
        private _samples: number = 8;

        /**
        * Dynamically generated sphere sampler.
        * @type {number[]}
        */
        private _sampleSphere: number[];

        /**
        * Blur filter offsets
        * @type {number[]}
        */
        private _samplerOffsets: number[];

        public set samples(n: number) {
            this._ssaoPostProcess.updateEffect("#define SAMPLES " + n + "\n#define SSAO");
            this._samples = n;
            this._sampleSphere = this._generateHemisphere();

            this._firstUpdate = true;
        }

        public get samples(): number {
            return this._samples;
        }

        /**
        * Are we using bilateral blur ?
        * @type {boolean}
        */
        @serialize("expensiveBlur")
        private _expensiveBlur: boolean = true;
        public set expensiveBlur(b: boolean) {
            this._blurHPostProcess.updateEffect("#define BILATERAL_BLUR\n#define BILATERAL_BLUR_H\n#define SAMPLES 16\n#define EXPENSIVE " + (b ? "1" : "0") + "\n",
                null, ["textureSampler", "depthSampler"]);
            this._blurVPostProcess.updateEffect("#define BILATERAL_BLUR\n#define SAMPLES 16\n#define EXPENSIVE " + (b ? "1" : "0") + "\n",
                null, ["textureSampler", "depthSampler"]);
            this._expensiveBlur = b;
            this._firstUpdate = true;
        }

        public get expensiveBlur(): boolean {
            return this._expensiveBlur;
        }

        /**
        * The radius around the analyzed pixel used by the SSAO post-process. Default value is 2.0
        * @type {number}
        */
        @serialize()
        public radius: number = 2.0;

        /**
        * The base color of the SSAO post-process
        * The final result is "base + ssao" between [0, 1]
        * @type {number}
        */
        @serialize()
        public base: number = 0.1;

        /**
        *  Support test.
        * @type {boolean}
        */
        public static get IsSupported(): boolean {
            var engine = Engine.LastCreatedEngine;
            if (!engine) {
                return false;
            }
            return engine.getCaps().drawBuffersExtension;
        }

        private _scene: Scene;
        private _depthTexture: Texture;
        private _normalTexture: Texture;
        private _randomTexture: DynamicTexture;

        private _originalColorPostProcess: PassPostProcess;
        private _ssaoPostProcess: PostProcess;
        private _blurHPostProcess: PostProcess;
        private _blurVPostProcess: PostProcess;
        private _ssaoCombinePostProcess: PostProcess;

        private _firstUpdate: boolean = true;

        /**
         * @constructor
         * @param {string} name - The rendering pipeline name
         * @param {BABYLON.Scene} scene - The scene linked to this pipeline
         * @param {any} ratio - The size of the postprocesses. Can be a number shared between passes or an object for more precision: { ssaoRatio: 0.5, blurRatio: 1.0 }
         * @param {BABYLON.Camera[]} cameras - The array of cameras that the rendering pipeline will be attached to
         */
        constructor(name: string, scene: Scene, ratio: any, cameras?: Camera[]) {
            super(scene.getEngine(), name);

            this._scene = scene;

            if (!this.isSupported) {
                Tools.Error("SSAO 2 needs WebGL 2 support.");
                return;
            }

            var ssaoRatio = ratio.ssaoRatio || ratio;
            var blurRatio = ratio.blurRatio || ratio;

            // Set up assets
            let geometryBufferRenderer = <GeometryBufferRenderer>scene.enableGeometryBufferRenderer();
            this._createRandomTexture();
            this._depthTexture = geometryBufferRenderer.getGBuffer().textures[0];
            this._normalTexture = geometryBufferRenderer.getGBuffer().textures[1];

            this._originalColorPostProcess = new PassPostProcess("SSAOOriginalSceneColor", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);
            this._createSSAOPostProcess(1.0);
            this._createBlurPostProcess(ssaoRatio, blurRatio);
            this._createSSAOCombinePostProcess(blurRatio);

            // Set up pipeline
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOOriginalSceneColorEffect, () => { return this._originalColorPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAORenderEffect, () => { return this._ssaoPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurHRenderEffect, () => { return this._blurHPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOBlurVRenderEffect, () => { return this._blurVPostProcess; }, true));
            this.addEffect(new PostProcessRenderEffect(scene.getEngine(), this.SSAOCombineRenderEffect, () => { return this._ssaoCombinePostProcess; }, true));

            // Finish
            scene.postProcessRenderPipelineManager.addPipeline(this);
            if (cameras)
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);

        }

        // Public Methods

        /**
         * Removes the internal pipeline assets and detatches the pipeline from the scene cameras
         */
        public dispose(disableGeometryBufferRenderer: boolean = false): void {
            for (var i = 0; i < this._scene.cameras.length; i++) {
                var camera = this._scene.cameras[i];

                this._originalColorPostProcess.dispose(camera);
                this._ssaoPostProcess.dispose(camera);
                this._blurHPostProcess.dispose(camera);
                this._blurVPostProcess.dispose(camera);
                this._ssaoCombinePostProcess.dispose(camera);
            }

            this._randomTexture.dispose();

            if (disableGeometryBufferRenderer)
                this._scene.disableGeometryBufferRenderer();

            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this._name, this._scene.cameras);

            super.dispose();
        }

        // Private Methods
        private _createBlurPostProcess(ssaoRatio: number, blurRatio: number): void {
            this._samplerOffsets = [];
            var expensive = this.expensiveBlur;

            for (var i = -8; i < 8; i++) {
                this._samplerOffsets.push(i * 2 + 0.5);
            }

            this._blurHPostProcess = new PostProcess("BlurH", "ssao2", ["outSize", "samplerOffsets", "near", "far", "radius"], ["depthSampler"], ssaoRatio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define BILATERAL_BLUR_H\n#define SAMPLES 16\n#define EXPENSIVE " + (expensive ? "1" : "0") + "\n");
            this._blurHPostProcess.onApply = (effect: Effect) => {
                if (!this._scene.activeCamera) {
                    return;
                }

                effect.setFloat("outSize", this._ssaoCombinePostProcess.width > 0 ? this._ssaoCombinePostProcess.width : this._originalColorPostProcess.width);
                effect.setFloat("near", this._scene.activeCamera.minZ);
                effect.setFloat("far", this._scene.activeCamera.maxZ);
                effect.setFloat("radius", this.radius);
                effect.setTexture("depthSampler", this._depthTexture);

                if (this._firstUpdate) {
                    effect.setArray("samplerOffsets", this._samplerOffsets);
                }
            };

            this._blurVPostProcess = new PostProcess("BlurV", "ssao2", ["outSize", "samplerOffsets", "near", "far", "radius"], ["depthSampler"], blurRatio, null, Texture.TRILINEAR_SAMPLINGMODE, this._scene.getEngine(), false, "#define BILATERAL_BLUR\n#define BILATERAL_BLUR_V\n#define SAMPLES 16\n#define EXPENSIVE " + (expensive ? "1" : "0") + "\n");
            this._blurVPostProcess.onApply = (effect: Effect) => {
                if (!this._scene.activeCamera) {
                    return;
                }

                effect.setFloat("outSize", this._ssaoCombinePostProcess.height > 0 ? this._ssaoCombinePostProcess.height : this._originalColorPostProcess.height);
                effect.setFloat("near", this._scene.activeCamera.minZ);
                effect.setFloat("far", this._scene.activeCamera.maxZ);
                effect.setFloat("radius", this.radius);
                effect.setTexture("depthSampler", this._depthTexture);

                if (this._firstUpdate) {
                    effect.setArray("samplerOffsets", this._samplerOffsets);
                    this._firstUpdate = false;
                }
            };
        }

        public _rebuild() {
            this._firstUpdate = true;

            super._rebuild();
        }

        private _generateHemisphere(): number[] {
            var numSamples = this.samples;
            var result = [];
            var vector, scale;

            var rand = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            var i = 0;
            while (i < numSamples) {
                vector = new BABYLON.Vector3(
                    rand(-1.0, 1.0),
                    rand(-1.0, 1.0),
                    rand(0.30, 1.0));
                vector.normalize();
                scale = i / numSamples;
                scale = Scalar.Lerp(0.1, 1.0, scale * scale);
                vector.scaleInPlace(scale);


                result.push(vector.x, vector.y, vector.z);
                i++;
            }

            return result;
        }

        private _createSSAOPostProcess(ratio: number): void {
            var numSamples = this.samples;

            this._sampleSphere = this._generateHemisphere();

            this._ssaoPostProcess = new PostProcess("ssao2", "ssao2",
                [
                    "sampleSphere", "samplesFactor", "randTextureTiles", "totalStrength", "radius",
                    "base", "range", "projection", "near", "far", "texelSize",
                    "xViewport", "yViewport", "maxZ", "minZAspect"
                ],
                ["randomSampler", "normalSampler"],
                ratio, null, Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine(), false,
                "#define SAMPLES " + numSamples + "\n#define SSAO");

            this._ssaoPostProcess.onApply = (effect: Effect) => {
                if (this._firstUpdate) {
                    effect.setArray3("sampleSphere", this._sampleSphere);
                    effect.setFloat("randTextureTiles", 4.0);
                }

                if (!this._scene.activeCamera) {
                    return;
                }

                effect.setFloat("samplesFactor", 1 / this.samples);
                effect.setFloat("totalStrength", this.totalStrength);
                effect.setFloat2("texelSize", 1 / this._ssaoPostProcess.width, 1 / this._ssaoPostProcess.height);
                effect.setFloat("radius", this.radius);
                effect.setFloat("maxZ", this.maxZ);
                effect.setFloat("minZAspect", this.minZAspect);
                effect.setFloat("base", this.base);
                effect.setFloat("near", this._scene.activeCamera.minZ);
                effect.setFloat("far", this._scene.activeCamera.maxZ);
                effect.setFloat("xViewport", Math.tan(this._scene.activeCamera.fov / 2) * this._scene.getEngine().getAspectRatio(this._scene.activeCamera, true));
                effect.setFloat("yViewport", Math.tan(this._scene.activeCamera.fov / 2));
                effect.setMatrix("projection", this._scene.getProjectionMatrix());

                effect.setTexture("textureSampler", this._depthTexture);
                effect.setTexture("normalSampler", this._normalTexture);
                effect.setTexture("randomSampler", this._randomTexture);
            };
        }

        private _createSSAOCombinePostProcess(ratio: number): void {
            this._ssaoCombinePostProcess = new PostProcess("ssaoCombine", "ssaoCombine", [], ["originalColor"],
                ratio, null, Texture.BILINEAR_SAMPLINGMODE,
                this._scene.getEngine(), false);

            this._ssaoCombinePostProcess.onApply = (effect: Effect) => {
                effect.setTextureFromPostProcess("originalColor", this._originalColorPostProcess);
            };
        }

        private _createRandomTexture(): void {
            var size = 512;

            this._randomTexture = new DynamicTexture("SSAORandomTexture", size, this._scene, false, Texture.TRILINEAR_SAMPLINGMODE);
            this._randomTexture.wrapU = Texture.WRAP_ADDRESSMODE;
            this._randomTexture.wrapV = Texture.WRAP_ADDRESSMODE;

            var context = this._randomTexture.getContext();

            var rand = (min: number, max: number) => {
                return Math.random() * (max - min) + min;
            }

            var randVector = Vector3.Zero();

            for (var x = 0; x < size; x++) {
                for (var y = 0; y < size; y++) {
                    randVector.x = rand(0.0, 1.0);
                    randVector.y = rand(0.0, 1.0);
                    randVector.z = 0.0;

                    randVector.normalize();

                    randVector.scaleInPlace(255);
                    randVector.x = Math.floor(randVector.x);
                    randVector.y = Math.floor(randVector.y);

                    context.fillStyle = 'rgb(' + randVector.x + ', ' + randVector.y + ', ' + randVector.z + ')';
                    context.fillRect(x, y, 1, 1);
                }
            }

            this._randomTexture.update(false);
        }
    }
}