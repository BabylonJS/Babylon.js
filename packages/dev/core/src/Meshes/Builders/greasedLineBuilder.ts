import { Color3 } from "../../Maths/math.color";
import type { GreasedLineMaterialOptions } from "../../Materials/greasedLinePluginMaterial";
import { GreasedLineMeshColorMode, GreasedLineMeshMaterialType, GreasedLinePluginMaterial } from "../../Materials/greasedLinePluginMaterial";
import { StandardMaterial } from "./../../Materials/standardMaterial";
import { PBRMaterial } from "../../Materials/PBR/pbrMaterial";
import { Vector3 } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import type { GreasedLineMeshOptions } from "../greasedLineMesh";
import { GreasedLineMeshColorDistribution, GreasedLineMeshWidthDistribution, GreasedLineMesh } from "../greasedLineMesh";
import type { Scene } from "../../scene";
import { EngineStore } from "../../Engines/engineStore";

/**
 * Material options for GreasedLneBuilder
 */
export interface GreasedLineMaterialBuilderOptions extends GreasedLineMaterialOptions {
    /**
     * If set to true a new material will created and a new material plugin will be attached
     * to the material. The material will be set on the mesh. If the instance option is specified in the mesh options,
     * no material will be created/assigned.
     */
    createAndAssignMaterial?: boolean;
}

/**
 * Builder class for create GreasedLineMeshes
 */
export class GreasedLineMeshBuilder {
    private static _DEFAULT_COLOR = Color3.White();

    /**
     * Creates a new @see GreasedLinePluginMaterial
     * @param name name of the material
     * @param options material options @see GreasedLineMaterialOptions
     * @param scene scene or null to use the last scene
     * @returns StandardMaterial or PBRMaterial with the @see GreasedLinePluginMaterial attached to it
     */
    public static CreateGreasedLineMaterial(name: string, options: GreasedLineMaterialOptions, scene: Nullable<Scene>) {
        scene = <Scene>(scene ?? EngineStore.LastCreatedScene);

        const material = options.materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR ? new PBRMaterial(name, scene) : new StandardMaterial(name, scene);
        new GreasedLinePluginMaterial(material, scene, options);

        return material;
    }

    /**
     * Creates a GreasedLine mesh
     * @param name name of the mesh
     * @param options options for the mesh
     * @param materialOptions material options for the mesh
     * @param scene scene where the mesh will be created
     * @returns instance of GreasedLineMesh
     */
    public static CreateGreasedLine(name: string, options: GreasedLineMeshOptions, materialOptions?: Nullable<GreasedLineMaterialBuilderOptions>, scene?: Nullable<Scene>) {
        scene = <Scene>(scene ?? EngineStore.LastCreatedScene);

        let instance;
        const allPoints = GreasedLineMesh.ConvertPoints(options.points);

        let length = 0;
        if (Array.isArray(allPoints[0])) {
            allPoints.forEach((points) => {
                length += points.length / 3;
            });
        }

        const widths = GreasedLineMeshBuilder.NormalizeWidthTable(length, options.widths ?? [], GreasedLineMeshWidthDistribution.WIDTH_DISTRIBUTION_START);

        const colors = materialOptions?.colors
            ? GreasedLineMeshBuilder.NormalizeColorTable(
                  length,
                  materialOptions.colors,
                  GreasedLineMeshColorDistribution.COLOR_DISTRIBUTION_START,
                  materialOptions.color ?? GreasedLineMeshBuilder._DEFAULT_COLOR
              )
            : undefined;

        // create new mesh if instance is not defined
        if (!options.instance) {
            const initialGreasedLineOptions: GreasedLineMeshOptions = {
                points: allPoints,
                // offsets: options.offsets,
                updatable: options.updatable,
                widths,
                lazy: options.lazy,
            };

            instance = new GreasedLineMesh(name, scene, initialGreasedLineOptions);

            if (materialOptions) {
                const initialMaterialOptions: GreasedLineMaterialOptions = {
                    materialType: materialOptions.materialType,
                    dashCount: materialOptions.dashCount,
                    dashOffset: materialOptions.dashOffset,
                    dashRatio: materialOptions.dashRatio,
                    resolution: materialOptions.resolution,
                    sizeAttenuation: materialOptions.sizeAttenuation,
                    useColors: materialOptions.useColors,
                    useDash: materialOptions.useDash,
                    visibility: materialOptions.visibility,
                    width: materialOptions.width,
                    color: materialOptions.color,
                    colorMode: materialOptions.colorMode ?? GreasedLineMeshColorMode.COLOR_MODE_SET,
                };

                if (colors) {
                    initialMaterialOptions.colors = colors;
                }

                if (materialOptions.createAndAssignMaterial) {
                    const material =
                        materialOptions.materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR ? new PBRMaterial(name, scene) : new StandardMaterial(name, scene);
                    new GreasedLinePluginMaterial(material, scene, initialMaterialOptions);
                    instance.material = material;
                }
            }
        } else {
            // update the data on the mesh instance
            instance = options.instance;
            GreasedLineMeshBuilder._SetSegmentWidths(instance, widths);
            instance.addPoints(allPoints);
        }

        // add colors
        // it will merge if any colors already on the instance
        if (colors) {
            GreasedLineMeshBuilder._SetColors(instance, colors);
        }

        return instance;
    }

    /**
     * Gets a number array from a Vector3 array.
     * You can you for example to convert your Vector3[] offsets to the required number[] for the offsets option.
     * @param array Vector3 array
     * @returns an array of x, y, z coordinates as numbers [x, y, z, x, y, z, x, y, z, ....]
     */
    public static Vector3ArrayToNumberArray(array: Vector3[]) {
        return array instanceof Array<Vector3> ? (<Vector3[]>array).flatMap((v) => [v.x, v.y, v.z]) : array;
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
     * @param defaultWidthUpper the default value which will be used to fill empty width entries - upper width
     * @param defaultWidthLower the default value which will be used to fill empty width entries - lower width
     * @returns normalized width table.
     */
    public static NormalizeWidthTable(
        pointCount: number,
        widths: number[],
        widthsDistribution: GreasedLineMeshWidthDistribution,
        defaultWidthUpper = 1,
        defaultWidthLower = 1
    ): number[] {
        const missingCount = pointCount - widths.length / 2;

        const widthsData: number[] = [];
        if (missingCount < 0) {
            return widths.slice(0, pointCount * 2);
        }

        // is the width table shorter than the point table?
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
    public static NormalizeColorTable(pointCount: number, colors: Color3[], colorDistribution: GreasedLineMeshColorDistribution, defaultColor: Color3): Color3[] {
        const missingCount = pointCount - colors.length;
        if (missingCount < 0) {
            return colors.slice(0, pointCount);
        }

        const colorsData: Color3[] = [];
        // is the color table shorter than the point table?
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

    /**
     * Appends the colors to the existing colors of the line instance or sets for the first time.
     * @param instance line instance
     * @param colors array of colors
     */
    private static _SetColors(instance: GreasedLineMesh, colors: Color3[]) {
        if (instance.material instanceof StandardMaterial || instance.material instanceof PBRMaterial) {
            if (instance.greasedLineMaterial) {
                const currentColors = instance.greasedLineMaterial.getOptions().colors;
                if (currentColors) {
                    const newColors = currentColors.concat(colors);
                    instance.greasedLineMaterial.setColors(newColors, instance.isLazy());
                }
            }
        }
    }

    /**
     * Adds or sets the widths on the line instance.
     * @param instance line instance
     * @param segmentWidths width table
     */
    private static _SetSegmentWidths(instance: GreasedLineMesh, segmentWidths: number[]) {
        const currentWidths = instance.options.widths;

        if (currentWidths) {
            const newWidths = [...currentWidths];
            newWidths.push(...segmentWidths);
            instance.setSegmentWidths(newWidths);
        } else {
            instance.setSegmentWidths(segmentWidths);
        }
    }
}
