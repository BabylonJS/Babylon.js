/**
 * The strategy to use for making a block disableable.
 */
export enum BlockDisableStrategy {
    /**
     * The shader code is responsible for defining and consulting a uniform named disabled
     * and no-oping (returning texture2D(mainInputTexture, vUV)) if the value is true.
     */
    Manual = 0,

    /**
     * The Smart Filter system will automatically add code to sample the mainInputTexture and return immediately if disabled,
     * and otherwise use the value within the block's shader code. If you need to modify UVs before sampling the default input texture,
     * you'll need to use the Manual strategy instead.
     */
    AutoSample = 1,
}
