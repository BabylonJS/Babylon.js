/**
 * Holds the scale factor needed when the animation and container differ in size.
 */
export type ScaleFactors = {
    /**
     * Scale applied to the canvas / viewport so it fits inside the container.
     * Can be less than 1 when the animation is larger than the container.
     */
    canvasScale: number;
};

/**
 * Calculates the scale factor between a container and the animation it is playing.
 *
 * @param animationWidth Width of the animation
 * @param animationHeight Height of the animation
 * @param container The container where the animation is getting played
 * @returns The canvas scale factor
 */
export function CalculateScaleFactors(animationWidth: number | undefined, animationHeight: number | undefined, container: HTMLElement): ScaleFactors {
    if (animationWidth === undefined || animationHeight === undefined) {
        return { canvasScale: 1 };
    }

    // The size of the canvas is the relation between the size of the container div and the size of the animation
    const horizontalScale = container.clientWidth / animationWidth;
    const verticalScale = container.clientHeight / animationHeight;

    return { canvasScale: Math.min(verticalScale, horizontalScale) };
}
