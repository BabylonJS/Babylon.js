import { Vector4, Vector3, Matrix } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Scene } from "../../scene";
import { Nullable } from '../../types';

VertexData.CreateSphere = function(options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }): VertexData {
    var segments: number = options.segments || 32;
    var diameterX: number = options.diameterX || options.diameter || 1;
    var diameterY: number = options.diameterY || options.diameter || 1;
    var diameterZ: number = options.diameterZ || options.diameter || 1;
    var arc: number = options.arc && (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
    var slice: number = options.slice && (options.slice <= 0) ? 1.0 : options.slice || 1.0;
    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    var radius = new Vector3(diameterX / 2, diameterY / 2, diameterZ / 2);

    var totalZRotationSteps = 2 + segments;
    var totalYRotationSteps = 2 * totalZRotationSteps;

    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    for (var zRotationStep = 0; zRotationStep <= totalZRotationSteps; zRotationStep++) {
        var normalizedZ = zRotationStep / totalZRotationSteps;
        var angleZ = normalizedZ * Math.PI * slice;

        for (var yRotationStep = 0; yRotationStep <= totalYRotationSteps; yRotationStep++) {
            var normalizedY = yRotationStep / totalYRotationSteps;

            var angleY = normalizedY * Math.PI * 2 * arc;

            var rotationZ = Matrix.RotationZ(-angleZ);
            var rotationY = Matrix.RotationY(angleY);
            var afterRotZ = Vector3.TransformCoordinates(Vector3.Up(), rotationZ);
            var complete = Vector3.TransformCoordinates(afterRotZ, rotationY);

            var vertex = complete.multiply(radius);
            var normal = complete.divide(radius).normalize();

            positions.push(vertex.x, vertex.y, vertex.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(normalizedY, normalizedZ);
        }

        if (zRotationStep > 0) {
            var verticesCount = positions.length / 3;
            for (var firstIndex = verticesCount - 2 * (totalYRotationSteps + 1); (firstIndex + totalYRotationSteps + 2) < verticesCount; firstIndex++) {
                if (zRotationStep > 1) {
                    indices.push((firstIndex));
                    indices.push((firstIndex + 1));
                    indices.push(firstIndex + totalYRotationSteps + 1);
                }
                if (zRotationStep < totalZRotationSteps || slice < 1.0) {
                    indices.push((firstIndex + totalYRotationSteps + 1));
                    indices.push((firstIndex + 1));
                    indices.push((firstIndex + totalYRotationSteps + 2));
                }
            }
        }
    }

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

Mesh.CreateSphere = (name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    var options = {
        segments: segments,
        diameterX: diameter,
        diameterY: diameter,
        diameterZ: diameter,
        sideOrientation: sideOrientation,
        updatable: updatable
    };

    return SphereBuilder.CreateSphere(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class SphereBuilder {
    /**
     * Creates a sphere mesh
     * * The parameter `diameter` sets the diameter size (float) of the sphere (default 1)
     * * You can set some different sphere dimensions, for instance to build an ellipsoid, by using the parameters `diameterX`, `diameterY` and `diameterZ` (all by default have the same value of `diameter`)
     * * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32)
     * * You can create an unclosed sphere with the parameter `arc` (positive float, default 1), valued between 0 and 1, what is the ratio of the circumference (latitude) : 2 x PI x ratio
     * * You can create an unclosed sphere on its height with the parameter `slice` (positive float, default1), valued between 0 and 1, what is the height ratio (longitude)
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the sphere mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#sphere
     */
    public static CreateSphere(name: string, options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4, updatable?: boolean }, scene: Nullable<Scene> = null): Mesh {
        var sphere = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        sphere._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateSphere(options);

        vertexData.applyToMesh(sphere, options.updatable);

        return sphere;
    }
}
