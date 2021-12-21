import { Scene } from "../../scene";
import { Vector3, Vector2 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../mesh.vertexData";
import { Nullable, FloatArray, IndicesArray } from '../../types';
import { Logger } from "../../Misc/logger";
import { _PrimaryIsoTriangle, GeodesicData, PolyhedronData } from "../geodesicMesh";
import { VertexBuffer } from "../../Buffers/buffer";

/**
 * Creates the Mesh for a Goldberg Polyhedron
 * @param name defines the name of the mesh
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * * m number of horizontal steps along an isogrid
 * * n number of angled steps along an isogrid
 * * size the size of the Goldberg, optional default 1
 * * sizeX allows stretching in the x direction, optional, default size
 * * sizeY allows stretching in the y direction, optional, default size
 * * sizeZ allows stretching in the z direction, optional, default size
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * @param goldBergData polyhedronData defining the Goldberg polyhedron
 * @returns GoldbergSphere mesh
 */
export function CreateGoldbergVertexData(options: { size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, sideOrientation?: number }, goldbergData: PolyhedronData): VertexData {
    const size = options.size;
    const sizeX: number = options.sizeX || size || 1;
    const sizeY: number = options.sizeY || size || 1;
    const sizeZ: number = options.sizeZ || size || 1;
    const sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    const positions = new Array<number>();
    const indices = new Array<number>();
    const normals = new Array<number>();
    const uvs = new Array<number>();

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
            uvs.push((pdata[0] * sizeX - minX) / (maxX - minX), (pdata[1] * sizeY - minY) / (maxY - minY));
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
 * @param name defines the name of the mesh
 * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
 * * m number of horizontal steps along an isogrid
 * * n number of angled steps along an isogrid
 * * size the size of the Goldberg, optional default 1
 * * sizeX allows stretching in the x direction, optional, default size
 * * sizeY allows stretching in the y direction, optional, default size
 * * sizeZ allows stretching in the z direction, optional, default size
 * * updatable defines if the mesh must be flagged as updatable
 * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
 * @param scene defines the hosting scene
 * @returns Goldberg mesh
 */
export function CreateGoldberg(name: string, options: { m?: number, n?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, updatable?: boolean, sideOrientation?: number }, scene: Nullable<Scene> = null): GoldbergMesh {
    let m: number = options.m || 1;
    if (m !== Math.floor(m)) {
        m === Math.floor(m);
        Logger.Warn("m not an integer only floor(m) used");
    }
    let n: number = options.n || 0;
    if (n !== Math.floor(n)) {
        n === Math.floor(n);
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

    const goldberg = new GoldbergMesh(name);

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

/**
 * Defines the set of goldberg data used to create the polygon
 */
export type GoldbergData = {
    /**
     * The list of Goldberg faces colors
     */
    faceColors: Color4[];
    /**
     * The list of Goldberg faces centers
     */
    faceCenters: Vector3[];
    /**
     * The list of Goldberg faces Z axis
     */
    faceZaxis: Vector3[];
    /**
     * The list of Goldberg faces Y axis
     */
    faceXaxis: Vector3[];
    /**
     * The list of Goldberg faces X axis
     */
    faceYaxis: Vector3[];
    /**
     * Defines the number of shared faces
     */
    nbSharedFaces: number;
    /**
     * Defines the number of unshared faces
     */
    nbUnsharedFaces: number;
    /**
     * Defines the total number of goldberg faces
     */
    nbFaces: number;
    /**
     * Defines the number of goldberg faces at the pole
     */
    nbFacesAtPole: number;
    /**
     * Defines the number of adjacent faces per goldberg faces
     */
    adjacentFaces: number[][];
};

/**
 * Mesh for a Goldberg Polyhedron which is made from 12 pentagonal and the rest hexagonal faces
 * @see https://en.wikipedia.org/wiki/Goldberg_polyhedron
 */
export class GoldbergMesh extends Mesh {
    /**
     * Defines the specific Goldberg data used in this mesh construction.
     */
    public goldbergData: GoldbergData = {
        faceColors: [],
        faceCenters: [],
        faceZaxis: [],
        faceXaxis: [],
        faceYaxis: [],
        nbSharedFaces: 0,
        nbUnsharedFaces: 0,
        nbFaces: 0,
        nbFacesAtPole: 0,
        adjacentFaces: [],
    };

    /**
     * Gets the related Goldberg face from pole infos
     * @param poleOrShared Defines the pole index or the shared face index if the fromPole parameter is passed in
     * @param fromPole Defines an optional pole index to find the related info from
     * @returns the goldberg face number
     */
    public relatedGoldbergFace(poleOrShared: number, fromPole?: number): number {
        if (fromPole === void 0) {
            if (poleOrShared > this.goldbergData.nbUnsharedFaces - 1) {
                Logger.Warn("Maximum number of unshared faces used");
                poleOrShared = this.goldbergData.nbUnsharedFaces - 1;
            }
            return this.goldbergData.nbUnsharedFaces + poleOrShared;
        }
        if (poleOrShared > 11) {
            Logger.Warn("Last pole used");
            poleOrShared = 11;
        }
        if (fromPole > this.goldbergData.nbFacesAtPole - 1) {
            Logger.Warn("Maximum number of faces at a pole used");
            fromPole = this.goldbergData.nbFacesAtPole - 1;
        }

        return 12 + poleOrShared * this.goldbergData.nbFacesAtPole + fromPole;
    }

    private _changeGoldbergFaceColors(colorRange: (number | Color4)[][]): number[] {
        for (let i = 0; i < colorRange.length; i++) {
            const min: number = <number>colorRange[i][0];
            const max: number = <number>colorRange[i][1];
            const col: Color4 = <Color4>colorRange[i][2];
            for (let f = min; f < max + 1; f++) {
                this.goldbergData.faceColors[f] = col;
            }
        }

        const newCols: number[] = [];
        for (let f = 0; f < 12; f++) {
            for (let i = 0; i < 5; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        for (let f = 12; f < this.goldbergData.faceColors.length; f++) {
            for (let i = 0; i < 6; i++) {
                newCols.push(this.goldbergData.faceColors[f].r, this.goldbergData.faceColors[f].g, this.goldbergData.faceColors[f].b, this.goldbergData.faceColors[f].a);
            }
        }
        return newCols;
    }

    /**
     * Set new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    public setGoldbergFaceColors(colorRange: (number | Color4)[][]) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.setVerticesData(VertexBuffer.ColorKind, newCols);
    }

    /**
     * Updates new goldberg face colors
     * @param colorRange the new color to apply to the mesh
     */
    public updateGoldbergFaceColors(colorRange: (number | Color4)[][]) {
        const newCols = this._changeGoldbergFaceColors(colorRange);
        this.updateVerticesData(VertexBuffer.ColorKind, newCols);
    }

    private _changeGoldbergFaceUVs(uvRange: (number | Vector2)[][]): FloatArray {
        const uvs: FloatArray = this.getVerticesData(VertexBuffer.UVKind)!!;
        for (let i = 0; i < uvRange.length; i++) {
            const min: number = <number>uvRange[i][0];
            const max: number = <number>uvRange[i][1];
            const center: Vector2 = <Vector2>uvRange[i][2];
            const radius: number = <number>uvRange[i][3];
            const angle: number = <number>uvRange[i][4];
            const points5: number[] = [];
            const points6: number[] = [];
            let u: number;
            let v: number;
            for (let p = 0; p < 5; p++) {
                u = center.x + radius * Math.cos(angle + p * Math.PI / 2.5);
                v = center.y + radius * Math.sin(angle + p * Math.PI / 2.5);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points5.push(u, v);
            }
            for (let p = 0; p < 6; p++) {
                u = center.x + radius * Math.cos(angle + p * Math.PI / 3);
                v = center.y + radius * Math.sin(angle + p * Math.PI / 3);
                if (u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points6.push(u, v);
            }
            for (let f = min; f < Math.min(12, max + 1); f++) {
                for (let p = 0; p < 5; p++) {
                    uvs[10 * f + 2 * p] = points5[2 * p];
                    uvs[10 * f + 2 * p + 1] = points5[2 * p + 1];
                }
            }
            for (let f = Math.max(12, min); f < max + 1; f++) {
                for (let p = 0; p < 6; p++) {
                    //120 + 12 * (f - 12) = 12 * f - 24
                    uvs[12 * f - 24 + 2 * p] = points6[2 * p];
                    uvs[12 * f - 23 + 2 * p] = points6[2 * p + 1];
                }
            }
        }
        return uvs;
    }

    /**
     * set new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    public setGoldbergFaceUVs(uvRange: (number | Vector2)[][]) {
        const newUVs: FloatArray = this._changeGoldbergFaceUVs(uvRange);
        this.setVerticesData(VertexBuffer.UVKind, newUVs);
    }

    /**
     * Updates new goldberg face UVs
     * @param uvRange the new UVs to apply to the mesh
     */
    public updateGoldbergFaceUVs(uvRange: (number | Vector2)[][]) {
        const newUVs = this._changeGoldbergFaceUVs(uvRange);
        this.updateVerticesData(VertexBuffer.UVKind, newUVs);
    }

    /**
     * Places a mesh on a particular face of the goldberg polygon
     * @param mesh Defines the mesh to position
     * @param face Defines the face to position onto
     * @param position Defines the position relative to the face we are positioning the mesh onto
     */
    public placeOnGoldbergFaceAt(mesh: Mesh, face: number, position: Vector3) {
        const orientation = Vector3.RotationFromAxis(this.goldbergData.faceXaxis[face], this.goldbergData.faceYaxis[face], this.goldbergData.faceZaxis[face]);
        mesh.rotation = orientation;
        mesh.position = this.goldbergData.faceCenters[face].add(this.goldbergData.faceXaxis[face].scale(position.x)).add(this.goldbergData.faceYaxis[face].scale(position.y)).add(this.goldbergData.faceZaxis[face].scale(position.z));
    }

    /**
     * Serialize current mesh
     * @param serializationObject defines the object which will receive the serialization data
     */
    public serialize(serializationObject: any): void {
        this.metadata = this.metadata || { };
        this.metadata.goldbergData = this.goldbergData;
        super.serialize(serializationObject);
    }
}

/**
 * Function to use when extending the mesh class to a Goldberg class
 */
export function ExtendMeshToGoldberg(mesh: Mesh): Nullable<GoldbergMesh> {
    const goldbergData = mesh.metadata?.goldbergData;
    if (!goldbergData) {
        return null;
    }

    goldbergData.faceCenters = goldbergData.faceCenters.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    goldbergData.faceZaxis = goldbergData.faceZaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    goldbergData.faceXaxis = goldbergData.faceXaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    goldbergData.faceYaxis = goldbergData.faceYaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));

    const positions: Nullable<FloatArray> = mesh.getVerticesData(VertexBuffer.PositionKind);
    const normals: Nullable<FloatArray> = mesh.getVerticesData(VertexBuffer.NormalKind);
    const colors: Nullable<FloatArray> = mesh.getVerticesData(VertexBuffer.ColorKind);
    const uvs: Nullable<FloatArray> = mesh.getVerticesData(VertexBuffer.UVKind);
    const indices: Nullable<IndicesArray> = mesh.getIndices();

    const vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.colors = colors;
    vertexData.uvs = uvs;

    let updatable = mesh.isVertexBufferUpdatable(VertexBuffer.PositionKind);
    updatable = updatable && mesh.isVertexBufferUpdatable(VertexBuffer.NormalKind);
    updatable = updatable && mesh.isVertexBufferUpdatable(VertexBuffer.ColorKind);
    updatable = updatable && mesh.isVertexBufferUpdatable(VertexBuffer.UVKind);

    const goldberg = new GoldbergMesh(mesh.name);
    vertexData.applyToMesh(goldberg, updatable);
    goldberg.metadata = mesh.metadata;
    goldberg.material = mesh.material;
    goldberg.goldbergData = goldbergData;
    mesh.dispose();

    return goldberg;
}
