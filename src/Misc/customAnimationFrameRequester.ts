
/**
 * Interface for any object that can request an animation frame
 */
export interface ICustomAnimationFrameRequester {
    /**
     * This function will be called when the render loop is ready. If this is not populated, the engine's renderloop function will be called
     */
    renderFunction?: Function;
    /**
     * Called to request the next frame to render to
     * @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
     */
    requestAnimationFrame: Function;
    /**
     * You can pass this value to cancelAnimationFrame() to cancel the refresh callback request
     * @see https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame#Return_value
     */
    requestID?: number;
}