import type { Scene } from "../../scene";
import type { Vector4 } from "../../Maths/math.vector";
import { Vector3, Vector2 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";

/**
 * Creates the VertexData of the IcoSphere
 * @param options an object used to set the following optional parameters for the IcoSphere, required but can be empty
 * * radius the radius of the IcoSphere, optional default 1
 * * radiusX allows stretching in the x direction, optional, default radius
 * * radiusY allows stretching in the y direction, optional, default radius
 * * radiusZ allows stretching in the z direction, optional, default radius
 * * flat when true creates a flat shaded mesh, optional, default true
 * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @returns the VertexData of the IcoSphere
 */
export function CreateIcoSphereVertexData(options: {
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    radiusZ?: number;
    flat?: boolean;
    subdivisions?: number;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
}): VertexData {
    const sideOrientation = options.sideOrientation || VertexData.DEFAULTSIDE;
    const radius = options.radius || 1;
    const flat = options.flat === undefined ? true : options.flat;
    const subdivisions = (options.subdivisions || 4) | 0;
    const radiusX = options.radiusX || radius;
    const radiusY = options.radiusY || radius;
    const radiusZ = options.radiusZ || radius;

    const t = (1 + Math.sqrt(5)) / 2;

    // 12 vertex x,y,z
    const icoVertices = [
        -1,
        t,
        -0,
        1,
        t,
        0,
        -1,
        -t,
        0,
        1,
        -t,
        0, // v0-3
        0,
        -1,
        -t,
        0,
        1,
        -t,
        0,
        -1,
        t,
        0,
        1,
        t, // v4-7
        t,
        0,
        1,
        t,
        0,
        -1,
        -t,
        0,
        1,
        -t,
        0,
        -1, // v8-11
    ];

    // index of 3 vertex makes a face of icopshere
    const ico_indices = [
        0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 12, 22, 23, 1, 5, 20, 5, 11, 4, 23, 22, 13, 22, 18, 6, 7, 1, 8, 14, 21, 4, 14, 4, 2, 16, 13, 6, 15, 6, 19, 3, 8, 9, 4, 21, 5, 13, 17,
        23, 6, 13, 22, 19, 6, 18, 9, 8, 1,
    ];
    // vertex for uv have aliased position, not for UV
    const vertices_unalias_id = [
        0,
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        // vertex alias
        0, // 12: 0 + 12
        2, // 13: 2 + 11
        3, // 14: 3 + 11
        3, // 15: 3 + 12
        3, // 16: 3 + 13
        4, // 17: 4 + 13
        7, // 18: 7 + 11
        8, // 19: 8 + 11
        9, // 20: 9 + 11
        9, // 21: 9 + 12
        10, // 22: A + 12
        11, // 23: B + 12
    ];

    // uv as integer step (not pixels !)
    const ico_vertexuv = [
        5,
        1,
        3,
        1,
        6,
        4,
        0,
        0, // v0-3
        5,
        3,
        4,
        2,
        2,
        2,
        4,
        0, // v4-7
        2,
        0,
        1,
        1,
        6,
        0,
        6,
        2, // v8-11
        // vertex alias (for same vertex on different faces)
        0,
        4, // 12: 0 + 12
        3,
        3, // 13: 2 + 11
        4,
        4, // 14: 3 + 11
        3,
        1, // 15: 3 + 12
        4,
        2, // 16: 3 + 13
        4,
        4, // 17: 4 + 13
        0,
        2, // 18: 7 + 11
        1,
        1, // 19: 8 + 11
        2,
        2, // 20: 9 + 11
        3,
        3, // 21: 9 + 12
        1,
        3, // 22: A + 12
        2,
        4, // 23: B + 12
    ];

    // Vertices[0, 1, ...9, A, B] : position on UV plane
    // '+' indicate duplicate position to be fixed (3,9:0,2,3,4,7,8,A,B)
    // First island of uv mapping
    // v = 4h          3+  2
    // v = 3h        9+  4
    // v = 2h      9+  5   B
    // v = 1h    9   1   0
    // v = 0h  3   8   7   A
    //     u = 0 1 2 3 4 5 6  *a

    // Second island of uv mapping
    // v = 4h  0+  B+  4+
    // v = 3h    A+  2+
    // v = 2h  7+  6   3+
    // v = 1h    8+  3+
    // v = 0h
    //     u = 0 1 2 3 4 5 6  *a

    // Face layout on texture UV mapping
    // ============
    // \ 4  /\ 16 /   ======
    //  \  /  \  /   /\ 11 /
    //   \/ 7  \/   /  \  /
    //    =======  / 10 \/
    //   /\ 17 /\  =======
    //  /  \  /  \ \ 15 /\
    // / 8  \/ 12 \ \  /  \
    // ============  \/ 6  \
    // \ 18 /\  ============
    //  \  /  \ \ 5  /\ 0  /
    //   \/ 13 \ \  /  \  /
    //   =======  \/ 1  \/
    //       =============
    //      /\ 19 /\  2 /\
    //     /  \  /  \  /  \
    //    / 14 \/ 9  \/  3 \
    //   ===================

    // uv step is u:1 or 0.5, v:cos(30)=sqrt(3)/2, ratio approx is 84/97
    const ustep = 138 / 1024;
    const vstep = 239 / 1024;
    const uoffset = 60 / 1024;
    const voffset = 26 / 1024;
    // Second island should have margin, not to touch the first island
    // avoid any borderline artefact in pixel rounding
    const island_u_offset = -40 / 1024;
    const island_v_offset = +20 / 1024;
    // face is either island 0 or 1 :
    // second island is for faces : [4, 7, 8, 12, 13, 16, 17, 18]
    const island = [
        0,
        0,
        0,
        0,
        1, //  0 - 4
        0,
        0,
        1,
        1,
        0, //  5 - 9
        0,
        0,
        1,
        1,
        0, //  10 - 14
        0,
        1,
        1,
        1,
        0, //  15 - 19
    ];

    const indices: number[] = [];
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    let current_indice = 0;
    // prepare array of 3 vector (empty) (to be worked in place, shared for each face)
    const face_vertex_pos = new Array(3);
    const face_vertex_uv = new Array(3);
    let v012;
    for (v012 = 0; v012 < 3; v012++) {
        face_vertex_pos[v012] = Vector3.Zero();
        face_vertex_uv[v012] = Vector2.Zero();
    }
    // create all with normals
    for (let face = 0; face < 20; face++) {
        // 3 vertex per face
        for (v012 = 0; v012 < 3; v012++) {
            // look up vertex 0,1,2 to its index in 0 to 11 (or 23 including alias)
            const v_id = ico_indices[3 * face + v012];
            // vertex have 3D position (x,y,z)
            face_vertex_pos[v012].copyFromFloats(
                icoVertices[3 * vertices_unalias_id[v_id]],
                icoVertices[3 * vertices_unalias_id[v_id] + 1],
                icoVertices[3 * vertices_unalias_id[v_id] + 2]
            );
            // Normalize to get normal
            face_vertex_pos[v012].normalize();

            // uv Coordinates from vertex ID
            face_vertex_uv[v012].copyFromFloats(
                ico_vertexuv[2 * v_id] * ustep + uoffset + island[face] * island_u_offset,
                ico_vertexuv[2 * v_id + 1] * vstep + voffset + island[face] * island_v_offset
            );
        }

        // Subdivide the face (interpolate pos, norm, uv)
        // - pos is linear interpolation, then projected to sphere (converge polyhedron to sphere)
        // - norm is linear interpolation of vertex corner normal
        //   (to be checked if better to re-calc from face vertex, or if approximation is OK ??? )
        // - uv is linear interpolation
        //
        // Topology is as below for sub-divide by 2
        // vertex shown as v0,v1,v2
        // interp index is i1 to progress in range [v0,v1[
        // interp index is i2 to progress in range [v0,v2[
        // face index as  (i1,i2)  for /\  : (i1,i2),(i1+1,i2),(i1,i2+1)
        //            and (i1,i2)' for \/  : (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
        //
        //
        //                    i2    v2
        //                    ^    ^
        //                   /    / \
        //                  /    /   \
        //                 /    /     \
        //                /    / (0,1) \
        //               /    #---------\
        //              /    / \ (0,0)'/ \
        //             /    /   \     /   \
        //            /    /     \   /     \
        //           /    / (0,0) \ / (1,0) \
        //          /    #---------#---------\
        //              v0                    v1
        //
        //              --------------------> i1
        //
        // interp of (i1,i2):
        //  along i2 :  x0=lerp(v0,v2, i2/S) <---> x1=lerp(v1,v2, i2/S)
        //  along i1 :  lerp(x0,x1, i1/(S-i2))
        //
        // centroid of triangle is needed to get help normal computation
        //  (c1,c2) are used for centroid location

        const interp_vertex = (i1: number, i2: number, c1: number, c2: number) => {
            // vertex is interpolated from
            //   - face_vertex_pos[0..2]
            //   - face_vertex_uv[0..2]
            const pos_x0 = Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], i2 / subdivisions);
            const pos_x1 = Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], i2 / subdivisions);
            const pos_interp = subdivisions === i2 ? face_vertex_pos[2] : Vector3.Lerp(pos_x0, pos_x1, i1 / (subdivisions - i2));
            pos_interp.normalize();

            let vertex_normal;
            if (flat) {
                // in flat mode, recalculate normal as face centroid normal
                const centroid_x0 = Vector3.Lerp(face_vertex_pos[0], face_vertex_pos[2], c2 / subdivisions);
                const centroid_x1 = Vector3.Lerp(face_vertex_pos[1], face_vertex_pos[2], c2 / subdivisions);
                vertex_normal = Vector3.Lerp(centroid_x0, centroid_x1, c1 / (subdivisions - c2));
            } else {
                // in smooth mode, recalculate normal from each single vertex position
                vertex_normal = new Vector3(pos_interp.x, pos_interp.y, pos_interp.z);
            }
            // Vertex normal need correction due to X,Y,Z radius scaling
            vertex_normal.x /= radiusX;
            vertex_normal.y /= radiusY;
            vertex_normal.z /= radiusZ;
            vertex_normal.normalize();

            const uv_x0 = Vector2.Lerp(face_vertex_uv[0], face_vertex_uv[2], i2 / subdivisions);
            const uv_x1 = Vector2.Lerp(face_vertex_uv[1], face_vertex_uv[2], i2 / subdivisions);
            const uv_interp = subdivisions === i2 ? face_vertex_uv[2] : Vector2.Lerp(uv_x0, uv_x1, i1 / (subdivisions - i2));
            positions.push(pos_interp.x * radiusX, pos_interp.y * radiusY, pos_interp.z * radiusZ);
            normals.push(vertex_normal.x, vertex_normal.y, vertex_normal.z);
            uvs.push(uv_interp.x, CompatibilityOptions.UseOpenGLOrientationForUV ? 1.0 - uv_interp.y : uv_interp.y);
            // push each vertex has member of a face
            // Same vertex can belong to multiple face, it is pushed multiple time (duplicate vertex are present)
            indices.push(current_indice);
            current_indice++;
        };

        for (let i2 = 0; i2 < subdivisions; i2++) {
            for (let i1 = 0; i1 + i2 < subdivisions; i1++) {
                // face : (i1,i2)  for /\  :
                // interp for : (i1,i2),(i1+1,i2),(i1,i2+1)
                interp_vertex(i1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                interp_vertex(i1 + 1, i2, i1 + 1.0 / 3, i2 + 1.0 / 3);
                interp_vertex(i1, i2 + 1, i1 + 1.0 / 3, i2 + 1.0 / 3);
                if (i1 + i2 + 1 < subdivisions) {
                    // face : (i1,i2)' for \/  :
                    // interp for (i1+1,i2),(i1+1,i2+1),(i1,i2+1)
                    interp_vertex(i1 + 1, i2, i1 + 2.0 / 3, i2 + 2.0 / 3);
                    interp_vertex(i1 + 1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
                    interp_vertex(i1, i2 + 1, i1 + 2.0 / 3, i2 + 2.0 / 3);
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
 * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided
 * * The parameter `radius` sets the radius size (float) of the icosphere (default 1)
 * * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value of `radius`)
 * * The parameter `subdivisions` sets the number of subdivisions (positive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size
 * * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param scene defines the hosting scene
 * @returns the icosahedron mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/polyhedra#icosphere
 */
export function CreateIcoSphere(
    name: string,
    options: {
        radius?: number;
        radiusX?: number;
        radiusY?: number;
        radiusZ?: number;
        flat?: boolean;
        subdivisions?: number;
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

    const vertexData = CreateIcoSphereVertexData(options);

    vertexData.applyToMesh(sphere, options.updatable);

    return sphere;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use the function directly from the module
 */
export const IcoSphereBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateIcoSphere,
};

VertexData.CreateIcoSphere = CreateIcoSphereVertexData;

Mesh.CreateIcoSphere = (name: string, options: { radius?: number; flat?: boolean; subdivisions?: number; sideOrientation?: number; updatable?: boolean }, scene: Scene): Mesh => {
    return CreateIcoSphere(name, options, scene);
};
