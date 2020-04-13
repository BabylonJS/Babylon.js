import { Scene } from "../../scene";
import { Vector3, Vector2, Vector4 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { PolygonMeshBuilder } from "../polygonMesh";
import { FloatArray, IndicesArray, Nullable } from "../../types";
import { VertexBuffer } from "../../Meshes/buffer";
import { EngineStore } from '../../Engines/engineStore';

declare var earcut: any;

VertexData.CreatePolygon = function(polygon: Mesh, sideOrientation: number, fUV?: Vector4[], fColors?: Color4[], frontUVs?: Vector4, backUVs?: Vector4, wrp?: boolean) {
    var faceUV: Vector4[] = fUV || new Array<Vector4>(3);
    var faceColors = fColors;
    var colors = [];
    var wrap: boolean = wrp || false;

    // default face colors and UV if undefined
    for (var f = 0; f < 3; f++) {
        if (faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }

    var positions = <FloatArray>polygon.getVerticesData(VertexBuffer.PositionKind);
    var normals = <FloatArray>polygon.getVerticesData(VertexBuffer.NormalKind);
    var uvs = <FloatArray>polygon.getVerticesData(VertexBuffer.UVKind);
    var indices = <IndicesArray>polygon.getIndices();
    var startIndex = positions.length / 9;
    var disp = 0;
    var distX = 0;
    var distZ = 0;
    var dist = 0;
    var totalLen = 0;
    var cumulate = [0];
    if (wrap) {
        for (var idx = startIndex; idx < positions.length / 3; idx += 4) {
            distX = positions[3 * (idx + 2)] - positions[3 * idx];
            distZ = positions[3 * (idx + 2) + 2] - positions[3 * idx + 2];
            dist = Math.sqrt(distX * distX + distZ * distZ);
            totalLen += dist;
            cumulate.push(totalLen);
        }
    }
    // set face colours and textures
    var idx: number = 0;
    var face: number = 0;
    for (var index = 0; index < normals.length; index += 3) {
        //Edge Face  no. 1
        if (Math.abs(normals[index + 1]) < 0.001) {
            face = 1;
        }
        //Top Face  no. 0
        if (Math.abs(normals[index + 1] - 1) < 0.001) {
            face = 0;
        }
        //Bottom Face  no. 2
        if (Math.abs(normals[index + 1] + 1) < 0.001) {
            face = 2;
        }
        idx = index / 3;
        if (face === 1) {
            disp = idx - startIndex;
            if (disp % 4 < 1.5) {
                if (wrap) {
                    uvs[2 * idx] = faceUV[face].x + (faceUV[face].z - faceUV[face].x) * cumulate[Math.floor(disp / 4)] / totalLen;
                }
                else {
                    uvs[2 * idx] = faceUV[face].x;
                }
            }
            else {
                if (wrap) {
                    uvs[2 * idx] = faceUV[face].x + (faceUV[face].z - faceUV[face].x) * cumulate[Math.floor(disp / 4) + 1] / totalLen;
                }
                else {
                    uvs[2 * idx] = faceUV[face].z;
                }
            }
            if (disp % 2 === 0) {
                uvs[2 * idx + 1] = faceUV[face].w;
            }
            else {
                uvs[2 * idx + 1] = faceUV[face].y;
            }
        }
        else {
            uvs[2 * idx] = (1 - uvs[2 * idx]) * faceUV[face].x + uvs[2 * idx] * faceUV[face].z;
            uvs[2 * idx + 1] = (1 - uvs[2 * idx + 1]) * faceUV[face].y + uvs[2 * idx + 1] * faceUV[face].w;
        }
        if (faceColors) {
            colors.push(faceColors[face].r, faceColors[face].g, faceColors[face].b, faceColors[face].a);
        }
    }

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, frontUVs, backUVs);

    // Result
    var vertexData = new VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    if (faceColors) {
        var totalColors = (sideOrientation === VertexData.DOUBLESIDE) ? colors.concat(colors) : colors;
        vertexData.colors = totalColors;
    }

    return vertexData;
};

Mesh.CreatePolygon = (name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number, earcutInjection = earcut): Mesh => {
    var options = {
        shape: shape,
        holes: holes,
        updatable: updatable,
        sideOrientation: sideOrientation
    };
    return PolygonBuilder.CreatePolygon(name, options, scene, earcutInjection);
};

Mesh.ExtrudePolygon = (name: string, shape: Vector3[], depth: number, scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number, earcutInjection = earcut): Mesh => {
    var options = {
        shape: shape,
        holes: holes,
        depth: depth,
        updatable: updatable,
        sideOrientation: sideOrientation
    };
    return PolygonBuilder.ExtrudePolygon(name, options, scene, earcutInjection);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class PolygonBuilder {
    /**
     * Creates a polygon mesh
     * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh
     * * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors
     * * You can set the mesh side orientation with the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4)
     * * Remember you can only change the shape positions, not their number when updating a polygon
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @param earcutInjection can be used to inject your own earcut reference
     * @returns the polygon mesh
     */
    public static CreatePolygon(name: string, options: { shape: Vector3[], holes?: Vector3[][], depth?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean}, scene: Nullable<Scene> = null, earcutInjection = earcut): Mesh {
        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        var shape = options.shape;
        var holes = options.holes || [];
        var depth = options.depth || 0;
        var contours: Array<Vector2> = [];
        var hole: Array<Vector2> = [];

        for (var i = 0; i < shape.length; i++) {
            contours[i] = new Vector2(shape[i].x, shape[i].z);
        }
        var epsilon = 0.00000001;
        if (contours[0].equalsWithEpsilon(contours[contours.length - 1], epsilon)) {
            contours.pop();
        }

        var polygonTriangulation = new PolygonMeshBuilder(name, contours, scene || EngineStore.LastCreatedScene!, earcutInjection);
        for (var hNb = 0; hNb < holes.length; hNb++) {
            hole = [];
            for (var hPoint = 0; hPoint < holes[hNb].length; hPoint++) {
                hole.push(new Vector2(holes[hNb][hPoint].x, holes[hNb][hPoint].z));
            }
            polygonTriangulation.addHole(hole);
        }
        var polygon = polygonTriangulation.build(options.updatable, depth);
        polygon._originalBuilderSideOrientation = options.sideOrientation;
        var vertexData = VertexData.CreatePolygon(polygon, options.sideOrientation, options.faceUV, options.faceColors, options.frontUVs, options.backUVs, options.wrap);
        vertexData.applyToMesh(polygon, options.updatable);

        return polygon;
    }

    /**
     * Creates an extruded polygon mesh, with depth in the Y direction.
     * * You can set different colors and different images to the top, bottom and extruded side by using the parameters `faceColors` (an array of 3 Color3 elements) and `faceUV` (an array of 3 Vector4 elements)
     * @see https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @param earcutInjection can be used to inject your own earcut reference
     * @returns the polygon mesh
     */
    public static ExtrudePolygon(name: string, options: { shape: Vector3[], holes?: Vector3[][], depth?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean }, scene: Nullable<Scene> = null, earcutInjection = earcut): Mesh {
        return PolygonBuilder.CreatePolygon(name, options, scene, earcutInjection);
    }
}