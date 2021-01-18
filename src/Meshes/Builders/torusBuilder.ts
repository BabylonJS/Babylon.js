import { Vector4, Matrix, Vector3, Vector2 } from "../../Maths/math.vector";
import { Mesh, _CreationDataStorage } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import { Scene } from "../../scene";

VertexData.CreateTorus = function(options: { diameter?: number, thickness?: number, tessellation?: number, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }) {
    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];

    var diameter = options.diameter || 1;
    var thickness = options.thickness || 0.5;
    var tessellation = options.tessellation || 16;
    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    var stride = tessellation + 1;

    for (var i = 0; i <= tessellation; i++) {
        var u = i / tessellation;

        var outerAngle = i * Math.PI * 2.0 / tessellation - Math.PI / 2.0;

        var transform = Matrix.Translation(diameter / 2.0, 0, 0).multiply(Matrix.RotationY(outerAngle));

        for (var j = 0; j <= tessellation; j++) {
            var v = 1 - j / tessellation;

            var innerAngle = j * Math.PI * 2.0 / tessellation + Math.PI;
            var dx = Math.cos(innerAngle);
            var dy = Math.sin(innerAngle);

            // Create a vertex.
            var normal = new Vector3(dx, dy, 0);
            var position = normal.scale(thickness / 2);
            var textureCoordinate = new Vector2(u, v);

            position = Vector3.TransformCoordinates(position, transform);
            normal = Vector3.TransformNormal(normal, transform);

            positions.push(position.x, position.y, position.z);
            normals.push(normal.x, normal.y, normal.z);
            uvs.push(textureCoordinate.x, textureCoordinate.y);

            // And create indices for two triangles.
            var nextI = (i + 1) % stride;
            var nextJ = (j + 1) % stride;

            indices.push(i * stride + j);
            indices.push(i * stride + nextJ);
            indices.push(nextI * stride + j);

            indices.push(i * stride + nextJ);
            indices.push(nextI * stride + nextJ);
            indices.push(nextI * stride + j);
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

Mesh.CreateTorus = (name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh => {
    var options = {
        diameter: diameter,
        thickness: thickness,
        tessellation: tessellation,
        sideOrientation: sideOrientation,
        updatable: updatable
    };

    return TorusBuilder.CreateTorus(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
 */
export class TorusBuilder {
    /**
     * Creates a torus mesh
     * * The parameter `diameter` sets the diameter size (float) of the torus (default 1)
     * * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5)
     * * The parameter `tessellation` sets the number of torus sides (positive integer, default 16)
     * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
     * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/babylon101/discover_basic_elements#side-orientation
     * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
     * @param name defines the name of the mesh
     * @param options defines the options used to create the mesh
     * @param scene defines the hosting scene
     * @returns the torus mesh
     * @see https://doc.babylonjs.com/how_to/set_shapes#torus
     */
    public static CreateTorus(name: string, options: { diameter?: number, thickness?: number, tessellation?: number, updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: any): Mesh {
        var torus = new Mesh(name, scene);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        torus._originalBuilderSideOrientation = options.sideOrientation;

        var vertexData = VertexData.CreateTorus(options);

        vertexData.applyToMesh(torus, options.updatable);

        return torus;
    }
}