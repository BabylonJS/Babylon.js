import type { Vector4 } from "../../Maths/math.vector";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import { useOpenGLOrientationForUV } from "../../Compat/compatibilityOptions";

// based on http://code.google.com/p/away3d/source/browse/trunk/fp10/Away3D/src/away3d/primitives/TorusKnot.as?spec=svn2473&r=2473
/**
 * Creates the VertexData for a TorusKnot
 * @param options an object used to set the following optional parameters for the TorusKnot, required but can be empty
 * * radius the radius of the torus knot, optional, default 2
 * * tube the thickness of the tube, optional, default 0.5
 * * radialSegments the number of sides on each tube segments, optional, default 32
 * * tubularSegments the number of tubes to decompose the knot into, optional, default 32
 * * p the number of windings around the z axis, optional,  default 2
 * * q the number of windings around the x axis, optional,  default 3
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
 * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
 * @param options.radius
 * @param options.tube
 * @param options.radialSegments
 * @param options.tubularSegments
 * @param options.p
 * @param options.q
 * @param options.sideOrientation
 * @param options.frontUVs
 * @param options.backUVs
 * @returns the VertexData of the Torus Knot
 */
export function CreateTorusKnotVertexData(options: {
    radius?: number;
    tube?: number;
    radialSegments?: number;
    tubularSegments?: number;
    p?: number;
    q?: number;
    sideOrientation?: number;
    frontUVs?: Vector4;
    backUVs?: Vector4;
}): VertexData {
    const indices: number[] = [];
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const radius = options.radius || 2;
    const tube = options.tube || 0.5;
    const radialSegments = options.radialSegments || 32;
    const tubularSegments = options.tubularSegments || 32;
    const p = options.p || 2;
    const q = options.q || 3;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    // Helper
    const getPos = (angle: number) => {
        const cu = Math.cos(angle);
        const su = Math.sin(angle);
        const quOverP = (q / p) * angle;
        const cs = Math.cos(quOverP);

        const tx = radius * (2 + cs) * 0.5 * cu;
        const ty = radius * (2 + cs) * su * 0.5;
        const tz = radius * Math.sin(quOverP) * 0.5;

        return new Vector3(tx, ty, tz);
    };

    // Vertices
    let i: number;
    let j: number;
    for (i = 0; i <= radialSegments; i++) {
        const modI = i % radialSegments;
        const u = (modI / radialSegments) * 2 * p * Math.PI;
        const p1 = getPos(u);
        const p2 = getPos(u + 0.01);
        const tang = p2.subtract(p1);
        let n = p2.add(p1);

        const bitan = Vector3.Cross(tang, n);
        n = Vector3.Cross(bitan, tang);

        bitan.normalize();
        n.normalize();

        for (j = 0; j < tubularSegments; j++) {
            const modJ = j % tubularSegments;
            const v = (modJ / tubularSegments) * 2 * Math.PI;
            const cx = -tube * Math.cos(v);
            const cy = tube * Math.sin(v);

            positions.push(p1.x + cx * n.x + cy * bitan.x);
            positions.push(p1.y + cx * n.y + cy * bitan.y);
            positions.push(p1.z + cx * n.z + cy * bitan.z);

            uvs.push(i / radialSegments);
            uvs.push(useOpenGLOrientationForUV ? 1.0 - j / tubularSegments : j / tubularSegments);
        }
    }

    for (i = 0; i < radialSegments; i++) {
        for (j = 0; j < tubularSegments; j++) {
            const jNext = (j + 1) % tubularSegments;
            const a = i * tubularSegments + j;
            const b = (i + 1) * tubularSegments + j;
            const c = (i + 1) * tubularSegments + jNext;
            const d = i * tubularSegments + jNext;

            indices.push(d);
            indices.push(b);
            indices.push(a);
            indices.push(d);
            indices.push(c);
            indices.push(b);
        }
    }

    // Normals
    VertexData.ComputeNormals(positions, indices, normals);

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
 * Creates a torus knot mesh
 * * The parameter `radius` sets the global radius size (float) of the torus knot (default 2)
 * * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32)
 * * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32)
 * * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3)
 * * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
 * * If you create a double-sided mesh, you can choose what parts of the texture image to crop and stick respectively on the front and the back sides with the parameters `frontUVs` and `backUVs` (Vector4). Detail here : https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#side-orientation
 * * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
 * @param name defines the name of the mesh
 * @param options defines the options used to create the mesh
 * @param options.radius
 * @param options.tube
 * @param options.radialSegments
 * @param options.tubularSegments
 * @param options.p
 * @param options.q
 * @param options.updatable
 * @param options.sideOrientation
 * @param options.frontUVs
 * @param options.backUVs
 * @param scene defines the hosting scene
 * @returns the torus knot mesh
 * @see  https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set#torus-knot
 */
export function CreateTorusKnot(
    name: string,
    options: {
        radius?: number;
        tube?: number;
        radialSegments?: number;
        tubularSegments?: number;
        p?: number;
        q?: number;
        updatable?: boolean;
        sideOrientation?: number;
        frontUVs?: Vector4;
        backUVs?: Vector4;
    } = {},
    scene?: Scene
): Mesh {
    const torusKnot = new Mesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    torusKnot._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateTorusKnotVertexData(options);

    vertexData.applyToMesh(torusKnot, options.updatable);

    return torusKnot;
}
/**
 * Class containing static functions to help procedurally build meshes
 * @deprecated use CreateTorusKnot instead
 */
export const TorusKnotBuilder = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    CreateTorusKnot,
};

VertexData.CreateTorusKnot = CreateTorusKnotVertexData;

Mesh.CreateTorusKnot = (
    name: string,
    radius: number,
    tube: number,
    radialSegments: number,
    tubularSegments: number,
    p: number,
    q: number,
    scene?: Scene,
    updatable?: boolean,
    sideOrientation?: number
): Mesh => {
    const options = {
        radius,
        tube,
        radialSegments,
        tubularSegments,
        p,
        q,
        sideOrientation,
        updatable,
    };

    return CreateTorusKnot(name, options, scene);
};
