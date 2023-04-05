/**
 * Interface for screenshot methods with describe argument called `size` as object with options
 * @link https://doc.babylonjs.com/api/classes/babylon.screenshottools
 */
export interface IScreenshotSize {
    /**
     * number in pixels for canvas height. It is the height of the texture used to render the scene
     */
    height?: number;

    /**
     * multiplier allowing render at a higher or lower resolution
     * If value is defined then width and height will be multiplied by this value
     */
    precision?: number;

    /**
     * number in pixels for canvas width. It is the width of the texture used to render the scene
     */
    width?: number;

    /**
     * Width of the final screenshot image.
     * If only one of the two values is provided, the other will be calculated based on the camera's aspect ratio.
     * If both finalWidth and finalHeight are not provided, width and height will be used instead.
     * finalWidth and finalHeight are used only by CreateScreenshotUsingRenderTarget, not by CreateScreenshot!
     */
    finalWidth?: number;

    /**
     * Height of the final screenshot image.
     * If only one of the two values is provided, the other will be calculated based on the camera's aspect ratio.
     * If both finalWidth and finalHeight are not provided, width and height will be used instead
     * finalWidth and finalHeight are used only by CreateScreenshotUsingRenderTarget, not by CreateScreenshot!
     */
    finalHeight?: number;
}
