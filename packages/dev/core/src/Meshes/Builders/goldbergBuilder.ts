import type { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { Color4 } from "../../Maths/math.color";
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../mesh.vertexData";
import type { Nullable } from "../../types";
import { Logger } from "../../Misc/logger";
import type { PolyhedronData } from "../geodesicMesh";
import { _PrimaryIsoTriangle, GeodesicData } from "../geodesicMesh";
import { GoldbergMesh } from "../goldbergMesh";
import { useOpenGLOrientationForUV } from "../../Compat/compatibilityOptions";

/**
 * Defines the set of data required to create goldberg vertex data.
 */
export type GoldbergVertexDataOption = {
    /**
     * the size of the Goldberg, optional default 1
     */
    size?: number;
    /**
     * allows stretching in the x direction, optional, default size
     */
    sizeX?: number;
    /**
     * allows stretching in the y direction, optional, default size
     */
    sizeY?: number;
    /**
     * allows stretching in the z direction, optional, default size
     */
    sizeZ?: number;
    /**
     * optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     */
    sideOrientation?: number;
};

/**
 * Defines the set of data required to create a goldberg mesh.
 */
export type GoldbergCreationOption = {
    /**
     * number of horizontal steps along an isogrid
     */
    m?: number;
    /**
     * number of angled steps along an isogrid
     */
    n?: number;
    /**
     * defines if the mesh must be flagged as updatable
     */
    updatable?: boolean;
} & GoldbergVertexDataOption;

/**
 * Creates the Mesh for a Goldberg Polyhedron
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * @param goldbergData polyhedronData defining the Goldberg polyhedron
 * @returns GoldbergSphere mesh
 */
export function CreateGoldbergVertexData(options: GoldbergVertexDataOption, goldbergData: PolyhedronData): VertexData {
    const size = options.size;
    const sizeX: number = options.sizeX || size || 1;
    const sizeY: number = options.sizeY || size || 1;
    const sizeZ: number = options.sizeZ || size || 1;
    const sideOrientation = options.sideOrientation === 0 ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let v = 0; v < goldbergData.vertex.length; v++) {
        minX = Math.min(minX, goldbergData.vertex[v][0] * sizeX);
        maxX = Math.max(maxX, goldbergData.vertex[v][0] * sizeX);
        minY = Math.min(minY, goldbergData.vertex[v][1] * sizeY);
        maxY = Math.max(maxY, goldbergData.vertex[v][1] * sizeY);
    }

    let index: number = 0;
    for (let f = 0; f < goldbergData.face.length; f++) {
        const verts = goldbergData.face[f];
        const a = Vector3.FromArray(goldbergData.vertex[verts[0]]);
        const b = Vector3.FromArray(goldbergData.vertex[verts[2]]);
        const c = Vector3.FromArray(goldbergData.vertex[verts[1]]);
        const ba = b.subtract(a);
        const ca = c.subtract(a);
        const norm = Vector3.Cross(ca, ba).normalize();
        for (let v = 0; v < verts.length; v++) {
            normals.push(norm.x, norm.y, norm.z);
            const pdata = goldbergData.vertex[verts[v]];
            positions.push(pdata[0] * sizeX, pdata[1] * sizeY, pdata[2] * sizeZ);
            const vCoord = (pdata[1] * sizeY - minY) / (maxY - minY);
            uvs.push((pdata[0] * sizeX - minX) / (maxX - minX), useOpenGLOrientationForUV ? 1 - vCoord : vCoord);
        }
        for (let v = 0; v < verts.length - 2; v++) {
            indices.push(index, index + v + 2, index + v + 1);
        }
        index += verts.length;
    }

    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs);

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    return vertexData;
}

/**
 * Creates the Mesh for a Goldberg Polyhedron which is made from 12 pentagonal and the rest hexagonal faces
 * @see https://en.wikipedia.org/wiki/Goldberg_polyhedron
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/polyhedra/goldberg_poly
 * @param name defines the name of the mesh
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * @param scene defines the hosting scene
 * @returns Goldberg mesh
 */
export function CreateGoldberg(name: string, options: GoldbergCreationOption, scene: Nullable<Scene> = null): GoldbergMesh {
    const size = options.size;
    const sizeX: number = options.sizeX || size || 1;
    const sizeY: number = options.sizeY || size || 1;
    const sizeZ: number = options.sizeZ || size || 1;
    let m: number = options.m || 1;
    if (m !== Math.floor(m)) {
        m = Math.floor(m);
        Logger.Warn("m not an integer only floor(m) used");
    }
    let n: number = options.n || 0;
    if (n !== Math.floor(n)) {
        n = Math.floor(n);
        Logger.Warn("n not an integer only floor(n) used");
    }
    if (n > m) {
        const temp = n;
        n = m;
        m = temp;
        Logger.Warn("n > m therefore m and n swapped");
    }
    const primTri: _PrimaryIsoTriangle = new _PrimaryIsoTriangle();
    primTri.build(m, n);
    const geodesicData = GeodesicData.BuildGeodesicData(primTri);
    const goldbergData = geodesicData.toGoldbergPolyhedronData();

    const goldberg = new GoldbergMesh(name, scene);

    options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
    goldberg._originalBuilderSideOrientation = options.sideOrientation;

    const vertexData = CreateGoldbergVertexData(options, goldbergData);

    vertexData.applyToMesh(goldberg, options.updatable);

    goldberg.goldbergData.nbSharedFaces = geodesicData.sharedNodes;
    goldberg.goldbergData.nbUnsharedFaces = geodesicData.poleNodes;
    goldberg.goldbergData.adjacentFaces = geodesicData.adjacentFaces;
    goldberg.goldbergData.nbFaces = goldberg.goldbergData.nbSharedFaces + goldberg.goldbergData.nbUnsharedFaces;
    goldberg.goldbergData.nbFacesAtPole = (goldberg.goldbergData.nbUnsharedFaces - 12) / 12;
    for (let f = 0; f < geodesicData.vertex.length; f++) {
        goldberg.goldbergData.faceCenters.push(Vector3.FromArray(geodesicData.vertex[f]));
        goldberg.goldbergData.faceCenters[f].x *= sizeX;
        goldberg.goldbergData.faceCenters[f].y *= sizeY;
        goldberg.goldbergData.faceCenters[f].z *= sizeZ;
        goldberg.goldbergData.faceColors.push(new Color4(1, 1, 1, 1));
    }

    for (let f = 0; f < goldbergData.face.length; f++) {
        const verts = goldbergData.face[f];
        const a = Vector3.FromArray(goldbergData.vertex[verts[0]]);
        const b = Vector3.FromArray(goldbergData.vertex[verts[2]]);
        const c = Vector3.FromArray(goldbergData.vertex[verts[1]]);
        const ba = b.subtract(a);
        const ca = c.subtract(a);
        const norm = Vector3.Cross(ca, ba).normalize();
        const z = Vector3.Cross(ca, norm).normalize();
        goldberg.goldbergData.faceXaxis.push(ca.normalize());
        goldberg.goldbergData.faceYaxis.push(norm);
        goldberg.goldbergData.faceZaxis.push(z);
    }

    return goldberg;
}
