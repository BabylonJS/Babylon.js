import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector4, Color4, Vector3 } from "../../Maths/math";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";

VertexData.CreateBox = function(options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
    var normalsSource = [
        new Vector3(0, 0, 1),
        new Vector3(0, 0, -1),
        new Vector3(1, 0, 0),
        new Vector3(-1, 0, 0),
        new Vector3(0, 1, 0),
        new Vector3(0, -1, 0)
    ];

    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    var width = options.width || options.size || 1;
    var height = options.height || options.size || 1;
    var depth = options.depth || options.size || 1;
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

    var scaleVector = new Vector3(width / 2, height / 2, depth / 2);

    // Create each face in turn.
    for (var index = 0; index < normalsSource.length; index++) {
        var normal = normalsSource[index];

        // Get two vectors perpendicular to the face normal and to each other.
        var side1 = new Vector3(normal.y, normal.z, normal.x);
        var side2 = Vector3.Cross(normal, side1);

        // Six indices (two triangles) per face.
        var verticesLength = positions.length / 3;
        indices.push(verticesLength);
        indices.push(verticesLength + 1);
        indices.push(verticesLength + 2);

        indices.push(verticesLength);
        indices.push(verticesLength + 2);
        indices.push(verticesLength + 3);

        // Four vertices per face.
        var vertex = normal.subtract(side1).subtract(side2).multiply(scaleVector);
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(faceUV[index].z, faceUV[index].w);
        if (faceColors) {
            colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
        }

        vertex = normal.subtract(side1).add(side2).multiply(scaleVector);
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(faceUV[index].x, faceUV[index].w);
        if (faceColors) {
            colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
        }

        vertex = normal.add(side1).add(side2).multiply(scaleVector);
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(faceUV[index].x, faceUV[index].y);
        if (faceColors) {
            colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
        }

        vertex = normal.add(side1).subtract(side2).multiply(scaleVector);
        positions.push(vertex.x, vertex.y, vertex.z);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(faceUV[index].z, faceUV[index].y);
        if (faceColors) {
            colors.push(faceColors[index].r, faceColors[index].g, faceColors[index].b, faceColors[index].a);
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
    public static CreateBox(name: string, options: { size?: number, width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var box = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        box._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateBox(options);

        vertexData.applyToMesh(box, options.updatable);

        return box;
    }
}