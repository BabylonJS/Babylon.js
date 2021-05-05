import { Nullable, FloatArray } from "../../types";
import { Scene } from "../../scene";
import { Vector3, Vector2, TmpVectors, Vector4 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexBuffer } from "../../Buffers/buffer";
import { VertexData } from "../mesh.vertexData";
import { BoundingInfo } from "../../Culling/boundingInfo";

VertexData.CreateRibbon = function(options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, invertUV?: boolean, uvs?: Vector2[], colors?: Color4[] }): VertexData {
    var pathArray: Vector3[][] = options.pathArray;
    var closeArray: boolean = options.closeArray || false;
    var closePath: boolean = options.closePath || false;
    var invertUV: boolean = options.invertUV || false;
    var defaultOffset: number = Math.floor(pathArray[0].length / 2);
    var offset: number = options.offset || defaultOffset;
    offset = offset > defaultOffset ? defaultOffset : Math.floor(offset); // offset max allowed : defaultOffset
    var sideOrientation: number = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;
    var customUV = options.uvs;
    var customColors = options.colors;

    var positions: number[] = [];
    var indices: number[] = [];
    var normals: number[] = [];
    var uvs: number[] = [];

    var us: number[][] = [];        		// us[path_id] = [uDist1, uDist2, uDist3 ... ] distances between points on path path_id
    var vs: number[][] = [];        		// vs[i] = [vDist1, vDist2, vDist3, ... ] distances between points i of consecutive paths from pathArray
    var uTotalDistance: number[] = []; 		// uTotalDistance[p] : total distance of path p
    var vTotalDistance: number[] = []; 		//  vTotalDistance[i] : total distance between points i of first and last path from pathArray
    var minlg: number;          	        // minimal length among all paths from pathArray
    var lg: number[] = [];        		    // array of path lengths : nb of vertex per path
    var idx: number[] = [];       		    // array of path indexes : index of each path (first vertex) in the total vertex number
    var p: number;							// path iterator
    var i: number;							// point iterator
    var j: number;							// point iterator

    // if single path in pathArray
    if (pathArray.length < 2) {
        var ar1: Vector3[] = [];
        var ar2: Vector3[] = [];
        for (i = 0; i < pathArray[0].length - offset; i++) {
            ar1.push(pathArray[0][i]);
            ar2.push(pathArray[0][i + offset]);
        }
        pathArray = [ar1, ar2];
    }

    // positions and horizontal distances (u)
    var idc: number = 0;
    var closePathCorr: number = (closePath) ? 1 : 0;    // the final index will be +1 if closePath
    var path: Vector3[];
    var l: number;
    minlg = pathArray[0].length;
    var vectlg: number;
    var dist: number;
    for (p = 0; p < pathArray.length; p++) {
        uTotalDistance[p] = 0;
        us[p] = [0];
        path = pathArray[p];
        l = path.length;
        minlg = (minlg < l) ? minlg : l;

        j = 0;
        while (j < l) {
            positions.push(path[j].x, path[j].y, path[j].z);
            if (j > 0) {
                vectlg = path[j].subtract(path[j - 1]).length();
                dist = vectlg + uTotalDistance[p];
                us[p].push(dist);
                uTotalDistance[p] = dist;
            }
            j++;
        }

        if (closePath) {        // an extra hidden vertex is added in the "positions" array
            j--;
            positions.push(path[0].x, path[0].y, path[0].z);
            vectlg = path[j].subtract(path[0]).length();
            dist = vectlg + uTotalDistance[p];
            us[p].push(dist);
            uTotalDistance[p] = dist;
        }

        lg[p] = l + closePathCorr;
        idx[p] = idc;
        idc += (l + closePathCorr);
    }

    // vertical distances (v)
    var path1: Vector3[];
    var path2: Vector3[];
    var vertex1: Nullable<Vector3> = null;
    var vertex2: Nullable<Vector3> = null;
    for (i = 0; i < minlg + closePathCorr; i++) {
        vTotalDistance[i] = 0;
        vs[i] = [0];
        for (p = 0; p < pathArray.length - 1; p++) {
            path1 = pathArray[p];
            path2 = pathArray[p + 1];
            if (i === minlg) {   // closePath
                vertex1 = path1[0];
                vertex2 = path2[0];
            }
            else {
                vertex1 = path1[i];
                vertex2 = path2[i];
            }
            vectlg = vertex2.subtract(vertex1).length();
            dist = vectlg + vTotalDistance[i];
            vs[i].push(dist);
            vTotalDistance[i] = dist;
        }

        if (closeArray && vertex2 && vertex1) {
            path1 = pathArray[p];
            path2 = pathArray[0];
            if (i === minlg) {   // closePath
                vertex2 = path2[0];
            }
            vectlg = vertex2.subtract(vertex1).length();
            dist = vectlg + vTotalDistance[i];
            vTotalDistance[i] = dist;
        }
    }

    // uvs
    var u: number;
    var v: number;
    if (customUV) {
        for (p = 0; p < customUV.length; p++) {
            uvs.push(customUV[p].x, customUV[p].y);
        }
    }
    else {
        for (p = 0; p < pathArray.length; p++) {
            for (i = 0; i < minlg + closePathCorr; i++) {
                u = (uTotalDistance[p] != 0.0) ? us[p][i] / uTotalDistance[p] : 0.0;
                v = (vTotalDistance[i] != 0.0) ? vs[i][p] / vTotalDistance[i] : 0.0;
                if (invertUV) {
                    uvs.push(v, u);
                } else {
                    uvs.push(u, v);
                }
            }
        }
    }

    // indices
    p = 0;                    					// path index
    var pi: number = 0;                    		// positions array index
    var l1: number = lg[p] - 1;           		// path1 length
    var l2: number = lg[p + 1] - 1;         	// path2 length
    var min: number = (l1 < l2) ? l1 : l2;   	// current path stop index
    var shft: number = idx[1] - idx[0];         // shift
    var path1nb: number = closeArray ? lg.length : lg.length - 1;     // number of path1 to iterate	on

    while (pi <= min && p < path1nb) {       	//  stay under min and don't go over next to last path
        // draw two triangles between path1 (p1) and path2 (p2) : (p1.pi, p2.pi, p1.pi+1) and (p2.pi+1, p1.pi+1, p2.pi) clockwise

        indices.push(pi, pi + shft, pi + 1);
        indices.push(pi + shft + 1, pi + 1, pi + shft);
        pi += 1;
        if (pi === min) {                   			// if end of one of two consecutive paths reached, go to next existing path
            p++;
            if (p === lg.length - 1) {                 // last path of pathArray reached <=> closeArray == true
                shft = idx[0] - idx[p];
                l1 = lg[p] - 1;
                l2 = lg[0] - 1;
            }
            else {
                shft = idx[p + 1] - idx[p];
                l1 = lg[p] - 1;
                l2 = lg[p + 1] - 1;
            }
            pi = idx[p];
            min = (l1 < l2) ? l1 + pi : l2 + pi;
        }
    }

    // normals
    VertexData.ComputeNormals(positions, indices, normals);

    if (closePath) {        // update both the first and last vertex normals to their average value
        var indexFirst: number = 0;
        var indexLast: number = 0;
        for (p = 0; p < pathArray.length; p++) {
            indexFirst = idx[p] * 3;
            if (p + 1 < pathArray.length) {
                indexLast = (idx[p + 1] - 1) * 3;
            }
            else {
                indexLast = normals.length - 3;
            }
            normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
            normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
            normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
            normals[indexLast] = normals[indexFirst];
            normals[indexLast + 1] = normals[indexFirst + 1];
            normals[indexLast + 2] = normals[indexFirst + 2];
        }
    }

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    // Colors
    let colors: Nullable<Float32Array> = null;
    if (customColors) {
        colors = new Float32Array(customColors.length * 4);
        for (var c = 0; c < customColors.length; c++) {
            colors[c * 4] = customColors[c].r;
            colors[c * 4 + 1] = customColors[c].g;
            colors[c * 4 + 2] = customColors[c].b;
            colors[c * 4 + 3] = customColors[c].a;
        }
    }

    // Result
    var vertexData = new VertexData();
    var positions32 = new Float32Array(positions);
    var normals32 = new Float32Array(normals);
    var uvs32 = new Float32Array(uvs);

    vertexData.indices = indices;
    vertexData.positions = positions32;
    vertexData.normals = normals32;
    vertexData.uvs = uvs32;
    if (colors) {
        vertexData.set(colors, VertexBuffer.ColorKind);
    }

    if (closePath) {
        (<any>vertexData)._idx = idx;
    }

    return vertexData;
};

Mesh.CreateRibbon = (name: string, pathArray: Vector3[][], closeArray: boolean = false, closePath: boolean, offset: number, scene?: Scene, updatable: boolean = false, sideOrientation?: number, instance?: Mesh) => {
    return RibbonBuilder.CreateRibbon(name, {
        pathArray: pathArray,
        closeArray: closeArray,
        closePath: closePath,
        offset: offset,
        updatable: updatable,
        sideOrientation: sideOrientation,
        instance: instance
    }, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class RibbonBuilder {
    /**
     * Creates a ribbon mesh. The ribbon is a parametric shape.  It has no predefined shape. Its final shape will depend on the input parameters
     * * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry
     * * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array
     * * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array
     * * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path
     * * It's the offset to join the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11
     * * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : https://doc.babylonjs.com/how_to/how_to_dynamically_morph_a_mesh#ribbon
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The optional parameter `invertUV` (boolean, default false) swaps in the geometry the U and V coordinates to apply a texture
     * * The parameter `uvs` is an optional flat array of `Vector2` to update/set each ribbon vertex with its own custom UV values instead of the computed ones
     * * The parameters `colors` is an optional flat array of `Color4` to set/update each ribbon vertex with its own custom color values
     * * Note that if you use the parameters `uvs` or `colors`, the passed arrays must be populated with the right number of elements, it is to say the number of ribbon vertices. Remember that if you set `closePath` to `true`, there's one extra vertex per path in the geometry
     * * Moreover, you can use the parameter `color` with `instance` (to update the ribbon), only if you previously used it at creation time
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the ribbon mesh
     * @see https://doc.babylonjs.com/how_to/ribbon_tutorial
     * @see https://doc.babylonjs.com/how_to/parametric_shapes
     */
    public static CreateRibbon(name: string, options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, instance?: Mesh, invertUV?: boolean, uvs?: Vector2[], colors?: Color4[] }, scene: Nullable<Scene> = null): Mesh {
        var pathArray = options.pathArray;
        var closeArray = options.closeArray;
        var closePath = options.closePath;
        var sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        var instance = options.instance;
        var updatable = options.updatable;

        if (instance) {   // existing ribbon instance update
            // positionFunction : ribbon case
            // only pathArray and sideOrientation parameters are taken into account for positions update
            const minimum = TmpVectors.Vector3[0].setAll(Number.MAX_VALUE);
            const maximum = TmpVectors.Vector3[1].setAll(-Number.MAX_VALUE);
            var positionFunction = (positions: FloatArray) => {
                var minlg = pathArray[0].length;
                var mesh = (<Mesh>instance);
                var i = 0;
                var ns = (mesh._originalBuilderSideOrientation === Mesh.DOUBLESIDE) ? 2 : 1;
                for (var si = 1; si <= ns; ++si) {
                    for (var p = 0; p < pathArray.length; ++p) {
                        var path = pathArray[p];
                        var l = path.length;
                        minlg = (minlg < l) ? minlg : l;
                        for (let j = 0; j < minlg; ++j) {
                            const pathPoint = path[j];
                            positions[i] = pathPoint.x;
                            positions[i + 1] = pathPoint.y;
                            positions[i + 2] = pathPoint.z;
                            minimum.minimizeInPlaceFromFloats(pathPoint.x, pathPoint.y, pathPoint.z);
                            maximum.maximizeInPlaceFromFloats(pathPoint.x, pathPoint.y, pathPoint.z);
                            i += 3;
                        }
                        if (mesh._creationDataStorage && mesh._creationDataStorage.closePath) {
                            const pathPoint = path[0];
                            positions[i] = pathPoint.x;
                            positions[i + 1] = pathPoint.y;
                            positions[i + 2] = pathPoint.z;
                            i += 3;
                        }
                    }
                }
            };
            var positions = <FloatArray>instance.getVerticesData(VertexBuffer.PositionKind);
            positionFunction(positions);
            if (instance._boundingInfo) {
                instance._boundingInfo.reConstruct(minimum, maximum, instance._worldMatrix);
            }
            else {
                instance._boundingInfo = new BoundingInfo(minimum, maximum, instance._worldMatrix);
            }
            instance.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
            if (options.colors) {
                var colors = <FloatArray>instance.getVerticesData(VertexBuffer.ColorKind);
                for (var c = 0, colorIndex = 0; c < options.colors.length; c++ , colorIndex += 4) {
                    const color = options.colors[c];
                    colors[colorIndex] = color.r;
                    colors[colorIndex + 1] = color.g;
                    colors[colorIndex + 2] = color.b;
                    colors[colorIndex + 3] = color.a;
                }
                instance.updateVerticesData(VertexBuffer.ColorKind, colors, false, false);
            }
            if (options.uvs) {
                var uvs = <FloatArray>instance.getVerticesData(VertexBuffer.UVKind);
                for (var i = 0; i < options.uvs.length; i++) {
                    uvs[i * 2] = options.uvs[i].x;
                    uvs[i * 2 + 1] = options.uvs[i].y;
                }
                instance.updateVerticesData(VertexBuffer.UVKind, uvs, false, false);
            }
            if (!instance.areNormalsFrozen || instance.isFacetDataEnabled) {
                var indices = instance.getIndices();
                var normals = <FloatArray>instance.getVerticesData(VertexBuffer.NormalKind);
                var params = instance.isFacetDataEnabled ? instance.getFacetDataParameters() : null;
                VertexData.ComputeNormals(positions, indices, normals, params);

                if (instance._creationDataStorage && instance._creationDataStorage.closePath) {
                    var indexFirst: number = 0;
                    var indexLast: number = 0;
                    for (var p = 0; p < pathArray.length; p++) {
                        indexFirst = instance._creationDataStorage!.idx[p] * 3;
                        if (p + 1 < pathArray.length) {
                            indexLast = (instance._creationDataStorage!.idx[p + 1] - 1) * 3;
                        }
                        else {
                            indexLast = normals.length - 3;
                        }
                        normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                        normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                        normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                        normals[indexLast] = normals[indexFirst];
                        normals[indexLast + 1] = normals[indexFirst + 1];
                        normals[indexLast + 2] = normals[indexFirst + 2];
                    }
                }
                if (!(instance.areNormalsFrozen)) {
                    instance.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
                }
            }

            return instance;
        }
        else {  // new ribbon creation

            var ribbon = new Mesh(name, scene);
            ribbon._originalBuilderSideOrientation = sideOrientation;
            ribbon._creationDataStorage = new _CreationDataStorage();

            var vertexData = VertexData.CreateRibbon(options);
            if (closePath) {
                ribbon._creationDataStorage.idx = (<any>vertexData)._idx;
            }
            ribbon._creationDataStorage.closePath = closePath;
            ribbon._creationDataStorage.closeArray = closeArray;

            vertexData.applyToMesh(ribbon, updatable);

            return ribbon;
        }
    }
}