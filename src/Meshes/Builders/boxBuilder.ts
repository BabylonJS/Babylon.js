import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreateBox = function(options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean, topBaseAt?: number, bottomBaseAt?: number }): VertexData {
    var nbFaces = 6;
    var indices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];
    var normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0];
    var uvs = [];
    var positions = [];
    var width = options.width || options.size || 1;
    var height = options.height || options.size || 1;
    var depth = options.depth || options.size || 1;
    var wrap = options.wrap || false;
    var topBaseAt = (options.topBaseAt === void 0) ? 1 : options.topBaseAt;
    var bottomBaseAt = (options.bottomBaseAt === void 0) ? 0 : options.bottomBaseAt;
    topBaseAt = (topBaseAt + 4) % 4; // places values as 0 to 3
    bottomBaseAt = (bottomBaseAt + 4) % 4; // places values as 0 to 3
    var topOrder = [2, 0, 3, 1];
    var bottomOrder = [2, 0, 1, 3];
    var topIndex = topOrder[topBaseAt];
    var bottomIndex = bottomOrder[bottomBaseAt];
    var basePositions = [1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, -1, 1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1, -1, -1, 1];
    if (wrap) {
        indices = [2, 3, 0, 2, 0, 1, 4, 5, 6, 4, 6, 7, 9, 10, 11, 9, 11, 8, 12, 14, 15, 12, 13, 14];
        basePositions = [-1, 1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1, -1, -1, -1, -1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1];
        var topFaceBase: any = [[1, 1, 1], [-1, 1, 1], [-1, 1, -1], [1, 1, -1]];
        var bottomFaceBase: any = [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]];
        var topFaceOrder: any = [17, 18, 19, 16];
        var bottomFaceOrder: any = [22, 23, 20, 21];
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
    var scaleArray = [width / 2, height / 2, depth / 2];
    positions = basePositions.reduce(
        (accumulator: Array<number>, currentValue, currentIndex) => accumulator.concat(currentValue * scaleArray[currentIndex % 3]),
        []
    );

    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    var faceUV: Vector4[] = options.faceUV || new Array<Vector4>(6);
    var faceColors = options.faceColors;
    var colors = [];

    // default face colors and UV if undefined
    for (var f = 0; f < 6; f++) {
        if (faceUV[f] === undefined) {
            faceUV[f] = new Vector4(0, 0, 1, 1);
        }
        if (faceColors && faceColors[f] === undefined) {
            faceColors[f] = new Color4(1, 1, 1, 1);
        }
    }

    // Create each face in turn.
    for (var index = 0; index < nbFaces; index++) {
        uvs.push(faceUV[index].z, faceUV[index].w);
        uvs.push(faceUV[index].x, faceUV[index].w);
        uvs.push(faceUV[index].x, faceUV[index].y);
        uvs.push(faceUV[index].z, faceUV[index].y);
        if (faceColors) {
            for (var c = 0; c < 4; c++) {
                colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
            }
        }
    }

    // sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

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

Mesh.CreateBox = (name: string, size: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh => {
    var options = {
        size: size,
        sideOrientation: sideOrientation,
        updatable: updatable
    };

    return BoxBuilder.CreateBox(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class BoxBuilder {
    /**
     * Creates a box mesh
     * * The parameter `size` sets the size (float) of each box side (default 1)
     * * You can set some different box dimensions by using the parameters `width`, `height` and `depth` (all by default have the same value of `size`)
     * * You can set different colors and different images to each box side by using the parameters `faceColors` (an array of 6 Color3 elements) and `faceUV` (an array of 6 Vector4 elements)
     * * Please read this tutorial : https://doc.babylonjs.com/how_to/createbox_per_face_textures_and_colors
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @see https://doc.babylonjs.com/how_to/set_shapes#box
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the box mesh
     */
    public static CreateBox(name: string, options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, wrap?: boolean, topBaseAt?: number, bottomBaseAt?: number, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var box = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        box._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateBox(options);

        vertexData.applyToMesh(box, options.updatable);

        return box;
    }
}