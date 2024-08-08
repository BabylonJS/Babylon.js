import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix, Vector3, Vector4 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { CreateTiledPlaneVertexData } from "./tiledPlaneBuilder";
import { useOpenGLOrientationForUV } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData for a tiled box
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/tiled_box
 * @param options an object used to set the following optional parameters for the tiled box, required but can be empty
 * * pattern sets the rotation or reflection pattern for the tiles,
 * * size of the box
 * * width of the box, overwrites size
 * * height of the box, overwrites size
 * * depth of the box, overwrites size
 * * tileSize sets the size of a tile
 * * tileWidth sets the tile width and overwrites tileSize
 * * tileHeight sets the tile width and overwrites tileSize
 * * faceUV an array of 6 Vector4 elements used to set different images to each box side
 * * faceColors an array of 6 Color3 elements used to set different colors to each box side
 * * alignHorizontal places whole tiles aligned to the center, left or right of a row
 * * alignVertical places whole tiles aligned to the center, left or right of a column
 * @param options.pattern
 * @param options.size
 * @param options.width
 * @param options.height
 * @param options.depth
 * @param options.tileSize
 * @param options.tileWidth
 * @param options.tileHeight
 * @param options.faceUV
 * @param options.faceColors
 * @param options.alignHorizontal
 * @param options.alignVertical
 * @param options.sideOrientation
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * @returns the VertexData of the TiledBox
 */
export function CreateTiledBoxVertexData(options: {
    pattern?: number;
    size?: number;
    width?: number;
    height?: number;
    depth?: number;
    tileSize?: number;
    tileWidth?: number;
    tileHeight?: number;
    faceUV?: Vector4[];
    faceColors?: Color4[];
    alignHorizontal?: number;
    alignVertical?: number;
    sideOrientation?: number;
}): VertexData {
    const nbFaces = 6;

    const faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
    const faceColors = options.faceColors;

    const flipTile = options.pattern || Mesh.NO_FLIP;

    const width = options.width || options.size || 1;
    const height = options.height || options.size || 1;
    const depth = options.depth || options.size || 1;
    const tileWidth = options.tileWidth || options.tileSize || 1;
    const tileHeight = options.tileHeight || options.tileSize || 1;
    const alignH = options.alignHorizontal || 0;
    const alignV = options.alignVertical || 0;

    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // default face colors and UV if undefined
    for (let f = 0; f < nbFaces; f++) {
        if (faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }

    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    const faceVertexData: Array<VertexData> = [];

    for (let f = 0; f < 2; f++) {
        //front and back
        faceVertexData[f] = CreateTiledPlaneVertexData({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: width,
            height: height,
            alignVertical: alignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation,
        });
    }

    for (let f = 2; f < 4; f++) {
        //sides
        faceVertexData[f] = CreateTiledPlaneVertexData({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: depth,
            height: height,
            alignVertical: alignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation,
        });
    }

    let baseAlignV = alignV;
    if (alignV === Mesh.BOTTOM) {
        baseAlignV = Mesh.TOP;
    } else if (alignV === Mesh.TOP) {
        baseAlignV = Mesh.BOTTOM;
    }

    for (let f = 4; f < 6; f++) {
        //top and bottom
        faceVertexData[f] = CreateTiledPlaneVertexData({
            pattern: flipTile,
            tileWidth: tileWidth,
            tileHeight: tileHeight,
            width: width,
            height: depth,
            alignVertical: baseAlignV,
            alignHorizontal: alignH,
            sideOrientation: sideOrientation,
        });
    }

    let positions: Array<number> = [];
    let normals: Array<number> = [];
    let uvs: Array<number> = [];
    let indices: Array<number> = [];
    const colors: Array<number> = [];
    const facePositions: Array<Array<Vector3>> = [];
    const faceNormals: Array<Array<Vector3>> = [];

    const newFaceUV: Array<Array<number>> = [];
    let lu: number = 0;

    let li: number = 0;

    for (let f = 0; f < nbFaces; f++) {
        const len = faceVertexData[f].positions!.length;
        facePositions[f] = [];
        faceNormals[f] = [];
        for (let p = 0; p < len / 3; p++) {
            facePositions[f].push(new Vector3(faceVertexData[f].positions![3 * p], faceVertexData[f].positions![3 * p + 1], faceVertexData[f].positions![3 * p + 2]));
            faceNormals[f].push(new Vector3(faceVertexData[f].normals![3 * p], faceVertexData[f].normals![3 * p + 1], faceVertexData[f].normals![3 * p + 2]));
        }
        // uvs
        lu = faceVertexData[f].uvs!.length;
        newFaceUV[f] = [];
        for (let i = 0; i < lu; i += 2) {
            newFaceUV[f][i] = faceUV[f].x + (faceUV[f].z - faceUV[f].x) * faceVertexData[f].uvs![i];
            newFaceUV[f][i + 1] = faceUV[f].y + (faceUV[f].w - faceUV[f].y) * faceVertexData[f].uvs![i + 1];

            if (useOpenGLOrientationForUV) {
                newFaceUV[f][i + 1] = 1.0 - newFaceUV[f][i + 1];
            }
        }
        uvs = uvs.concat(newFaceUV[f]);

        indices = indices.concat(<Array<number>>faceVertexData[f].indices!.map((x: number) => x + li));
        li += facePositions[f].length;
        if (faceColors) {
            for (let c = 0; c < 4; c++) {
                colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
            }
        }
    }

    const vec0 = new Vector3(0, 0, halfDepth);
    const mtrx0 = Matrix.RotationY(Math.PI);
    positions = facePositions[0]
        .map((entry) => Vector3.TransformNormal(entry, mtrx0).add(vec0))
        .map((entry) => [entry.x, entry.y, entry.z])
        .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), []);
    normals = faceNormals[0]
        .map((entry) => Vector3.TransformNormal(entry, mtrx0))
        .map((entry) => [entry.x, entry.y, entry.z])
        .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), []);
    positions = positions.concat(
        facePositions[1]
            .map((entry) => entry.subtract(vec0))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    normals = normals.concat(faceNormals[1].map((entry) => [entry.x, entry.y, entry.z]).reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), []));

    const vec2 = new Vector3(halfWidth, 0, 0);
    const mtrx2 = Matrix.RotationY(-Math.PI / 2);
    positions = positions.concat(
        facePositions[2]
            .map((entry) => Vector3.TransformNormal(entry, mtrx2).add(vec2))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    normals = normals.concat(
        faceNormals[2]
            .map((entry) => Vector3.TransformNormal(entry, mtrx2))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    const mtrx3 = Matrix.RotationY(Math.PI / 2);
    positions = positions.concat(
        facePositions[3]
            .map((entry) => Vector3.TransformNormal(entry, mtrx3).subtract(vec2))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    normals = normals.concat(
        faceNormals[3]
            .map((entry) => Vector3.TransformNormal(entry, mtrx3))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );

    const vec4 = new Vector3(0, halfHeight, 0);
    const mtrx4 = Matrix.RotationX(Math.PI / 2);
    positions = positions.concat(
        facePositions[4]
            .map((entry) => Vector3.TransformNormal(entry, mtrx4).add(vec4))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    normals = normals.concat(
        faceNormals[4]
            .map((entry) => Vector3.TransformNormal(entry, mtrx4))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    const mtrx5 = Matrix.RotationX(-Math.PI / 2);
    positions = positions.concat(
        facePositions[5]
            .map((entry) => Vector3.TransformNormal(entry, mtrx5).subtract(vec4))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );
    normals = normals.concat(
        faceNormals[5]
            .map((entry) => Vector3.TransformNormal(entry, mtrx5))
            .map((entry) => [entry.x, entry.y, entry.z])
            .reduce((accumulator: Array<number>, currentValue) => accumulator.concat(currentValue), [])
    );

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

    // Result
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    if (faceColors) {
        const totalColors = sideOrientation === VertexData.DOUBLESIDE ? colors.concat(colors) : colors;
        vertexData.colors = totalColors;
    }

    return vertexData;
}

/**
 * Creates a tiled box mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/tiled_box
 * @param name defines the name of the mesh
 * @param options an object used to set the following optional parameters for the tiled box, required but can be empty
 * * pattern sets the rotation or reflection pattern for the tiles,
 * * size of the box
 * * width of the box, overwrites size
 * * height of the box, overwrites size
 * * depth of the box, overwrites size
 * * tileSize sets the size of a tile
 * * tileWidth sets the tile width and overwrites tileSize
 * * tileHeight sets the tile width and overwrites tileSize
 * * faceUV an array of 6 Vector4 elements used to set different images to each box side
 * * faceColors an array of 6 Color3 elements used to set different colors to each box side
 * * alignHorizontal places whole tiles aligned to the center, left or right of a row
 * * alignVertical places whole tiles aligned to the center, left or right of a column
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * @param options.pattern
 * @param options.width
 * @param options.height
 * @param options.depth
 * @param options.tileSize
 * @param options.tileWidth
 * @param options.tileHeight
 * @param options.alignHorizontal
 * @param options.alignVertical
 * @param options.faceUV
 * @param options.faceColors
 * @param options.sideOrientation
 * @param options.updatable
 * @param scene defines the hosting scene
 * @returns the box mesh
 */
export function CreateTiledBox(
    name: string,
    options: {
        pattern?: number;
        width?: number;
        height?: number;
        depth?: number;
        tileSize?: number;
        tileWidth?: number;
        tileHeight?: number;
        alignHorizontal?: number;
        alignVertical?: number;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        sideOrientation?: number;
        updatable?: boolean;
    },
    scene: Nullable<Scene> = null
): Mesh {
    const box = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    box._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateTiledBoxVertexData(options);

    vertexData.applyToMesh(box, options.updatable);

    return box;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use CreateTiledBox instead
 */
export const TiledBoxBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateTiledBox,
};

VertexData.CreateTiledBox = CreateTiledBoxVertexData;
