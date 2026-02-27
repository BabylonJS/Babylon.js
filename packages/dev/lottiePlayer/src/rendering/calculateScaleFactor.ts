/**
 * Holds the two scale factors needed when the animation and container differ in size.
 */
export type ScaleFactors = {
    /**
     * Scale applied to the canvas / viewport so it fits inside the container.
     * Can be less than 1 when the animation is larger than the container.
     */
    canvasScale: number;
    /**
     * Scale applied to the sprite atlas so sprites are never rendered smaller
     * than their native animation size.  Always \>= 1.
     */
    atlasScale: number;
};

/**
 * Calculates the scale factors between a container and the animation it is playing.
 *
 * `canvasScale` sizes the canvas so it fits inside the container (may be \< 1).
 * `atlasScale` is used when rasterising sprites into the texture atlas and is
 * clamped to \>= 1 so that sprites are never drawn at a smaller-than-native
 * resolution.
 *
 * @param animationWidth Width of the animation
 * @param animationHeight Height of the animation
 * @param container The container where the animation is getting played
 * @returns The canvas and atlas scale factors
 */
export function CalculateScaleFactors(animationWidth: number | undefined, animationHeight: number | undefined, container: HTMLElement): ScaleFactors {
    if (animationWidth === undefined || animationHeight === undefined) {
        return { canvasScale: 1, atlasScale: 1 };
    }

    // The size of the canvas is the relation between the size of the container div and the size of the animation
    const horizontalScale = container.clientWidth / animationWidth;
    const verticalScale = container.clientHeight / animationHeight;
    const minScale = Math.min(verticalScale, horizontalScale);

    return {
        canvasScale: minScale,
        atlasScale: Math.max(minScale, 1), // Always render sprites at least at 100% to avoid too small sprites in the atlas
    };
}
