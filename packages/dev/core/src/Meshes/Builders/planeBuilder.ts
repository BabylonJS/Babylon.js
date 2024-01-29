import type { Scene } from "../../scene";
import type { Vector4 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import type { Plane } from "../../Maths/math.plane";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData for a Plane
 * @param options an object used to set the following optional parameters for the plane, required but can be empty
 * * size sets the width and height of the plane to the value of size, optional default 1
 * * width sets the width (x direction) of the plane, overwrites the width set by size, optional, default size
 * * height sets the height (y direction) of the plane, overwrites the height set by size, optional, default size
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the box
 */
export function CreatePlaneVertexData(options: { size?: number; width?: number; height?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4 }): VertexData {
    const indices = [];
    const positions = [];
    const normals = [];
    const uvs = [];

    const width: number = options.width || options.size || 1;
    const height: number = options.height || options.size || 1;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // Vertices
    const halfWidth = width / 2.0;
    const halfHeight = height / 2.0;

    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 : 0.0);

    positions.push(halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(1.0, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 : 0.0);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(1.0, CompatibilityOptions.UseOpenGLOrientationForUV ? 0.0 : 1.0);

    positions.push(-halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, CompatibilityOptions.UseOpenGLOrientationForUV ? 0.0 : 1.0);

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
    const vertexData = new VertexData();

    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    return vertexData;
}

/**
 * Creates a plane mesh
 * * The parameter `size` sets the size (float) of both sides of the plane at once (default 1)
 * * You can set some different plane dimensions by using the parameters `width` and `height` (both by default have the same value of `size`)
 * * The parameter `sourcePlane` is a Plane instance. It builds a mesh plane from a Math plane
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the plane mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#plane
 */
export function CreatePlane(
    name: string,
    options: { size?: number; width?: number; height?: number; sideOrientation?: number; frontUVs?: Vector4; backUVs?: Vector4; updatable?: boolean; sourcePlane?: Plane } = {},
    scene: Nullable<Scene> = null
): Mesh {
    const plane = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    plane._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreatePlaneVertexData(options);

    vertexData.applyToMesh(plane, options.updatable);

    if (options.sourcePlane) {
        plane.translate(options.sourcePlane.normal, -options.sourcePlane.d);
        plane.setDirection(options.sourcePlane.normal.scale(-1));
    }

    return plane;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const PlaneBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreatePlane,
};

VertexData.CreatePlane = CreatePlaneVertexData;
Mesh.CreatePlane = (name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        size,
        width: size,
        height: size,
        sideOrientation,
        updatable,
    };

    return CreatePlane(name, options, scene);
};
