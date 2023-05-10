import { Color3 } from "./../../Maths/math.color";
import type { GreasedLineMaterialParameters} from "./../../Materials/greasedLinePluginMaterial";
import { GreasedLineMeshColorMode, GreasedLinePluginMaterial , GreasedLineMeshMaterialType } from "./../../Materials/greasedLinePluginMaterial";
import { StandardMaterial } from "./../../Materials/standardMaterial";
import { PBRMaterial } from "./../../Materials/PBR/pbrMaterial";
import type { Vector2 } from "./../../Maths/math.vector";
import { Vector3 } from "./../../Maths/math.vector";
import type { Nullable } from "../../types";
import type { GreasedLineParameters, GreasedLinePoints } from "../greasedLineMesh";
import { GreasedLineMeshColorDistribution, GreasedLineMeshWidthDistribution, GreasedLineMesh,  } from "../greasedLineMesh";
import type { Scene } from "../../scene";
import { EngineStore } from "../../Engines/engineStore";

/**
 * Parameter for GreasedLineBuilder
 */
export interface GreasedLineBuilderParameters {
    // mesh related

    /**
     * Points of the line.
     */
    points: GreasedLinePoints;
    /**
     * Line width.
     */
    width?: number;
    /**
     * If false then width units = scene units. If true then line will width be reduced for better perspective view.
     */
    sizeAttenuation?: boolean;
    /**
     * Each line segmment(from point to point) can have it's width multiplier. Final width = widths[segmentIdx] * width.
     */
    widths?: number[];
    /**
     * How to distribute the widths if the width table contains fewer entries than there are line segments.
     * @see NormalizeWidthTable
     */
    widthsDistribution?: GreasedLineMeshWidthDistribution;
    /**
     * Each line point can have an offset.
     */
    offsets?: number[]; // TODO: support Vector3 here
    /**
     * If instance is specified, lines are added to the specified instance.
     */
    instance?: GreasedLineMesh;
    /**
     * If true, offsets and widths are updatable.
     */
    updatable?: boolean;
    /**
     * Use when @see instance is specified.
     * If true, the line will be rendered only after calling instance.updateLazy(). If false, line will be rerendered after every call to @see CreateGreasedLine
     */
    lazy?: boolean;

    // material related
    /**
     * Type of the material to use to render the line.
     */
    materialType?: GreasedLineMeshMaterialType;
    /**
     * Color of the line. Applies to all line segments.
     */
    color?: Color3;
    /**
     * Color mode of the line. Applient to all line segments. Default value is @see GreasedLineMeshColorMode.ADD
     * The pixel color from the material shader will be modified with the value of @see color using the colorMode.
     */
    colorMode?: GreasedLineMeshColorMode;
    /**
     * Colors of the line segments.
     */
    colors?: Color3[];
    /**
     * If true, @see colors are used, otherwise they're ignored.
     */
    useColors?: boolean;
    /**
     * How to distribute the colors in case the number of colors is smaller than the number of line segments.
     * @see GreasedLineMeshColorDistribution
     */
    colorDistribution?: GreasedLineMeshColorDistribution;
    /**
     * If true, dashing is used.
     */
    useDash?: boolean;
    /**
     * @see GreasedLinePluginMaterial.setDashArray
     */
    dashArray?: number;
    /**
     * @see GreasedLinePluginMaterial.setDashOffset
     */
    dashOffset?: number;
    /**
     * @see GreasedLinePluginMaterial.setDashRatio
     */
    dashRatio?: number;
    /**
     * @see GreasedLinePluginMaterial.setVisibility
     */
    visibility?: number;
    /**
     * Rendering resolution
     */
    resolution?: Vector2; // TODO: This should be somewhere in the original shaders already?!
}

export class GreasedLineMeshBuilder {
    /**
     * Creates a GreasedLine mesh
     * @param name name of the mesh
     * @param parameters parameters for the mesh
     * @param scene scene where the mesh will be created
     * @returns instance of GreasedLineMesh
     */
    public static CreateGreasedLine(name: string, parameters: GreasedLineBuilderParameters, scene: Nullable<Scene>) {
        scene = <Scene>(scene ?? EngineStore.LastCreatedScene);

        let instance;
        const allPoints = GreasedLineMeshBuilder.ConvertPoints(parameters.points);

        let length = 0;
        if (Array.isArray(allPoints[0])) {
            allPoints.forEach((points) => {
                length += points.length / 3;
            });
        }

        const widths = GreasedLineMeshBuilder.NormalizeWidthTable(length, parameters.widths ?? [], GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_START);

        const colors = parameters.colors
            ? GreasedLineMeshBuilder.NormalizeColorTable(length, parameters.colors, GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START, parameters.color)
            : undefined;

        // create new mesh if instance is not defined
        if (!parameters.instance) {
            const initialGreasedLineParameters: GreasedLineParameters = {
                points: allPoints,
                offsets: parameters.offsets,
                updatable: parameters.updatable,
                widths,
                widthsDistribution: parameters.widthsDistribution,
            };

            const initialMaterialParameters: GreasedLineMaterialParameters = {
                materialType: parameters.materialType,
                colorDistribution: parameters.colorDistribution,
                dashArray: parameters.dashArray,
                dashOffset: parameters.dashOffset,
                dashRatio: parameters.dashRatio,
                resolution: parameters.resolution,
                sizeAttenuation: parameters.sizeAttenuation,
                useColors: parameters.useColors,
                useDash: parameters.useDash,
                visibility: parameters.visibility,
                width: parameters.width,
                color: parameters.color,
                colorMode: parameters.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET,
            };

            if (colors) {
                initialMaterialParameters.colors = GreasedLineMeshBuilder.Color3toUint8(colors);
            }

            const material = parameters.materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR ? new PBRMaterial(name, scene) : new StandardMaterial(name, scene);
            const plugin = new GreasedLinePluginMaterial(material, scene, initialMaterialParameters);

            instance = new GreasedLineMesh(name, scene, initialGreasedLineParameters, plugin, parameters.updatable, parameters.lazy);
            instance.material = material;
        } else {
            // update the data on the mesh instance
            instance = parameters.instance;
            GreasedLineMeshBuilder._SetSegmentWidths(instance, widths);
            instance.addPoints(allPoints);
        }

        if (colors) {
            GreasedLineMeshBuilder._SetColors(instance, colors);
        }

        return instance;
    }

    /**
     * Converts an array of Color3 to Uint8Array
     * @param colors Arrray of Color3
     * @returns Uin8Array of colors [r, g, b, r, g, b, ...]
     */
    public static Color3toUint8(colors: Color3[]) {
        const colorTable: Uint8Array = new Uint8Array(colors.length * 3);
        for (let i = 0, j = 0; i < colors.length; i++) {
            colorTable[j++] = colors[i].r * 255;
            colorTable[j++] = colors[i].g * 255;
            colorTable[j++] = colors[i].b * 255;
        }

        return colorTable;
    }

    /**
     * Converts GreasedLinePoints to number[][]
     * @param points GreasedLinePoints
     * @returns number[][] with x, y, z coordinates of the points, like [[x, y, z, x, y, z, ...], [x, y, z, ...]]
     */
    public static ConvertPoints(points: GreasedLinePoints): number[][] {
        if (points.length && !Array.isArray(points[0]) && points[0] instanceof Vector3) {
            const positions: number[] = [];
            for (let j = 0; j < points.length; j++) {
                const p = points[j] as Vector3;
                positions.push(p.x, p.y, p.z);
            }
            return [positions];
        } else if (points.length > 0 && Array.isArray(points[0]) && points[0].length > 0 && points[0][0] instanceof Vector3) {
            const positions: number[][] = [];
            const vectorPoints = points as Vector3[][];
            vectorPoints.forEach((p) => {
                positions.push(p.flatMap((p2) => [p2.x, p2.y, p2.z]));
            });
            return positions;
        } else if (points instanceof Float32Array) {
            return [Array.from(points)];
        } else if (points.length && points[0] instanceof Float32Array) {
            const positions: number[][] = [];
            points.forEach((p) => {
                positions.push(Array.from(p as Float32Array));
            });
            return positions;
        }

        return [];
    }

    /**
     * Normalizes the width table. It means it creates a width entry for every point of the line mesh.
     * You can provide more points the widths when creating the mesh. This function will fill the empty entries.
     * The algorithm used to fill the empty entries can be
     * GreasedLineMeshWidthDistribution.REPEAT - the width table will be repeatedly copied to the empty values [wU, wL] = [wU, wL, wU, wL, wU, wL, wU, wL]
     * GreasedLineMeshWidthDistribution.EVEN - the width table will be evenly copied to the empty values [wU, wL] = [wU, wU, wU, wU, wL, wL, wL, wL]
     * GreasedLineMeshWidthDistribution.START - the width table will be copied at the start of the empty values
     * and rest will be filled width the default width upper and default width lower values [wU, wL] = [wU, wL, dwU, dwL, dwU, dwL, dwU, dwL]
     * GreasedLineMeshWidthDistribution.END - the width table will be copied at the end of the empty values
     * and rest will be filled width the default values [wU, wL] = [dwU, dwL, dwU, dwL, dwU, dwL, wU, wL]
     * GreasedLineMeshWidthDistribution.START_END - the width table will be copied at the start and the end of the empty values
     * and rest will be filled width the default values [wU, wL] = [wU, wL, dwU, dwL, dwU, dwL, wU, wL]
     * @param pointCount number of points of the line mesh
     * @param widths array of widths [widthUpper, widhtLower, widthUpper, widthLower, ...]. Two widths (upper/lower) per point.
     * @param widthsDistribution how to distribute widths if the widths array has fewer entries than pointCount
     * @param defaultWidthUpper the default value which will be used to fill empty witdth entries - upper width
     * @param defaultWidthLower the default value which will be used to fill empty witdth entries - lower width
     * @returns normalizes
     */
    public static NormalizeWidthTable(
        pointCount: number,
        widths: number[],
        widthsDistribution: GreasedLineMeshWidthDistribution,
        defaultWidthUpper = 1,
        defaultWidthLower = 1
    ): number[] {
        // is the color table is shorter the the point table?
        const missingCount = pointCount - widths.length / 2;

        const widthsData: number[] = [];
        if (missingCount < 0) {
            return widths.slice(0, pointCount * 2);
        }

        if (missingCount > 0) {
            // it is, fill in the missing elements
            if (widthsDistribution === GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_START_END) {
                const halfCount = Math.floor(widths.length / 2);

                // start sector
                for (let i = 0, j = 0; i < halfCount - 1; i++) {
                    widthsData.push(widths[j++]);
                    widthsData.push(widths[j++]);
                }

                // middle sector
                const widthL = widths[halfCount / 2];
                const widthU = widths[halfCount / 2 + 1];
                for (let i = 0; i < missingCount; i++) {
                    widthsData.push(widthU);
                    widthsData.push(widthL);
                }

                // end sector
                for (let i = halfCount; i < widths.length; i += 2) {
                    widthsData.push(widths[i]);
                    widthsData.push(widths[i + 1]);
                }
            } else if (widthsDistribution === GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_START) {
                // start sector
                for (let i = 0; i < widths.length; i += 2) {
                    widthsData.push(widths[i]);
                    widthsData.push(widths[i + 1]);
                }

                // end sector
                for (let i = 0; i < missingCount; i++) {
                    widthsData.push(defaultWidthUpper);
                    widthsData.push(defaultWidthLower);
                }
            } else if (widthsDistribution === GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_END) {
                // start sector
                for (let i = 0; i < missingCount; i++) {
                    widthsData.push(defaultWidthUpper);
                    widthsData.push(defaultWidthLower);
                }

                // end sector
                for (let i = 0; i < widths.length; i += 2) {
                    widthsData.push(widths[i]);
                    widthsData.push(widths[i + 1]);
                }
            } else if (widthsDistribution === GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_REPEAT) {
                let i = 0;
                for (let x = 0; x < pointCount; x++) {
                    widthsData.push(widths[i++]);
                    widthsData.push(widths[i++]);

                    // TODO: with %
                    if (i === widths.length) {
                        i = 0;
                    }
                }
            } else if (widthsDistribution === GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_EVEN) {
                let j = 0;
                const widthsectorLength = widths.length / ((pointCount - 1) * 2);
                for (let x = 0; x < pointCount; x++) {
                    const i = Math.floor(j);

                    widthsData.push(widths[i]);
                    widthsData.push(widths[i + 1]);

                    j += widthsectorLength;
                }
            }
        } else {
            for (let i = 0; i < widths.length; i++) {
                widthsData.push(widths[i]);
            }
        }

        return widthsData;
    }

    /**
     * Normalizes the color table. It means it creates a color entry for every point of the line mesh.
     * You can provide more points the colors when creating the mesh. This function will fill the empty entries.
     * The algorithm used to fill the empty entries can be
     * GreasedLineMesColorhDistribution.REPEAT - the color table will be repeatedly copied to the empty values [c1, c2] = [c1, c2, c1, c2, c1, c2, c1, c2]
     * GreasedLineMesColorhDistribution.EVEN - the color table will be evenly copied to the empty values [c1, c2] = [c1, c1, c1, c1, c2, c2, c2, c2]
     * GreasedLineMesColorhDistribution.START - the color table will be copied at the start of the empty values
     * and rest will be filled color the default color value [c1, c2] = [c1, c2, dc, dc, dc, dc, dc, dc]
     * GreasedLineMesColorhDistribution.END - the color table will be copied at the end of the empty values
     * and rest will be filled color the default color value [c1, c2] = [dc, dc, dc, dc, dc, dc, c1, c2]
     * GreasedLineMesColorhDistribution.START_END - the color table will be copied at the start and the end of the empty values
     * and rest will be filled color the default color value [c1, c2] = [c1, c2, dc, dc, dc, dc, c1, c2]
     * @param pointCount number of points of the line mesh
     * @param colors array of Color3 for the color table
     * @param colorDistribution how to distribute colors if the colors array has fewer entries than pointCount
     * @param defaultColor default color to be used to fill empty entries in the color table
     * @returns normalized array of Color3
     */
    public static NormalizeColorTable(pointCount: number, colors: Color3[], colorDistribution: GreasedLineMeshColorDistribution, defaultColor: Color3 = Color3.White()): Color3[] {
        // is the color table is shorter the the point table?
        const missingCount = pointCount - colors.length;
        if (missingCount < 0) {
            return colors.slice(0, pointCount);
        }

        const colorsData: Color3[] = [];
        if (missingCount > 0) {
            // it is, fill in the missing elements
            if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START_END) {
                const halfCount = Math.floor(colors.length / 2);

                // start sector
                for (let i = 0; i < halfCount; i++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);
                }

                // middle sector
                for (let i = 0; i < missingCount - 1; i++) {
                    colorsData.push(defaultColor);
                    colorsData.push(defaultColor);
                }

                // end sector
                for (let i = halfCount; i < colors.length; i++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);
                }
            } else if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START) {
                // start sector
                for (let i = 0; i < colors.length; i++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);
                }

                // end sector
                for (let i = 0; i < missingCount; i++) {
                    colorsData.push(defaultColor);
                    colorsData.push(defaultColor);
                }
            } else if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_END) {
                // start sector
                for (let i = 0; i < missingCount - 1; i++) {
                    colorsData.push(defaultColor);
                    colorsData.push(defaultColor);
                }

                // end sector
                for (let i = 0; i < colors.length; i++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);
                }
            } else if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_REPEAT) {
                let i = 0;
                for (let x = 0; x < pointCount; x++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);

                    // TODO: with %
                    i++;

                    if (i === colors.length) {
                        i = 0;
                    }
                }
            } else if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_EVEN) {
                let j = 0;
                const colorSectorLength = colors.length / (pointCount - 1);
                for (let x = 0; x < pointCount - 1; x++) {
                    const i = Math.floor(j);

                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);

                    j += colorSectorLength;
                }
            } else if (colorDistribution === GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_NONE) {
                for (let i = 0; i < colors.length; i++) {
                    colorsData.push(colors[i]);
                    colorsData.push(colors[i]);
                }
            }
        } else {
            for (let i = 0; i < pointCount - 1; i++) {
                colorsData.push(colors[i]);
                colorsData.push(colors[i]);
            }
        }

        return colorsData;
    }

    // // eslint-disable-next-line no-inner-declarations
    // function _textureFromColors(name: string, colors: Color3[], scene: Scene, samplingMode = RawTexture.LINEAR_LINEAR) {
    //     const colorsRaw = Color3toUint8(colors);
    //     const colorsTexture = new RawTexture(colorsRaw, colors.length, 1, Engine.TEXTUREFORMAT_RGB, scene, false, true, samplingMode);
    //     colorsTexture.name = name;
    //     return colorsTexture;
    // }

    /**
     * Appends the colors to the existing colors of the line instance or sets for the first time.
     * @param instance line instance
     * @param colors array of colors
     */
    private static _SetColors(instance: GreasedLineMesh, colors: Color3[]) {
        if (instance.material instanceof StandardMaterial || instance.material instanceof PBRMaterial) {
            if (instance.greasedLineMaterial) {
                const currentColors = instance.greasedLineMaterial.getParameters().colors;
                if (currentColors) {
                    const colorsUint8 = GreasedLineMeshBuilder.Color3toUint8(colors);
                    const newColors = GreasedLineMeshBuilder._MergeColorTables(currentColors, colorsUint8);
                    instance.greasedLineMaterial.setColors(newColors, instance.isLazy());
                }
            }
        }
    }

    /**
     * Merges two color tables.
     * @param existingColors existing color table
     * @param colorsToAppend color table to append
     * @returns
     */
    private static _MergeColorTables(existingColors: Uint8Array, colorsToAppend: Uint8Array) {
        const tmp = new Uint8Array(existingColors.byteLength + colorsToAppend.byteLength);
        tmp.set(new Uint8Array(existingColors), 0);
        tmp.set(new Uint8Array(colorsToAppend), existingColors.byteLength);
        return tmp;
    }

    /**
     * Adds or sets the widths on the line instance.
     * @param instance line instance
     * @param segmentWidths width table
     */
    private static _SetSegmentWidths(instance: GreasedLineMesh, segmentWidths: number[]) {
        const currentWidths = instance.getSegmentWidths();

        if (currentWidths) {
            const newWidths = [...currentWidths];
            newWidths.push(...segmentWidths);
            instance.setSegmentWidths(newWidths);
        } else {
            instance.setSegmentWidths(segmentWidths);
        }
    }
}
