import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreateTiledBox = function(options: { pattern?: number, size?: number, width?: number, height?: number, depth: number, tileSize?: number, tileWidth?: number, tileHeight?: number, faceUV?: Vector4[], faceColors?: Color4[], alignHorizontal?: number, alignVertical?: number, sideOrientation?: number }): VertexData {
    var nbFaces = 6;

    var faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
    var faceColors = options.faceColors;

    var flipTile = options.pattern || Mesh.NO_FLIP;

    var width = options.width || options.size || 1;
    var height = options.height || options.size || 1;
    var depth = options.depth || options.size || 1;
    var tileWidth = options.tileWidth || options.tileSize || 1;
    var tileHeight = options.tileHeight || options.tileSize || 1;
    var alignH = options.alignHorizontal || 0;
    var alignV = options.alignVertical || 0;

    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // default face colors and UV if undefined
    for (var f = 0; f < nbFaces; f++) {
        if (faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }

    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var halfDepth = depth / 2;

    var faceVertexData: Array<VertexData> = [];

    for (var f = 0; f < 2; f++) { //front and back
        faceVertexData[f] = VertexData.CreateTiledPlane({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: width,
            height: height,
            alignVertical: alignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation
        });
    }

    for (var f = 2; f < 4; f++) { //sides
        faceVertexData[f] = VertexData.CreateTiledPlane({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: depth,
            height: height,
            alignVertical: alignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation
        });
    }

    var baseAlignV = alignV;
    if (alignV === Mesh.BOTTOM) {
        baseAlignV = Mesh.TOP;
    }
    else if (alignV === Mesh.TOP) {
        baseAlignV = Mesh.BOTTOM;
    }

    for (var f = 4; f < 6; f++) { //top and bottom
        faceVertexData[f] = VertexData.CreateTiledPlane({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: width,
            height: depth,
            alignVertical: baseAlignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation
        });
    }

    var positions: Array<number> = [];
    var normals: Array<number> = [];
    var uvs: Array<number> = [];
    var indices: Array<number> = [];
    var colors: Array<number> = [];
    var facePositions: Array<Array<Vector3>> = [];
    var faceNormals: Array<Array<Vector3>> = [];

    var newFaceUV: Array<Array<number>> = [];
    var len: number = 0;
    var lu: number = 0;

    var li: number = 0;

    for (var f = 0; f < nbFaces; f++) {
        var len = faceVertexData[f].positions!.length;
        facePositions[f] = [];
        faceNormals[f] = [];
        for (var p = 0; p < len / 3; p++) {
            facePositions[f].push(new Vector3(faceVertexData[f].positions![3 * p], faceVertexData[f].positions![3 * p + 1], faceVertexData[f].positions![3 * p + 2]));
            faceNormals[f].push(new Vector3(faceVertexData[f].normals![3 * p], faceVertexData[f].normals![3 * p + 1], faceVertexData[f].normals![3 * p + 2]));
        }
        // uvs
        lu = faceVertexData[f].uvs!.length;
        newFaceUV[f] = [];
        for (var i = 0; i < lu; i += 2) {
            newFaceUV[f][i] = faceUV[f].x + (faceUV[f].z - faceUV[f].x) * faceVertexData[f].uvs![i];
            newFaceUV[f][i + 1] = faceUV[f].y + (faceUV[f].w - faceUV[f].y) * faceVertexData[f].uvs![i + 1];
        }
        uvs = uvs.concat(newFaceUV[f]);
        indices = indices.concat(<Array<number>>faceVertexData[f].indices!.map((x: number) => x + li));
        li += facePositions[f].length;
        if (faceColors) {
            for (var c = 0; c < 4; c++) {
                colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
            }
        }
    }

    var vec0 = new Vector3(0, 0, halfDepth);
    var mtrx0 = Matrix.RotationY(Math.PI);
    positions = facePositions[0].map((entry) => Vector3.TransformNormal(entry, mtrx0).add(vec0)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    );
    normals = faceNormals[0].map((entry) => Vector3.TransformNormal(entry, mtrx0)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    );
    positions = positions.concat(facePositions[1].map((entry) => entry.subtract(vec0)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    normals = normals.concat(faceNormals[1].map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));

    var vec2 = new Vector3(halfWidth, 0, 0);
    var mtrx2 = Matrix.RotationY(-Math.PI / 2);
    positions = positions.concat(facePositions[2].map((entry) => Vector3.TransformNormal(entry, mtrx2).add(vec2)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    normals = normals.concat(faceNormals[2].map((entry) => Vector3.TransformNormal(entry, mtrx2)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    var mtrx3 = Matrix.RotationY(Math.PI / 2);
    positions = positions.concat(facePositions[3].map((entry) => Vector3.TransformNormal(entry, mtrx3).subtract(vec2)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    normals = normals.concat(faceNormals[3].map((entry) => Vector3.TransformNormal(entry, mtrx3)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));

    var vec4 = new Vector3(0, halfHeight, 0);
    var mtrx4 = Matrix.RotationX(Math.PI / 2);
    positions = positions.concat(facePositions[4].map((entry) => Vector3.TransformNormal(entry, mtrx4).add(vec4)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    normals = normals.concat(faceNormals[4].map((entry) => Vector3.TransformNormal(entry, mtrx4)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    var mtrx5 = Matrix.RotationX(-Math.PI / 2);
    positions = positions.concat(facePositions[5].map((entry) => Vector3.TransformNormal(entry, mtrx5).subtract(vec4)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));
    normals = normals.concat(faceNormals[5].map((entry) => Vector3.TransformNormal(entry, mtrx5)).map((entry) => [entry.x, entry.y, entry.z]).reduce(
        (accumulator: Array<number>, currentValue) => accumulator.concat(currentValue),
        []
    ));

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

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

/**
 * Class containing static functions to help procedurally build meshes
 */
export class TiledBoxBuilder {
    /**
     * Creates a box mesh
     * faceTiles sets the pattern, tile size and number of tiles for a face     * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 Color3 elements) and `faceUV` (an array of 6 Vector4 elements)
     * * Please read this tutorial : https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the box mesh
     */
    public static CreateTiledBox(name: string, options: { pattern?: number, width?: number, height?: number, depth?: number, tileSize?: number, tileWidth?: number, tileHeight?: number, alignHorizontal?: number, alignVertical?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var box = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        box._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateTiledBox(options);

        vertexData.applyToMesh(box, options.updatable);

        return box;
    }
}