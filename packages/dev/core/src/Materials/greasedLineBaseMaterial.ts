import type { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { RawTexture } from "../Materials/Textures/rawTexture";
import type { Vector2 } from "../Maths/math.vector";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import type { Nullable } from "../types";
import { Color3 } from "../Maths/math.color";
/**
 * Interface which defines the available methods for a GreasedLineMaterial
 */
export interface IGreasedLineMaterial {
    /**
     * Normalized value of how much of the line will be visible
     * 0 - 0% of the line will be visible
     * 1 - 100% of the line will be visible
     */
    visibility: number;

    /**
     * Line base width. At each point the line width is calculated by widths[pointIndex] * width
     */
    width: number;

    /**
     * Turns on/off dash mode
     */
    useDash: boolean;

    /**
     * @see GreasedLinePluginMaterial.setDashCount
     * Number of dashes in the line.
     * Defaults to 1.
     */
    dashCount: number;

    /**
     * Dash offset
     */
    dashOffset: number;

    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     */
    dashRatio: number;

    /**
     * Whether to use the colors option to colorize the line
     */
    useColors: boolean;

    /**
     * The mixing mode of the color paramater. Default value is GreasedLineMeshColorMode.SET.
     * MATERIAL_TYPE_SIMPLE mixes the color and colors of the greased line material.
     * MATERIAL_TYPE_STANDARD and MATERIAL_TYPE_PBR mixes the color from the base material with the color and/or colors of the greased line material.
     * @see GreasedLineMeshColorMode
     */
    colorMode: GreasedLineMeshColorMode;

    /**
     * Colors of the line segments.
     * Defaults to empty.
     */
    colors: Nullable<Color3[]>;

    /**
     * If false then width units = scene units. If true then line will width be reduced.
     * Defaults to false.
     */
    sizeAttenuation: boolean;

    /**
     * Color of the line. Applies to all line segments.
     * Defaults to White.
     */
    color: Nullable<Color3>;

    /**
     * The method used to distribute the colors along the line.
     * You can use segment distribution when each segment will use on color from the color table.
     * Or you can use line distribution when the colors are distributed evenly along the line ignoring the segments.
     */
    colorsDistributionType: GreasedLineMeshColorDistributionType;

    /**
     * Defaults to engine.getRenderWidth() and engine.getRenderHeight()
     * Rendering resolution
     */
    resolution: Vector2;

    /**
     * You can provide a colorsTexture to use instead of one generated from the 'colors' option
     */
    colorsTexture: Nullable<RawTexture>;

    /**
     * Allows to change the color without marking the material dirty.
     * MATERIAL_TYPE_STANDARD and MATERIAL_TYPE_PBR material's shaders will get recompiled if there was no color set and you set a color or when there was a color set and you set it to null.
     * @param value the color
     * @param doNotMarkDirty the flag
     */
    setColor(value: Nullable<Color3>, doNotMarkDirty?: boolean): void;

    /**
     *
     * @param colors colors array
     * @param lazy if true the colors texture will not be updated
     * @param forceNewTexture forces to create a new colors texture
     */
    setColors(colors: Nullable<Color3[]>, lazy: boolean, forceNewTexture?: boolean): void;

    /**
     * Creates and sets the colors texture from the colors array which was created in lazy mode
     */
    updateLazy(): void;
}

/**
 * Material types for GreasedLine
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#materialtype}
 */
export enum GreasedLineMeshMaterialType {
    /**
     * StandardMaterial
     */
    MATERIAL_TYPE_STANDARD = 0,
    /**
     * PBR Material
     */
    MATERIAL_TYPE_PBR = 1,
    /**
     * Simple and fast shader material not supporting lightning nor textures
     */
    MATERIAL_TYPE_SIMPLE = 2,
}

/**
 * Color blending mode of the @see GreasedLineMaterial and the base material
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colormode}
 */
export enum GreasedLineMeshColorMode {
    /**
     * Color blending mode SET
     */
    COLOR_MODE_SET = 0,
    /**
     * Color blending mode ADD
     */
    COLOR_MODE_ADD = 1,
    /**
     * Color blending mode ADD
     */
    COLOR_MODE_MULTIPLY = 2,
}

/**
 * Color distribution type of the @see colors.
 * {@link https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param/greased_line#colordistributiontype}
 *
 */
export enum GreasedLineMeshColorDistributionType {
    /**
     * Colors distributed between segments of the line
     */
    COLOR_DISTRIBUTION_TYPE_SEGMENT = 0,
    /**
     * Colors distributed along the line ingoring the segments
     */
    COLOR_DISTRIBUTION_TYPE_LINE = 1,
}

/**
 * Options for GreasedLineMaterial
 */
export interface GreasedLineMaterialOptions {
    /**
     * Line width. If sizeAttenuation os false scene units will be used for width.
     * Defaults to 0.1 if @see sizeAttenuation is false, or to 1 if it's true.
     */
    width?: number;
    /**
     * If false then width units = scene units. If true then line will width be reduced.
     * Defaults to false.
     */
    sizeAttenuation?: boolean;
    /**
     * Type of the material to use to render the line.
     * Defaults to StandardMaterial.
     */
    materialType?: GreasedLineMeshMaterialType;
    /**
     * Color of the line. Applies to all line segments.
     * Defaults to White.
     */
    color?: Color3;
    /**
     * Color mode of the line. Applies to all line segments.
     * The pixel color from the material shader will be modified with the value of @see color using the colorMode.
     * Defaults to @see GreasedLineMeshColorMode.SET
     */
    colorMode?: GreasedLineMeshColorMode;
    /**
     * Colors of the line segments.
     * Defaults to empty.
     */
    colors?: Color3[];
    /**
     * If true, @see colors are used, otherwise they're ignored.
     * Defaults to false.
     */
    useColors?: boolean;
    /**
     * Sampling type of the colors texture
     * Defaults to NEAREST_NEAREST.
     */
    colorsSampling?: number;
    /**
     * The method used to distribute the colors along the line.
     * You can use segment distribution when each segment will use on color from the color table.
     * Or you can use line distribution when the colors are distributed evenly along the line ignoring the segments.
     */
    colorDistributionType?: GreasedLineMeshColorDistributionType;
    /**
     * If true, dashing is used.
     * Defaults to false.
     */
    useDash?: boolean;
    /**
     * @see GreasedLinePluginMaterial.setDashCount
     * Number of dashes in the line.
     * Defaults to 1.
     */
    dashCount?: number;
    /**
     * Offset of the dashes along the line. 0 to 1.
     * Defaults to 0.
     * @see GreasedLinePluginMaterial.setDashOffset
     */
    dashOffset?: number;
    /**
     * Length of the dash. 0 to 1. 0.5 means half empty, half drawn.
     * Defaults to 0.5.
     * @see GreasedLinePluginMaterial.setDashRatio
     */
    dashRatio?: number;
    /**
     * Sets the line length visibility.
     * 0 - 0% of the line will be visible.
     * 1 - 100% of the line will be visible.
     * @see GreasedLinePluginMaterial.setVisibility
     */
    visibility?: number;
    /**
     * Defaults to engine.getRenderWidth() and engine.getRenderHeight()
     * Rendering resolution
     */
    resolution?: Vector2;
    /**
     * Whether to use camera facing for the line.
     * Defaults to true.
     */
    cameraFacing?: boolean;
    /**
     * You can provide a colorsTexture to use instead of one generated from the 'colors' option
     */
    colorsTexture?: RawTexture;
}

/**
 * Base class for GreasedLine materials
 */
export class GreasedLineBaseMaterial {
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
    public static EmptyColorsTexture: Nullable<BaseTexture>;

    /**
     * Converts an array of Color3 to Uint8Array
     * @param colors Arrray of Color3
     * @returns Uin8Array of colors [r, g, b, a, r, g, b, a, ...]
     */
    public static Color3toRGBAUint8(colors: Color3[]) {
        const colorTable: Uint8Array = new Uint8Array(colors.length * 4);
        for (let i = 0, j = 0; i < colors.length; i++) {
            colorTable[j++] = colors[i].r * 255;
            colorTable[j++] = colors[i].g * 255;
            colorTable[j++] = colors[i].b * 255;
            colorTable[j++] = 255;
        }

        return colorTable;
    }

    /**
     * Creates a RawTexture from an RGBA color array and sets it on the plugin material instance.
     * @param name name of the texture
     * @param colors Uint8Array of colors
     */
    public static CreateColorsTexture(name: string, colors: Color3[], colorsSampling: number, scene: Scene) {
        const colorsArray = GreasedLineBaseMaterial.Color3toRGBAUint8(colors);
        const colorsTexture = new RawTexture(colorsArray, colors.length, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, true, colorsSampling);
        colorsTexture.name = name;
        return colorsTexture;
    }

    /**
     * A minimum size texture for the colors sampler2D when there is no colors texture defined yet.
     * For fast switching using the useColors property without the need to use defines.
     * @param scene Scene
     */
    public static PrepareEmptyColorsTexture(scene: Scene) {
        if (!GreasedLineBaseMaterial.EmptyColorsTexture) {
            const colorsArray = new Uint8Array(4);
            GreasedLineBaseMaterial.EmptyColorsTexture = new RawTexture(colorsArray, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false, false, RawTexture.NEAREST_NEAREST);
            GreasedLineBaseMaterial.EmptyColorsTexture.name = "grlEmptyColorsTexture";
        }
    }

    /**
     * Diposes the shared empty colors texture
     */
    public static DisposeEmptyColorsTexture() {
        GreasedLineBaseMaterial.EmptyColorsTexture?.dispose();
        GreasedLineBaseMaterial.EmptyColorsTexture = null;
    }

    /**
     * Converts boolean to number.
     * @param bool
     * @returns 1 if true, 0 if false.
     */
    public static BooleanToNumber(bool?: boolean) {
        return bool ? 1 : 0;
    }
}
