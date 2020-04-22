import { Vector3 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { _CreationDataStorage, Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { FloatArray, Nullable } from "../../types";
import { LinesMesh } from "../../Meshes/linesMesh";
import { Scene } from "../../scene";
import { VertexBuffer } from "../../Meshes/buffer";

VertexData.CreateLineSystem = function(options: { lines: Vector3[][], colors?: Nullable<Color4[][]> }): VertexData {
    var indices = [];
    var positions = [];
    var lines = options.lines;
    var colors = options.colors;
    var vertexColors = [];
    var idx = 0;

    for (var l = 0; l < lines.length; l++) {
        var points = lines[l];
        for (var index = 0; index < points.length; index++) {
            positions.push(points[index].x, points[index].y, points[index].z);
            if (colors) {
                var color = colors[l];
                vertexColors.push(color[index].r, color[index].g, color[index].b, color[index].a);
            }
            if (index > 0) {
                indices.push(idx - 1);
                indices.push(idx);
            }
            idx++;
        }
    }
    var vertexData = new VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;
    if (colors) {
        vertexData.colors = vertexColors;
    }
    return vertexData;
};

VertexData.CreateDashedLines = function(options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number }): VertexData {
    var dashSize = options.dashSize || 3;
    var gapSize = options.gapSize || 1;
    var dashNb = options.dashNb || 200;
    var points = options.points;

    var positions = new Array<number>();
    var indices = new Array<number>();

    var curvect = Vector3.Zero();
    var lg = 0;
    var nb = 0;
    var shft = 0;
    var dashshft = 0;
    var curshft = 0;
    var idx = 0;
    var i = 0;
    for (i = 0; i < points.length - 1; i++) {
        points[i + 1].subtractToRef(points[i], curvect);
        lg += curvect.length();
    }
    shft = lg / dashNb;
    dashshft = dashSize * shft / (dashSize + gapSize);
    for (i = 0; i < points.length - 1; i++) {
        points[i + 1].subtractToRef(points[i], curvect);
        nb = Math.floor(curvect.length() / shft);
        curvect.normalize();
        for (var j = 0; j < nb; j++) {
            curshft = shft * j;
            positions.push(points[i].x + curshft * curvect.x, points[i].y + curshft * curvect.y, points[i].z + curshft * curvect.z);
            positions.push(points[i].x + (curshft + dashshft) * curvect.x, points[i].y + (curshft + dashshft) * curvect.y, points[i].z + (curshft + dashshft) * curvect.z);
            indices.push(idx, idx + 1);
            idx += 2;
        }
    }

    // Result
    var vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;

    return vertexData;
};

Mesh.CreateLines = (name: string, points: Vector3[], scene: Nullable<Scene> = null, updatable: boolean = false, instance: Nullable<LinesMesh> = null): LinesMesh => {
    var options = {
        points: points,
        updatable: updatable,
        instance: instance
    };
    return LinesBuilder.CreateLines(name, options, scene);
};

Mesh.CreateDashedLines = (name: string, points: Vector3[], dashSize: number, gapSize: number, dashNb: number, scene: Nullable<Scene> = null, updatable?: boolean, instance?: LinesMesh): LinesMesh => {
    var options = {
        points: points,
        dashSize: dashSize,
        gapSize: gapSize,
        dashNb: dashNb,
        updatable: updatable,
        instance: instance
    };
    return LinesBuilder.CreateDashedLines(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class LinesBuilder {
    /**
     * Creates a line system mesh. A line system is a pool of many lines gathered in a single mesh
     * * A line system mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of lines as an input parameter
     * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineSystem to this static function
     * * The parameter `lines` is an array of lines, each line being an array of successive Vector3
     * * The optional parameter `instance` is an instance of an existing LineSystem object to be updated with the passed `lines` parameter
     * * The optional parameter `colors` is an array of line colors, each line colors being an array of successive Color4, one per line point
     * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need the alpha blending (faster)
     * * Updating a simple Line mesh, you just need to update every line in the `lines` array : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * When updating an instance, remember that only line point positions can change, not the number of points, neither the number of lines
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#line-system
     * @param name defines the name of the new line system
     * @param options defines the options used to create the line system
     * @param scene defines the hosting scene
     * @returns a new line system mesh
     */
    public static CreateLineSystem(name: string, options: { lines: Vector3[][], updatable?: boolean, instance?: Nullable<LinesMesh>, colors?: Nullable<Color4[][]>, useVertexAlpha?: boolean }, scene: Nullable<Scene>): LinesMesh {
        var instance = options.instance;
        var lines = options.lines;
        var colors = options.colors;

        if (instance) { // lines update
            var positions = instance.getVerticesData(VertexBuffer.PositionKind)!;
            var vertexColor;
            var lineColors;
            if (colors) {
                vertexColor = instance.getVerticesData(VertexBuffer.ColorKind)!;
            }
            var i = 0;
            var c = 0;
            for (var l = 0; l < lines.length; l++) {
                var points = lines[l];
                for (var p = 0; p < points.length; p++) {
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
        var useVertexColor = (colors) ? true : false;
        var lineSystem = new LinesMesh(name, scene, null, undefined, undefined, useVertexColor, options.useVertexAlpha);
        var vertexData = VertexData.CreateLineSystem(options);
        vertexData.applyToMesh(lineSystem, options.updatable);
        return lineSystem;
    }

    /**
     * Creates a line mesh
     * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter
     * * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function
     * * The parameter `points` is an array successive Vector3
     * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * The optional parameter `colors` is an array of successive Color4, one per line point
     * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need alpha blending (faster)
     * * When updating an instance, remember that only point positions can change, not the number of points
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#lines
     * @param name defines the name of the new line system
     * @param options defines the options used to create the line system
     * @param scene defines the hosting scene
     * @returns a new line mesh
     */
    public static CreateLines(name: string, options: { points: Vector3[], updatable?: boolean, instance?: Nullable<LinesMesh>, colors?: Color4[], useVertexAlpha?: boolean }, scene: Nullable<Scene> = null): LinesMesh {
        var colors = (options.colors) ? [options.colors] : null;
        var lines = LinesBuilder.CreateLineSystem(name, { lines: [options.points], updatable: options.updatable, instance: options.instance, colors: colors, useVertexAlpha: options.useVertexAlpha }, scene);
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
     * * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#lines-and-dashedlines
     * * The optional parameter `useVertexAlpha` is to be set to `false` (default `true`) when you don't need the alpha blending (faster)
     * * When updating an instance, remember that only point positions can change, not the number of points
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the dashed line mesh
     * @see https://doc.babylonjs.com/how_to/parametric_shapes#dashed-lines
     */
    public static CreateDashedLines(name: string, options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number, updatable?: boolean, instance?: LinesMesh, useVertexAlpha?: boolean }, scene: Nullable<Scene> = null): LinesMesh {
        var points = options.points;
        var instance = options.instance;
        var gapSize = options.gapSize || 1;
        var dashSize = options.dashSize || 3;

        if (instance) {  //  dashed lines update
            var positionFunction = (positions: FloatArray): void => {
                var curvect = Vector3.Zero();
                var nbSeg = positions.length / 6;
                var lg = 0;
                var nb = 0;
                var shft = 0;
                var dashshft = 0;
                var curshft = 0;
                var p = 0;
                var i = 0;
                var j = 0;
                for (i = 0; i < points.length - 1; i++) {
                    points[i + 1].subtractToRef(points[i], curvect);
                    lg += curvect.length();
                }
                shft = lg / nbSeg;
                let dashSize = instance!._creationDataStorage!.dashSize;
                let gapSize = instance!._creationDataStorage!.gapSize;
                dashshft = dashSize * shft / (dashSize + gapSize);
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
            instance.updateMeshPositions(positionFunction, false);
            return instance;
        }
        // dashed lines creation
        var dashedLines = new LinesMesh(name, scene, null, undefined, undefined, undefined, options.useVertexAlpha);
        var vertexData = VertexData.CreateDashedLines(options);
        vertexData.applyToMesh(dashedLines, options.updatable);

        dashedLines._creationDataStorage = new _CreationDataStorage();
        dashedLines._creationDataStorage.dashSize = dashSize;
        dashedLines._creationDataStorage.gapSize = gapSize;
        return dashedLines;
    }
}