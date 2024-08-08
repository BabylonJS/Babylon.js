import type { Vector4 } from "../../Maths/math.vector";
import { Vector3, Matrix } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import type { Nullable } from "../../types";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData for an ellipsoid, defaults to a sphere
 * @param options an object used to set the following optional parameters for the box, required but can be empty
 * * segments sets the number of horizontal strips optional, default 32
 * * diameter sets the axes dimensions, diameterX, diameterY and diameterZ to the value of diameter, optional default 1
 * * diameterX sets the diameterX (x direction) of the ellipsoid, overwrites the diameterX set by diameter, optional, default diameter
 * * diameterY sets the diameterY (y direction) of the ellipsoid, overwrites the diameterY set by diameter, optional, default diameter
 * * diameterZ sets the diameterZ (z direction) of the ellipsoid, overwrites the diameterZ set by diameter, optional, default diameter
 * * arc a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the circumference (latitude) given by the arc value, optional, default 1
 * * slice a number from 0 to 1, to create an unclosed ellipsoid based on the fraction of the height (latitude) given by the arc value, optional, default 1
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the ellipsoid
 */
export function CreateSphereVertexData(options: {
    segments?: number;
    diameter?: number;
    diameterX?: number;
    diameterY?: number;
    diameterZ?: number;
    arc?: number;
    slice?: number;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
    dedupTopBottomIndices?: boolean;
}): VertexData {
    const segments: number = (options.segments || 32) | 0;
    const diameterX: number = options.diameterX || options.diameter || 1;
    const diameterY: number = options.diameterY || options.diameter || 1;
    const diameterZ: number = options.diameterZ || options.diameter || 1;
    const arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
    const slice: number = options.slice && options.slice <= 0 ? 1.0 : options.slice || 1.0;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;
    const dedupTopBottomIndices = !!options.dedupTopBottomIndices;

    const radius = new Vector3(diameterX / 2, diameterY / 2, diameterZ / 2);

    const totalZRotationSteps = 2 + segments;
    const totalYRotationSteps = 2 * totalZRotationSteps;

    const indices = [];
    const positions = [];
    const normals = [];
    const uvs = [];

    for (let zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
        const normalizedZ = zRotationStep / totalZRotationSteps;
        const angleZ = normalizedZ * Math.PI * slice;

        for (let yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
            const normalizedY = yRotationStep / totalYRotationSteps;

            const angleY = normalizedY * Math.PI * 2 * arc;

            const rotationZ = Matrix.RotationZ(-angleZ);
            const rotationY = Matrix.RotationY(angleY);
            const afterRotZ = Vector3.TransformCoordinates(Vector3.Up(), rotationZ);
            const complete = Vector3.TransformCoordinates(afterRotZ, rotationY);

            const vertex = complete.multiply(radius);
            const normal = complete.divide(radius).normalize();

            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(normalizedY, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - normalizedZ : normalizedZ);
        }

        if (zRotationStep > 0) {
            const verticesCount = positions.length / 3;
            for (let firstIndex = verticesCount - 2 * (totalYRotationSteps + 1); firstIndex + totalYRotationSteps + 2 < verticesCount; firstIndex++) {
                if (dedupTopBottomIndices) {
                    if (zRotationStep > 1) {
                        indices.push(firstIndex);
                        indices.push(firstIndex + 1);
                        indices.push(firstIndex + totalYRotationSteps + 1);
                    }
                    if (zRotationStep < totalZRotationSteps || slice < 1.0) {
                        indices.push(firstIndex + totalYRotationSteps + 1);
                        indices.push(firstIndex + 1);
                        indices.push(firstIndex + totalYRotationSteps + 2);
                    }
                } else {
                    indices.push(firstIndex);
                    indices.push(firstIndex + 1);
                    indices.push(firstIndex + totalYRotationSteps + 1);

                    indices.push(firstIndex + totalYRotationSteps + 1);
                    indices.push(firstIndex + 1);
                    indices.push(firstIndex + totalYRotationSteps + 2);
                }
            }
        }
    }

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
 * Creates a sphere mesh
 * * The parameter `diameter` sets the diameter size (float) of the sphere (default 1)
 * * You can set some different sphere dimensions, for instance to build an ellipsoid, by using the parameters `diameterX`, `diameterY` and `diameterZ` (all by default have the same value of `diameter`)
 * * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32)
 * * You can create an unclosed sphere with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference (latitude) : 2 x PI x ratio
 * * You can create an unclosed sphere on its height with the parameter `slice` (positive float, default1), valued between 0 and 1, what is the height ratio (longitude)
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the sphere mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#sphere
 */
export function CreateSphere(
    name: string,
    options: {
        segments?: number;
        diameter?: number;
        diameterX?: number;
        diameterY?: number;
        diameterZ?: number;
        arc?: number;
        slice?: number;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
        updatable?: boolean;
    } = {},
    scene: Nullable<Scene> = null
): Mesh {
    const sphere = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    sphere._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateSphereVertexData(options);

    vertexData.applyToMesh(sphere, options.updatable);

    return sphere;
}

/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use CreateSphere directly
 */
export const SphereBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateSphere,
};

VertexData.CreateSphere = CreateSphereVertexData;

Mesh.CreateSphere = (name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    const options = {
        segments: segments,
        diameterX: diameter,
        diameterY: diameter,
        diameterZ: diameter,
        sideOrientation: sideOrientation,
        updatable: updatable,
    };

    return CreateSphere(name, options, scene);
};
