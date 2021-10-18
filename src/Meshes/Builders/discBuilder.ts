import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";

/**
 * Creates the VertexData of the Disc or regular Polygon
 * @param options an object used to set the following optional parameters for the disc, required but can be empty
  * * radius the radius of the disc, optional default 0.5
  * * tessellation the number of polygon sides, optional, default 64
  * * arc a number from 0 to 1, to create an unclosed polygon based on the fraction of the circumference given by the arc value, optional, default 1
  * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
  * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
  * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the box
 */
function CreateDiscVertexData(options: { radius?: number, tessellation?: number, arc?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
    var positions = new Array<number>();
    var indices = new Array<number>();
    var normals = new Array<number>();
    var uvs = new Array<number>();

    var radius = options.radius || 0.5;
    var tessellation = options.tessellation || 64;
    var arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // positions and uvs
    positions.push(0, 0, 0);    // disc center first
    uvs.push(0.5, 0.5);

    var theta = Math.PI * 2 * arc;
    var step = arc === 1 ? theta / tessellation : theta / (tessellation - 1);
    var a = 0;
    for (var t = 0; t < tessellation; t++) {
        var x = Math.cos(a);
        var y = Math.sin(a);
        var u = (x + 1) / 2;
        var v = (1 - y) / 2;
        positions.push(radius * x, radius * y, 0);
        uvs.push(u, v);
        a += step;
    }
    if (arc === 1) {
        positions.push(positions[3], positions[4], positions[5]); // close the circle
        uvs.push(uvs[2], uvs[3]);
    }

    //indices
    var vertexNb = positions.length / 3;
    for (var i = 1; i < vertexNb - 1; i++) {
        indices.push(i + 1, 0, i);
    }

    // result
    VertexData.ComputeNormals(positions, indices, normals);
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    var vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

/**
 * Creates a plane polygonal mesh.  By default, this is a disc
 * * The parameter `radius` sets the radius size (float) of the polygon (default 0.5)
 * * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc
 * * You can create an unclosed polygon with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference : 2 x PI x ratio
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the plane polygonal mesh
 * @see https://doc.babylonjs.com/how_to/set_shapes#disc-or-regular-polygon
 */
export function CreateDisc(name: string, options: { radius?: number, tessellation?: number, arc?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): Mesh {
    var disc = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    disc._originalBuilderSideOrientation = options.sideOrientation;

    var vertexData = CreateDiscVertexData(options);

    vertexData.applyToMesh(disc, options.updatable);

    return disc;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated please use CreateDisc directly
 */
export const DiscBuilder = {
    CreateDisc
};

VertexData.CreateDisc = CreateDiscVertexData;

Mesh.CreateDisc = (name: string, radius: number, tessellation: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        radius,
        tessellation,
        sideOrientation,
        updatable
    };

    return CreateDisc(name, options, scene);
};