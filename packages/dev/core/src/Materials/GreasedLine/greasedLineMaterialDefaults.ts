import type { RawTexture } from "../Textures/rawTexture";
import type { Nullable } from "../../types";
import { Color3 } from "../../Maths/math.color";

/**
 * Default settings for GreasedLine materials
 */
export class GreasedLineMaterialDefaults {
    /**
     * Default line color for newly created lines
     */
    public static DEFAULT_COLOR = Color3.White();
    /**
     * Default line width when sizeAttenuation is true
     */
    public static DEFAULT_WIDTH_ATTENUATED = 1;
    /**
     * Defaule line width
     */
    public static DEFAULT_WIDTH = 0.1;
    /**
     * Empty colors texture for WebGPU
     */
    public static EmptyColorsTexture: Nullable<RawTexture>;
}
