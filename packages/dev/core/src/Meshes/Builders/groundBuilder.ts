import type { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Color3 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { GroundMesh } from "../groundMesh";
import { Tools } from "../../Misc/tools";
import type { Nullable } from "../../types";
import { EngineStore } from "../../Engines/engineStore";
import { Epsilon } from "../../Maths/math.constants";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData for a Ground
 * @param options an object used to set the following optional parameters for the Ground, required but can be empty
 *  - width the width (x direction) of the ground, optional, default 1
 *  - height the height (z direction) of the ground, optional, default 1
 *  - subdivisions the number of subdivisions per side, optional, default 1
 * @param options.width
 * @param options.height
 * @param options.subdivisions
 * @param options.subdivisionsX
 * @param options.subdivisionsY
 * @returns the VertexData of the Ground
 */
export function CreateGroundVertexData(options: { width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number }): VertexData {
    const indices = [];
    const positions = [];
    const normals = [];
    const uvs = [];
    let row: number, col: number;

    const width: number = options.width || 1;
    const height: number = options.height || 1;
    const subdivisionsX: number = options.subdivisionsX || options.subdivisions || 1;
    const subdivisionsY: number = options.subdivisionsY || options.subdivisions || 1;

    for (row = 0; row <= subdivisionsY; row++) {
        for (col = 0; col <= subdivisionsX; col++) {
            const position = new Vector3((col * width) / subdivisionsX - width / 2.0, 0, ((subdivisionsY - row) * height) / subdivisionsY - height / 2.0);
            const normal = new Vector3(0, 1.0, 0);

            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(col / subdivisionsX, CompatibilityOptions.UseOpenGLOrientationForUV ? row / subdivisionsY : 1.0 - row / subdivisionsY);
        }
    }

    for (row = 0; row < subdivisionsY; row++) {
        for (col = 0; col < subdivisionsX; col++) {
            indices.push(col + 1 + (row + 1) * (subdivisionsX + 1));
            indices.push(col + 1 + row * (subdivisionsX + 1));
            indices.push(col + row * (subdivisionsX + 1));

            indices.push(col + (row + 1) * (subdivisionsX + 1));
            indices.push(col + 1 + (row + 1) * (subdivisionsX + 1));
            indices.push(col + row * (subdivisionsX + 1));
        }
    }

    // Result
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

/**
 * Creates the VertexData for a TiledGround by subdividing the ground into tiles
 * @param options an object used to set the following optional parameters for the Ground, required but can be empty
 * * xmin the ground minimum X coordinate, optional, default -1
 * * zmin the ground minimum Z coordinate, optional, default -1
 * * xmax the ground maximum X coordinate, optional, default 1
 * * zmax the ground maximum Z coordinate, optional, default 1
 * * subdivisions a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the ground width and height creating 'tiles', default {w: 6, h: 6}
 * * precision a javascript object {w: positive integer, h: positive integer}, `w` and `h` are the numbers of subdivisions on the tile width and height, default {w: 2, h: 2}
 * @param options.xmin
 * @param options.zmin
 * @param options.xmax
 * @param options.zmax
 * @param options.subdivisions
 * @param options.subdivisions.w
 * @param options.subdivisions.h
 * @param options.precision
 * @param options.precision.w
 * @param options.precision.h
 * @returns the VertexData of the TiledGround
 */
export function CreateTiledGroundVertexData(options: {
    xmin: number;
    zmin: number;
    xmax: number;
    zmax: number;
    subdivisions?: { w: number; h: number };
    precision?: { w: number; h: number };
}): VertexData {
    const xmin = options.xmin !== undefined && options.xmin !== null ? options.xmin : -1.0;
    const zmin = options.zmin !== undefined && options.zmin !== null ? options.zmin : -1.0;
    const xmax = options.xmax !== undefined && options.xmax !== null ? options.xmax : 1.0;
    const zmax = options.zmax !== undefined && options.zmax !== null ? options.zmax : 1.0;
    const subdivisions = options.subdivisions || { w: 1, h: 1 };
    const precision = options.precision || { w: 1, h: 1 };

    const indices = new Array<number>();
    const positions = new Array<number>();
    const normals = new Array<number>();
    const uvs = new Array<number>();
    let row: number, col: number, tileRow: number, tileCol: number;

    subdivisions.h = subdivisions.h < 1 ? 1 : subdivisions.h;
    subdivisions.w = subdivisions.w < 1 ? 1 : subdivisions.w;
    precision.w = precision.w < 1 ? 1 : precision.w;
    precision.h = precision.h < 1 ? 1 : precision.h;

    const tileSize = {
        w: (xmax - xmin) / subdivisions.w,
        h: (zmax - zmin) / subdivisions.h,
    };

    function applyTile(xTileMin: number, zTileMin: number, xTileMax: number, zTileMax: number) {
        // Indices
        const base = positions.length / 3;
        const rowLength = precision.w + 1;
        for (row = 0; row < precision.h; row++) {
            for (col = 0; col < precision.w; col++) {
                const square = [base + col + row * rowLength, base + (col + 1) + row * rowLength, base + (col + 1) + (row + 1) * rowLength, base + col + (row + 1) * rowLength];

                indices.push(square[1]);
                indices.push(square[2]);
                indices.push(square[3]);
                indices.push(square[0]);
                indices.push(square[1]);
                indices.push(square[3]);
            }
        }

        // Position, normals and uvs
        const position = Vector3.Zero();
        const normal = new Vector3(0, 1.0, 0);
        for (row = 0; row <= precision.h; row++) {
            position.z = (row * (zTileMax - zTileMin)) / precision.h + zTileMin;
            for (col = 0; col <= precision.w; col++) {
                position.x = (col * (xTileMax - xTileMin)) / precision.w + xTileMin;
                position.y = 0;

                positions.push(position.x, position.y, position.z);
                normals.push(normal.x, normal.y, normal.z);
                uvs.push(col / precision.w, row / precision.h);
            }
        }
    }

    for (tileRow = 0; tileRow < subdivisions.h; tileRow++) {
        for (tileCol = 0; tileCol < subdivisions.w; tileCol++) {
            applyTile(xmin + tileCol * tileSize.w, zmin + tileRow * tileSize.h, xmin + (tileCol + 1) * tileSize.w, zmin + (tileRow + 1) * tileSize.h);
        }
    }

    // Result
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

/**
 * Creates the VertexData of the Ground designed from a heightmap
 * @param options an object used to set the following parameters for the Ground, required and provided by CreateGroundFromHeightMap
 * * width the width (x direction) of the ground
 * * height the height (z direction) of the ground
 * * subdivisions the number of subdivisions per side
 * * minHeight the minimum altitude on the ground, optional, default 0
 * * maxHeight the maximum altitude on the ground, optional default 1
 * * colorFilter the filter to apply to the image pixel colors to compute the height, optional Color3, default (0.3, 0.59, 0.11)
 * * buffer the array holding the image color data
 * * bufferWidth the width of image
 * * bufferHeight the height of image
 * * alphaFilter Remove any data where the alpha channel is below this value, defaults 0 (all data visible)
 * @param options.width
 * @param options.height
 * @param options.subdivisions
 * @param options.minHeight
 * @param options.maxHeight
 * @param options.colorFilter
 * @param options.buffer
 * @param options.bufferWidth
 * @param options.bufferHeight
 * @param options.alphaFilter
 * @returns the VertexData of the Ground designed from a heightmap
 */
export function CreateGroundFromHeightMapVertexData(options: {
    width: number;
    height: number;
    subdivisions: number;
    minHeight: number;
    maxHeight: number;
    colorFilter: Color3;
    buffer: Uint8Array;
    bufferWidth: number;
    bufferHeight: number;
    alphaFilter: number;
}): VertexData {
    const indices = [];
    const positions = [];
    const normals = [];
    const uvs = [];
    let row, col;
    const filter = options.colorFilter || new Color3(0.3, 0.59, 0.11);
    const alphaFilter = options.alphaFilter || 0.0;
    let invert = false;

    if (options.minHeight > options.maxHeight) {
        invert = true;
        const temp = options.maxHeight;
        options.maxHeight = options.minHeight;
        options.minHeight = temp;
    }

    // Vertices
    for (row = 0; row <= options.subdivisions; row++) {
        for (col = 0; col <= options.subdivisions; col++) {
            const position = new Vector3(
                (col * options.width) / options.subdivisions - options.width / 2.0,
                0,
                ((options.subdivisions - row) * options.height) / options.subdivisions - options.height / 2.0
            );

            // Compute height
            const heightMapX = (((position.x + options.width / 2) / options.width) * (options.bufferWidth - 1)) | 0;
            const heightMapY = ((1.0 - (position.z + options.height / 2) / options.height) * (options.bufferHeight - 1)) | 0;

            const pos = (heightMapX + heightMapY * options.bufferWidth) * 4;
            let r = options.buffer[pos] / 255.0;
            let g = options.buffer[pos + 1] / 255.0;
            let b = options.buffer[pos + 2] / 255.0;
            const a = options.buffer[pos + 3] / 255.0;

            if (invert) {
                r = 1.0 - r;
                g = 1.0 - g;
                b = 1.0 - b;
            }

            const gradient = r * filter.r + g * filter.g + b * filter.b;

            // If our alpha channel is not within our filter then we will assign a 'special' height
            // Then when building the indices, we will ignore any vertex that is using the special height
            if (a >= alphaFilter) {
                position.y = options.minHeight + (options.maxHeight - options.minHeight) * gradient;
            } else {
                position.y = options.minHeight - Epsilon; // We can't have a height below minHeight, normally.
            }

            // Add  vertex
            positions.push(position.x, position.y, position.z);
            normals.push(0, 0, 0);
            uvs.push(col / options.subdivisions, 1.0 - row / options.subdivisions);
        }
    }

    // Indices
    for (row = 0; row < options.subdivisions; row++) {
        for (col = 0; col < options.subdivisions; col++) {
            // Calculate Indices
            const idx1 = col + 1 + (row + 1) * (options.subdivisions + 1);
            const idx2 = col + 1 + row * (options.subdivisions + 1);
            const idx3 = col + row * (options.subdivisions + 1);
            const idx4 = col + (row + 1) * (options.subdivisions + 1);

            // Check that all indices are visible (based on our special height)
            // Only display the vertex if all Indices are visible
            // Positions are stored x,y,z for each vertex, hence the * 3 and + 1 for height
            const isVisibleIdx1 = positions[idx1 * 3 + 1] >= options.minHeight;
            const isVisibleIdx2 = positions[idx2 * 3 + 1] >= options.minHeight;
            const isVisibleIdx3 = positions[idx3 * 3 + 1] >= options.minHeight;
            if (isVisibleIdx1 && isVisibleIdx2 && isVisibleIdx3) {
                indices.push(idx1);
                indices.push(idx2);
                indices.push(idx3);
            }

            const isVisibleIdx4 = positions[idx4 * 3 + 1] >= options.minHeight;
            if (isVisibleIdx4 && isVisibleIdx1 && isVisibleIdx3) {
                indices.push(idx4);
                indices.push(idx1);
                indices.push(idx3);
            }
        }
    }

    // Normals
    VertexData.ComputeNormals(positions, indices, normals);

    // Result
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

/**
 * Creates a ground mesh
 * * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground
 * * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param options.width
 * @param options.height
 * @param options.subdivisions
 * @param options.subdivisionsX
 * @param options.subdivisionsY
 * @param options.updatable
 * @param scene defines the hosting scene
 * @returns the ground mesh
 * @see https://doc.babylonjs.com/how_to/set_shapes#ground
 */
export function CreateGround(
    name: string,
    options: { width?: number; height?: number; subdivisions?: number; subdivisionsX?: number; subdivisionsY?: number; updatable?: boolean } = {},
    scene?: Scene
): GroundMesh {
    const ground = new GroundMesh(name, scene);
    ground._setReady(false);
    ground._subdivisionsX = options.subdivisionsX || options.subdivisions || 1;
    ground._subdivisionsY = options.subdivisionsY || options.subdivisions || 1;
    ground._width = options.width || 1;
    ground._height = options.height || 1;
    ground._maxX = ground._width / 2;
    ground._maxZ = ground._height / 2;
    ground._minX = -ground._maxX;
    ground._minZ = -ground._maxZ;

    const vertexData = CreateGroundVertexData(options);

    vertexData.applyToMesh(ground, options.updatable);

    ground._setReady(true);

    return ground;
}

/**
 * Creates a tiled ground mesh
 * * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates
 * * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates
 * * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the numbers of subdivisions on the ground width and height. Each subdivision is called a tile
 * * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the numbers of subdivisions on the ground width and height of each tile
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param options.xmin
 * @param options.zmin
 * @param options.xmax
 * @param options.zmax
 * @param options.subdivisions
 * @param options.subdivisions.w
 * @param options.subdivisions.h
 * @param options.precision
 * @param options.precision.w
 * @param options.precision.h
 * @param options.updatable
 * @param scene defines the hosting scene
 * @returns the tiled ground mesh
 * @see https://doc.babylonjs.com/how_to/set_shapes#tiled-ground
 */
export function CreateTiledGround(
    name: string,
    options: { xmin: number; zmin: number; xmax: number; zmax: number; subdivisions?: { w: number; h: number }; precision?: { w: number; h: number }; updatable?: boolean },
    scene: Nullable<Scene> = null
): Mesh {
    const tiledGround = new Mesh(name, scene);

    const vertexData = CreateTiledGroundVertexData(options);

    vertexData.applyToMesh(tiledGround, options.updatable);

    return tiledGround;
}

/**
 * Creates a ground mesh from a height map
 * * The parameter `url` sets the URL of the height map image resource.
 * * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.
 * * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.
 * * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.
 * * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.
 * * The parameter `colorFilter` (optional Color3, default (0.3, 0.59, 0.11) ) is the filter to apply to the image pixel colors to compute the height.
 * * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).
 * * The parameter `alphaFilter` will filter any data where the alpha channel is below this value, defaults 0 (all data visible)
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * @param name defines the name of the mesh
 * @param url defines the url to the height map
 * @param options defines the options used to create the mesh
 * @param options.width
 * @param options.height
 * @param options.subdivisions
 * @param options.minHeight
 * @param options.maxHeight
 * @param options.colorFilter
 * @param options.alphaFilter
 * @param options.updatable
 * @param options.onReady
 * @param scene defines the hosting scene
 * @returns the ground mesh
 * @see https://doc.babylonjs.com/babylon101/height_map
 * @see https://doc.babylonjs.com/how_to/set_shapes#ground-from-a-height-map
 */
export function CreateGroundFromHeightMap(
    name: string,
    url: string,
    options: {
        width?: number;
        height?: number;
        subdivisions?: number;
        minHeight?: number;
        maxHeight?: number;
        colorFilter?: Color3;
        alphaFilter?: number;
        updatable?: boolean;
        onReady?: (mesh: GroundMesh) => void;
    } = {},
    scene: Nullable<Scene> = null
): GroundMesh {
    const width = options.width || 10.0;
    const height = options.height || 10.0;
    const subdivisions = options.subdivisions || 1 | 0;
    const minHeight = options.minHeight || 0.0;
    const maxHeight = options.maxHeight || 1.0;
    const filter = options.colorFilter || new Color3(0.3, 0.59, 0.11);
    const alphaFilter = options.alphaFilter || 0.0;
    const updatable = options.updatable;
    const onReady = options.onReady;

    scene = scene || EngineStore.LastCreatedScene!;

    const ground = new GroundMesh(name, scene);
    ground._subdivisionsX = subdivisions;
    ground._subdivisionsY = subdivisions;
    ground._width = width;
    ground._height = height;
    ground._maxX = ground._width / 2.0;
    ground._maxZ = ground._height / 2.0;
    ground._minX = -ground._maxX;
    ground._minZ = -ground._maxZ;

    ground._setReady(false);

    const onload = (img: HTMLImageElement | ImageBitmap) => {
        const bufferWidth = img.width;
        const bufferHeight = img.height;

        if (scene!.isDisposed) {
            return;
        }

        const buffer = <Uint8Array>scene?.getEngine().resizeImageBitmap(img, bufferWidth, bufferHeight);

        const vertexData = CreateGroundFromHeightMapVertexData({
            width: width,
            height: height,
            subdivisions: subdivisions,
            minHeight: minHeight,
            maxHeight: maxHeight,
            colorFilter: filter,
            buffer: buffer,
            bufferWidth: bufferWidth,
            bufferHeight: bufferHeight,
            alphaFilter: alphaFilter,
        });

        vertexData.applyToMesh(ground, updatable);

        //execute ready callback, if set
        if (onReady) {
            onReady(ground);
        }

        ground._setReady(true);
    };

    Tools.LoadImage(url, onload, () => {}, scene.offlineProvider);

    return ground;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the functions directly from the module
 */
export const GroundBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateGround,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateGroundFromHeightMap,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateTiledGround,
};

VertexData.CreateGround = CreateGroundVertexData;
VertexData.CreateTiledGround = CreateTiledGroundVertexData;
VertexData.CreateGroundFromHeightMap = CreateGroundFromHeightMapVertexData;

(Mesh as any).CreateGround = (name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean): Mesh => {
    const options = {
        width,
        height,
        subdivisions,
        updatable,
    };

    return CreateGround(name, options, scene);
};

(Mesh as any).CreateTiledGround = (
    name: string,
    xmin: number,
    zmin: number,
    xmax: number,
    zmax: number,
    subdivisions: { w: number; h: number },
    precision: { w: number; h: number },
    scene: Scene,
    updatable?: boolean
): Mesh => {
    const options = {
        xmin,
        zmin,
        xmax,
        zmax,
        subdivisions,
        precision,
        updatable,
    };

    return CreateTiledGround(name, options, scene);
};

(Mesh as any).CreateGroundFromHeightMap = (
    name: string,
    url: string,
    width: number,
    height: number,
    subdivisions: number,
    minHeight: number,
    maxHeight: number,
    scene: Scene,
    updatable?: boolean,
    onReady?: (mesh: GroundMesh) => void,
    alphaFilter?: number
): GroundMesh => {
    const options = {
        width,
        height,
        subdivisions,
        minHeight,
        maxHeight,
        updatable,
        onReady,
        alphaFilter,
    };

    return CreateGroundFromHeightMap(name, url, options, scene);
};
