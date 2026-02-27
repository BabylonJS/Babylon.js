/**
 * Color constants for the curve editor
 * These colors are used consistently across the curve editor UI for
 * representing different animation channels and UI elements.
 */

/**
 * Channel colors for multi-component animations (vectors, colors, quaternions)
 */
export const ChannelColors = {
    /** Red channel / X component */
    X: "#DB3E3E",
    /** Green channel / Y component */
    Y: "#51E22D",
    /** Blue channel / Z component */
    Z: "#00A3FF",
    /** W component (quaternions) */
    W: "#8700FF",
    /** Alpha channel */
    ALPHA: "#FFFFFF",
} as const;

/**
 * Aliases for color channels (R, G, B map to X, Y, Z)
 */
export const ColorChannelColors = {
    /** Red channel */
    R: ChannelColors.X,
    /** Green channel */
    G: ChannelColors.Y,
    /** Blue channel */
    B: ChannelColors.Z,
    /** Alpha channel */
    A: ChannelColors.ALPHA,
} as const;

/**
 * Default curve color for single-component (float) animations
 */
export const DefaultCurveColor = "#ffffff";

/**
 * Graph UI colors
 */
export const GraphColors = {
    /** Zero line color */
    zeroLine: "#666666",
    /** Selection rectangle stroke */
    selectionStroke: "#ffffff",
    /** Value axis label color */
    valueAxisLabel: "#555555",
    /** Value axis background */
    valueAxisBackground: "#111111",
    /** Selected keypoint color (gold) */
    selectedKeypoint: "#FFD700",
    /** Default keypoint stroke color */
    keypointStroke: "#ffffff",
    /** Tangent handle color */
    tangentHandle: "#FFD700",
} as const;
