/**
 * Calculates the scale factor between a container and the animation it is playing
 * @param animationWidth Width of the animaiton
 * @param animationHeight Height of the animation
 * @param container The container where the animation is getting played
 * @returns The scale factor that will modify the size of the animation rendering to adjust to the container
 */
export function CalculateScaleFactor(animationWidth: number | undefined, animationHeight: number | undefined, container: HTMLElement): number {
    if (animationWidth === undefined || animationHeight === undefined) {
        return 1;
    }

    // The size of the canvas is the relation between the size of the container div and the size of the animation
    const horizontalScale = container.clientWidth / animationWidth;
    const verticalScale = container.clientHeight / animationHeight;
    const minScale = Math.min(verticalScale, horizontalScale);
    return Math.max(minScale, 1); // Always render at least to 100% to avoid too small sprites
}
