module BABYLON {
    /**
     * The Motion Blur Post Process which blurs an image based on the objects velocity in scene.
     * Velocity can be affected by each object's rotation, position and scale depending on the transformation speed.
     * As an example, all you have to do is to create the post-process:
     *  var mb = new BABYLON.MotionBlurProcess(
     *      'mb', // The name of the effect.
     *      scene, // The scene containing the objects to blur according to their velocity.
     *      1.0, // The required width/height ratio to downsize to before computing the render pass.
     *      camera // The camera to apply the render pass to.
     * );
     * Then, all objects moving, rotating and/or scaling will be blurred depending on the transformation speed.
     */
    export class MotionBlurProcess extends PostProcess {
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
            this.updateEffect("#define SAMPLES " + samples.toFixed(1));
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
        constructor(name: string, scene: Scene, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
            super(name, "motionBlur", ["motionStrength", "motionScale", "screenSize"], ["velocitySampler"], options, camera, samplingMode, engine, reusable, "#define SAMPLES 64.0", textureType, undefined, null, blockCompilation);

            this._geometryBufferRenderer = scene.enableGeometryBufferRenderer();

            if (this._geometryBufferRenderer) {
                if (!this._geometryBufferRenderer.isSupported) {
                    Tools.Warn("Multiple Render Target support needed to compute object based motion blur");
                    this.dispose();
                    return;
                }

                this._geometryBufferRenderer.enableVelocity = true;
            }

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
}
