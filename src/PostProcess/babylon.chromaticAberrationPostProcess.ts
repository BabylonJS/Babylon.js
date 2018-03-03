module BABYLON {
    /**
     * The ChromaticAberrationPostProcess separates the rgb channels in an image to produce chromatic distortion around the edges of the screen
     */
    export class ChromaticAberrationPostProcess extends PostProcess {
        /**
         * The amount of seperation of rgb channels (default: 0)
         */
        aberrationAmount = 0;

        /**
         * The amount the effect will increase for pixels closer to the edge of the screen. (default: 0)
         */
        radialIntensity = 0;

        /**
         * The normilized direction in which the rgb channels should be seperated. If set to 0,0 radial direction will be used. (default: Vector2(0.707,0.707))
         */
        direction = new Vector2(0.707,0.707);

        /**
         * The center position where the radialIntensity should be around. [0.5,0.5 is center of screen, 1,1 is top right corder] (default: Vector2(0.5 ,0.5))
         */
        centerPosition = new Vector2(0.5,0.5);
        
        /**
         * Creates a new instance of @see ChromaticAberrationPostProcess
         * @param name The name of the effect.
         * @param screenWidth The width of the screen to apply the effect on.
         * @param screenHeight The height of the screen to apply the effect on.
         * @param options The required width/height ratio to downsize to before computing the render pass.
         * @param camera The camera to apply the render pass to.
         * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
         * @param engine The engine which the post process will be applied. (default: current engine)
         * @param reusable If the post process can be reused on the same frame. (default: false)
         * @param textureType Type of textures used when performing the post process. (default: 0)
         */
        constructor(name: string, screenWidth:number, screenHeight:number, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "chromaticAberration", ["chromatic_aberration", "screen_width", "screen_height", "direction", "radialIntensity", "centerPosition"], [], options, camera, samplingMode, engine, reusable, null, textureType);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat('chromatic_aberration', this.aberrationAmount);
                effect.setFloat('screen_width', screenWidth);
                effect.setFloat('screen_height', screenHeight);
                effect.setFloat('radialIntensity', this.radialIntensity);
                effect.setFloat2('direction', this.direction.x,this.direction.y);
                effect.setFloat2('centerPosition', this.centerPosition.x,this.centerPosition.y);
            })
        }
    }
}