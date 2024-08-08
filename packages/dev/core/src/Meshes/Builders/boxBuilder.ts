import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix, Vector4 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";
import { CreateGroundVertexData } from "./groundBuilder";

/**
 * Creates the VertexData for a box
 * @param options an object used to set the following optional parameters for the box, required but can be empty
 * * size sets the width, height and depth of the box to the value of size, optional default 1
 * * width sets the width (x direction) of the box, overwrites the width set by size, optional, default size
 * * height sets the height (y direction) of the box, overwrites the height set by size, optional, default size
 * * depth sets the depth (z direction) of the box, overwrites the depth set by size, optional, default size
 * * faceUV an array of 6 Vector4 elements used to set different images to each box side
 * * faceColors an array of 6 Color3 elements used to set different colors to each box side
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the box
 */
export function CreateBoxVertexData(options: {
    size?: number;
    width?: number;
    height?: number;
    depth?: number;
    faceUV?: Vector4[];
    faceColors?: Color4[];
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
    wrap?: boolean;
    topBaseAt?: number;
    bottomBaseAt?: number;
}): VertexData {
    const nbFaces = 6;
    let indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];
    const normals = [
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    ];
    const uvs = [];
    let positions = [];
    const width = options.width || options.size || 1;
    const height = options.height || options.size || 1;
    const depth = options.depth || options.size || 1;
    const wrap = options.wrap || false;
    let topBaseAt = options.topBaseAt === void 0 ? 1 : options.topBaseAt;
    let bottomBaseAt = options.bottomBaseAt === void 0 ? 0 : options.bottomBaseAt;
    topBaseAt = (topBaseAt + 4) % 4; // places values as 0 to 3
    bottomBaseAt = (bottomBaseAt + 4) % 4; // places values as 0 to 3
    const topOrder = [2, 0, 3, 1];
    const bottomOrder = [2, 0, 1, 3];
    let topIndex = topOrder[topBaseAt];
    let bottomIndex = bottomOrder[bottomBaseAt];
    let basePositions = [
        1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1,
        1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1,
    ];
    if (wrap) {
        indices = [2, 3, 0, 2, 0, 1, 4, 5, 6, 4, 6, 7, 9, 10, 11, 9, 11, 8, 12, 14, 15, 12, 13, 14];
        basePositions = [
            -1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1,
        ];
        let topFaceBase: any = [
            [1, 1, 1],
            [-1, 1, 1],
            [-1, 1, -1],
            [1, 1, -1],
        ];
        let bottomFaceBase: any = [
            [-1, -1, 1],
            [1, -1, 1],
            [1, -1, -1],
            [-1, -1, -1],
        ];
        const topFaceOrder: any = [17, 18, 19, 16];
        const bottomFaceOrder: any = [22, 23, 20, 21];
        while (topIndex > 0) {
            topFaceBase.unshift(topFaceBase.pop());
            topFaceOrder.unshift(topFaceOrder.pop());
            topIndex--;
        }
        while (bottomIndex > 0) {
            bottomFaceBase.unshift(bottomFaceBase.pop());
            bottomFaceOrder.unshift(bottomFaceOrder.pop());
            bottomIndex--;
        }
        topFaceBase = topFaceBase.flat();
        bottomFaceBase = bottomFaceBase.flat();
        basePositions = basePositions.concat(topFaceBase).concat(bottomFaceBase);
        indices.push(topFaceOrder[0], topFaceOrder[2], topFaceOrder[3], topFaceOrder[0], topFaceOrder[1], topFaceOrder[2]);
        indices.push(bottomFaceOrder[0], bottomFaceOrder[2], bottomFaceOrder[3], bottomFaceOrder[0], bottomFaceOrder[1], bottomFaceOrder[2]);
    }
    const scaleArray = [width / 2, height / 2, depth / 2];
    positions = basePositions.reduce((accumulator: Array<number>, currentValue, currentIndex) => accumulator.concat(currentValue * scaleArray[currentIndex % 3]), []);

    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    const faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
    const faceColors = options.faceColors;
    const colors = [];

    // default face colors and UV if undefined
    for (let f = 0; f < 6; f++) {
        if (faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }

    // Create each face in turn.
    for (let index = 0; index < nbFaces; index++) {
        uvs.push(faceUV[index].z, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - faceUV[index].w : faceUV[index].w);
        uvs.push(faceUV[index].x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - faceUV[index].w : faceUV[index].w);
        uvs.push(faceUV[index].x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - faceUV[index].y : faceUV[index].y);
        uvs.push(faceUV[index].z, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - faceUV[index].y : faceUV[index].y);
        if (faceColors) {
            for (let c = 0; c < 4; c++) {
                colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
            }
        }
    }

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

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
 * Creates the VertexData for a segmented box
 * @param options an object used to set the following optional parameters for the box, required but can be empty
 * * size sets the width, height and depth of the box to the value of size, optional default 1
 * * width sets the width (x direction) of the box, overwrites the width set by size, optional, default size
 * * height sets the height (y direction) of the box, overwrites the height set by size, optional, default size
 * * depth sets the depth (z direction) of the box, overwrites the depth set by size, optional, default size
 * * segments sets the number of segments on the all axis (1 by default)
 * * widthSegments sets the number of segments on the x axis (1 by default)
 * * heightSegments sets the number of segments on the y axis (1 by default)
 * * depthSegments sets the number of segments on the z axis (1 by default)
 * @returns the VertexData of the box
 */
export function CreateSegmentedBoxVertexData(options: {
    size?: number;
    width?: number;
    height?: number;
    depth?: number;
    segments?: number;
    widthSegments?: number;
    heightSegments?: number;
    depthSegments?: number;
}): VertexData {
    const width = options.width || options.size || 1;
    const height = options.height || options.size || 1;
    const depth = options.depth || options.size || 1;
    const widthSegments = (options.widthSegments || options.segments || 1) | 0;
    const heightSegments = (options.heightSegments || options.segments || 1) | 0;
    const depthSegments = (options.depthSegments || options.segments || 1) | 0;
    const rotationMatrix = new Matrix();
    const translationMatrix = new Matrix();
    const transformMatrix = new Matrix();

    const bottomPlane = CreateGroundVertexData({ width: width, height: depth, subdivisionsX: widthSegments, subdivisionsY: depthSegments });
    Matrix.TranslationToRef(0, -height / 2, 0, translationMatrix);
    Matrix.RotationZToRef(Math.PI, rotationMatrix);
    rotationMatrix.multiplyToRef(translationMatrix, transformMatrix);
    bottomPlane.transform(transformMatrix);

    const topPlane = CreateGroundVertexData({ width: width, height: depth, subdivisionsX: widthSegments, subdivisionsY: depthSegments });
    Matrix.TranslationToRef(0, height / 2, 0, transformMatrix);
    topPlane.transform(transformMatrix);

    const negXPlane = CreateGroundVertexData({ width: height, height: depth, subdivisionsX: heightSegments, subdivisionsY: depthSegments });
    Matrix.TranslationToRef(-width / 2, 0, 0, translationMatrix);
    Matrix.RotationZToRef(Math.PI / 2, rotationMatrix);
    rotationMatrix.multiplyToRef(translationMatrix, transformMatrix);
    negXPlane.transform(transformMatrix);

    const posXPlane = CreateGroundVertexData({ width: height, height: depth, subdivisionsX: heightSegments, subdivisionsY: depthSegments });
    Matrix.TranslationToRef(width / 2, 0, 0, translationMatrix);
    Matrix.RotationZToRef(-Math.PI / 2, rotationMatrix);
    rotationMatrix.multiplyToRef(translationMatrix, transformMatrix);
    posXPlane.transform(transformMatrix);

    const negZPlane = CreateGroundVertexData({ width: width, height: height, subdivisionsX: widthSegments, subdivisionsY: heightSegments });
    Matrix.TranslationToRef(0, 0, -depth / 2, translationMatrix);
    Matrix.RotationXToRef(-Math.PI / 2, rotationMatrix);
    rotationMatrix.multiplyToRef(translationMatrix, transformMatrix);
    negZPlane.transform(transformMatrix);

    const posZPlane = CreateGroundVertexData({ width: width, height: height, subdivisionsX: widthSegments, subdivisionsY: heightSegments });
    Matrix.TranslationToRef(0, 0, depth / 2, translationMatrix);
    Matrix.RotationXToRef(Math.PI / 2, rotationMatrix);
    rotationMatrix.multiplyToRef(translationMatrix, transformMatrix);
    posZPlane.transform(transformMatrix);

    // Result
    bottomPlane.merge([topPlane, posXPlane, negXPlane, negZPlane, posZPlane], true);

    return bottomPlane;
}

/**
 * Creates a box mesh
 * * The parameter `size` sets the size (float) of each box side (default 1)
 * * You can set some different box dimensions by using the parameters `width`, `height` and `depth` (all by default have the same value of `size`)
 * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 Color3 elements) and `faceUV` (an array of 6 Vector4 elements)
 * * Please read this tutorial : https://doc.babylonjs.com/features/featuresDeepDive/materials/using/texturePerBoxFace
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#box
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the box mesh
 */
export function CreateBox(
    name: string,
    options: {
        size?: number;
        width?: number;
        height?: number;
        depth?: number;
        faceUV?: Vector4[];
        faceColors?: Color4[];
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        wrap?: boolean;
        topBaseAt?: number;
        bottomBaseAt?: number;
        updatable?: boolean;
    } = {},
    scene: Nullable<Scene> = null
): Mesh {
    const box = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    box._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateBoxVertexData(options);

    vertexData.applyToMesh(box, options.updatable);

    return box;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated please use CreateBox directly
 */
export const BoxBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateBox,
};

// Side effects
VertexData.CreateBox = CreateBoxVertexData;

Mesh.CreateBox = (name: string, size: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        size,
        sideOrientation,
        updatable,
    };

    return CreateBox(name, options, scene);
};
