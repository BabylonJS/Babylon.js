import { Scene } from "../../scene";
import { Vector4 } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Nullable } from '../../types';
import { Plane } from '../../Maths/math.plane';

VertexData.CreatePlane = function(options: { size?: number, width?: number, height?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    var width: number = options.width || options.size || 1;
    var height: number = options.height || options.size || 1;
    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // Vertices
    var halfWidth = width / 2.0;
    var halfHeight = height / 2.0;

    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, 0.0);

    positions.push(halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(1.0, 0.0);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(1.0, 1.0);

    positions.push(-halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, 1.0);

    // Indices
    indices.push(0);
    indices.push(1);
    indices.push(2);

    indices.push(0);
    indices.push(2);
    indices.push(3);

    // Sides
    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    // Result
    var vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
};

Mesh.CreatePlane = (name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    var options = {
        size: size,
        width: size,
        height: size,
        sideOrientation: sideOrientation,
        updatable: updatable
    };

    return PlaneBuilder.CreatePlane(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class PlaneBuilder {
    /**
     * Creates a plane mesh
     * * The parameter `size` sets the size (float) of both sides of the plane at once (default 1)
     * * You can set some different plane dimensions by using the parameters `width` and `height` (both by default have the same value of `size`)
     * * The parameter `sourcePlane` is a Plane instance. It builds a mesh plane from a Math plane
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the plane mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#plane
     */
    public static CreatePlane(name: string, options: { size?: number, width?: number, height?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean, sourcePlane?: Plane }, scene: Nullable<Scene> = null): Mesh {
        var plane = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        plane._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreatePlane(options);

        vertexData.applyToMesh(plane, options.updatable);

        if (options.sourcePlane) {
            plane.translate(options.sourcePlane.normal, -options.sourcePlane.d);
            plane.setDirection(options.sourcePlane.normal.scale(-1));
        }

        return plane;
    }
}