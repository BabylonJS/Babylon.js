/* eslint-disable @typescript-eslint/naming-convention */
import { Vector3 } from "../../Maths/math.vector";
import type { Color4 } from "../../Maths/math.color";
import { _CreationDataStorage, Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { FloatArray, Nullable } from "../../types";
import { LinesMesh } from "../../Meshes/linesMesh";
import type { Scene } from "../../scene";
import { VertexBuffer } from "../../Buffers/buffer";
import { Logger } from "../../Misc/logger";

import type { Material } from "../../Materials/material";

/**
 * Creates the VertexData of the LineSystem
 * @param options an object used to set the following optional parameters for the LineSystem, required but can be empty
 *  - lines an array of lines, each line being an array of successive Vector3
 *  - colors an array of line colors, each of the line colors being an array of successive Color4, one per line point
 * @returns the VertexData of the LineSystem
 */
export function CreateLineSystemVertexData(options: { lines: Vector3[][]; colors?: Nullable<Color4[][]> }): VertexData {
    const indices = [];
    const positions = [];
    const lines = options.lines;
    const colors = options.colors;
    const vertexColors = [];
    let idx = 0;

    for (let l = 0; l < lines.length; l++) {
        const points = lines[l];
        for (let index = 0; index < points.length; index++) {
            const { x, y, z } = points[index];
            positions.push(x, y, z);
            if (colors) {
                const color = colors[l];
                const { r, g, b, a } = color[index];
                vertexColors.push(r, g, b, a);
            }
            if (index > 0) {
                indices.push(idx - 1);
                indices.push(idx);
            }
            idx++;
        }
    }
    const vertexData = new VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;
    if (colors) {
        vertexData.colors = vertexColors;
    }
    return vertexData;
}

/**
 * Create the VertexData for a DashedLines
 * @param options an object used to set the following optional parameters for the DashedLines, required but can be empty
 *  - points an array successive Vector3
 *  - dashSize the size of the dashes relative to the dash number, optional, default 3
 *  - gapSize the size of the gap between two successive dashes relative to the dash number, optional, default 1
 *  - dashNb the intended total number of dashes, optional, default 200
 * @returns the VertexData for the DashedLines
 */
export function CreateDashedLinesVertexData(options: { points: Vector3[]; dashSize?: number; gapSize?: number; dashNb?: number }): VertexData {
    const dashSize = options.dashSize || 3;
    const gapSize = options.gapSize || 1;
    const dashNb = options.dashNb || 200;
    const points = options.points;

    const positions: number[] = [];
    const indices: number[] = [];

    const curvect = Vector3.Zero();
    let lg = 0;
    let nb = 0;
    let shft = 0;
    let dashshft = 0;
    let curshft = 0;
    let idx = 0;
    let i = 0;
    for (i = 0; i < points.length - 1; i++) {
        points[i + 1].subtractToRef(points[i], curvect);
        lg += curvect.length();
    }
    shft = lg / dashNb;
    dashshft = (dashSize * shft) / (dashSize + gapSize);
    for (i = 0; i < points.length - 1; i++) {
        points[i + 1].subtractToRef(points[i], curvect);
        nb = Math.floor(curvect.length() / shft);
        curvect.normalize();
        for (let j = 0; j < nb; j++) {
            curshft = shft * j;
            positions.push(points[i].x + curshft * curvect.x, points[i].y + curshft * curvect.y, points[i].z + curshft * curvect.z);
            positions.push(points[i].x + (curshft + dashshft) * curvect.x, points[i].y + (curshft + dashshft) * curvect.y, points[i].z + (curshft + dashshft) * curvect.z);
            indices.push(idx, idx + 1);
            idx += 2;
        }
    }

    // Result
    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;

    return vertexData;
}

/**
 * Creates a line system mesh. A line system is a pool of many lines gathered in a single mesh
 * * A line system mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of lines as an input parameter
 * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineSystem to this static function
 * * The parameter `lines` is an array of lines, each line being an array of successive Vector3
 * * The optional parameter `instance` is an instance of an existing LineSystem object to be updated with the passed `lines` parameter
 * * The optional parameter `colors` is an array of line colors, each line colors being an array of successive Color4, one per line point
 * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need the alpha blending (faster)
 * * The optional parameter `material` is the material to use to draw the lines if provided. If not, a default material will be created
 * * Updating a simple Line mesh, you just need to update every line in the `lines` array : https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#lines-and-dashedlines
 * * When updating an instance, remember that only line point positions can change, not the number of points, neither the number of lines
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#line-system
 * @param name defines the name of the new line system
 * @param options defines the options used to create the line system
 * @param scene defines the hosting scene
 * @returns a new line system mesh
 */
export function CreateLineSystem(
    name: string,
    options: { lines: Vector3[][]; updatable?: boolean; instance?: Nullable<LinesMesh>; colors?: Nullable<Color4[][]>; useVertexAlpha?: boolean; material?: Material },
    scene: Nullable<Scene> = null
): LinesMesh {
    const instance = options.instance;
    const lines = options.lines;
    const colors = options.colors;

    if (instance) {
        // lines update
        const positions = instance.getVerticesData(VertexBuffer.PositionKind)!;
        let vertexColor;
        let lineColors;
        if (colors) {
            vertexColor = instance.getVerticesData(VertexBuffer.ColorKind)!;
        }
        let i = 0;
        let c = 0;
        for (let l = 0; l < lines.length; l++) {
            const points = lines[l];
            for (let p = 0; p < points.length; p++) {
                positions[i] = points[p].x;
                positions[i + 1] = points[p].y;
                positions[i + 2] = points[p].z;
                if (colors && vertexColor) {
                    lineColors = colors[l];
                    vertexColor[c] = lineColors[p].r;
                    vertexColor[c + 1] = lineColors[p].g;
                    vertexColor[c + 2] = lineColors[p].b;
                    vertexColor[c + 3] = lineColors[p].a;
                    c += 4;
                }
                i += 3;
            }
        }
        instance.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
        if (colors && vertexColor) {
            instance.updateVerticesData(VertexBuffer.ColorKind, vertexColor, false, false);
        }
        return instance;
    }

    // line system creation
    const useVertexColor = colors ? true : false;
    const lineSystem = new LinesMesh(name, scene, null, undefined, undefined, useVertexColor, options.useVertexAlpha, options.material);
    const vertexData = CreateLineSystemVertexData(options);
    vertexData.applyToMesh(lineSystem, options.updatable);
    return lineSystem;
}

/**
 * Creates a line mesh
 * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter
 * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function
 * * The parameter `points` is an array successive Vector3
 * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#lines-and-dashedlines
 * * The optional parameter `colors` is an array of successive Color4, one per line point
 * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need alpha blending (faster)
 * * The optional parameter `material` is the material to use to draw the lines if provided. If not, a default material will be created
 * * When updating an instance, remember that only point positions can change, not the number of points
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#lines
 * @param name defines the name of the new line system
 * @param options defines the options used to create the line system
 * @param scene defines the hosting scene
 * @returns a new line mesh
 */
export function CreateLines(
    name: string,
    options: { points: Vector3[]; updatable?: boolean; instance?: Nullable<LinesMesh>; colors?: Color4[]; useVertexAlpha?: boolean; material?: Material },
    scene: Nullable<Scene> = null
): LinesMesh {
    const colors = options.colors ? [options.colors] : null;
    const lines = CreateLineSystem(
        name,
        { lines: [options.points], updatable: options.updatable, instance: options.instance, colors: colors, useVertexAlpha: options.useVertexAlpha, material: options.material },
        scene
    );
    return lines;
}

/**
 * Creates a dashed line mesh
 * * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter
 * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function
 * * The parameter `points` is an array successive Vector3
 * * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200)
 * * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3)
 * * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1)
 * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/features/featuresDeepDive/mesh/dynamicMeshMorph#lines-and-dashedlines
 * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need the alpha blending (faster)
 * * The optional parameter `material` is the material to use to draw the lines if provided. If not, a default material will be created
 * * When updating an instance, remember that only point positions can change, not the number of points
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the dashed line mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/param#dashed-lines
 */
export function CreateDashedLines(
    name: string,
    options: { points: Vector3[]; dashSize?: number; gapSize?: number; dashNb?: number; updatable?: boolean; instance?: LinesMesh; useVertexAlpha?: boolean; material?: Material },
    scene: Nullable<Scene> = null
): LinesMesh {
    const points = options.points;
    const instance = options.instance;
    const gapSize = options.gapSize || 1;
    const dashSize = options.dashSize || 3;

    if (instance) {
        //  dashed lines update
        const positionFunction = (positions: FloatArray): void => {
            const curvect = Vector3.Zero();
            const nbSeg = positions.length / 6;
            let lg = 0;
            let nb = 0;
            let shft = 0;
            let dashshft = 0;
            let curshft = 0;
            let p = 0;
            let i = 0;
            let j = 0;
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                lg += curvect.length();
            }
            shft = lg / nbSeg;
            const dashSize = instance!._creationDataStorage!.dashSize;
            const gapSize = instance!._creationDataStorage!.gapSize;
            dashshft = (dashSize * shft) / (dashSize + gapSize);
            for (i = 0; i < points.length - 1; i++) {
                points[i + 1].subtractToRef(points[i], curvect);
                nb = Math.floor(curvect.length() / shft);
                curvect.normalize();
                j = 0;
                while (j < nb && p < positions.length) {
                    curshft = shft * j;
                    positions[p] = points[i].x + curshft * curvect.x;
                    positions[p + 1] = points[i].y + curshft * curvect.y;
                    positions[p + 2] = points[i].z + curshft * curvect.z;
                    positions[p + 3] = points[i].x + (curshft + dashshft) * curvect.x;
                    positions[p + 4] = points[i].y + (curshft + dashshft) * curvect.y;
                    positions[p + 5] = points[i].z + (curshft + dashshft) * curvect.z;
                    p += 6;
                    j++;
                }
            }
            while (p < positions.length) {
                positions[p] = points[i].x;
                positions[p + 1] = points[i].y;
                positions[p + 2] = points[i].z;
                p += 3;
            }
        };
        if (options.dashNb || options.dashSize || options.gapSize || options.useVertexAlpha || options.material) {
            Logger.Warn("You have used an option other than points with the instance option. Please be aware that these other options will be ignored.");
        }
        instance.updateMeshPositions(positionFunction, false);
        return instance;
    }
    // dashed lines creation
    const dashedLines = new LinesMesh(name, scene, null, undefined, undefined, undefined, options.useVertexAlpha, options.material);
    const vertexData = CreateDashedLinesVertexData(options);
    vertexData.applyToMesh(dashedLines, options.updatable);

    dashedLines._creationDataStorage = new _CreationDataStorage();
    dashedLines._creationDataStorage.dashSize = dashSize;
    dashedLines._creationDataStorage.gapSize = gapSize;
    return dashedLines;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the functions directly from the module
 */
export const LinesBuilder = {
    CreateDashedLines,
    CreateLineSystem,
    CreateLines,
};

VertexData.CreateLineSystem = CreateLineSystemVertexData;
VertexData.CreateDashedLines = CreateDashedLinesVertexData;

Mesh.CreateLines = (name: string, points: Vector3[], scene: Nullable<Scene> = null, updatable: boolean = false, instance: Nullable<LinesMesh> = null): LinesMesh => {
    const options = {
        points,
        updatable,
        instance,
    };
    return CreateLines(name, options, scene);
};

Mesh.CreateDashedLines = (
    name: string,
    points: Vector3[],
    dashSize: number,
    gapSize: number,
    dashNb: number,
    scene: Nullable<Scene> = null,
    updatable?: boolean,
    instance?: LinesMesh
): LinesMesh => {
    const options = {
        points,
        dashSize,
        gapSize,
        dashNb,
        updatable,
        instance,
    };
    return CreateDashedLines(name, options, scene);
};
