import { Scene } from "../../scene";
import { Vector3, Vector2 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../mesh.vertexData";
import { Nullable, FloatArray, IndicesArray } from '../../types';
import { Logger } from "../../Misc/logger";
import { _PrimaryIsoTriangle, GeodesicData, PolyhedronData } from "../geodesicMesh";
import { VertexBuffer } from "../../Buffers/buffer";

VertexData.CreateGoldberg = function (options: { size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, sideOrientation?: number }, goldbergData: PolyhedronData): VertexData {

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
};

/**
 * Class containing static functions to help procedurally build a Goldberg mesh
 */
export class GoldbergBuilder {
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
    public static CreateGoldberg(name: string, options: { m?: number, n?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, updatable?: boolean, sideOrientation?: number }, scene: Nullable<Scene> = null): Mesh {
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
        const goldbergData = geodesicData.toGoldbergData();

        const goldberg = new GoldbergMesh(name);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        goldberg._originalBuilderSideOrientation = options.sideOrientation;

        const vertexData = VertexData.CreateGoldberg(options, goldbergData);

        vertexData.applyToMesh(goldberg, options.updatable);

        goldberg.nbSharedFaces = geodesicData.sharedNodes;
        goldberg.nbUnsharedFaces = geodesicData.poleNodes;
        goldberg.adjacentFaces = geodesicData.adjacentFaces;
        goldberg.nbFaces = goldberg.nbSharedFaces + goldberg.nbUnsharedFaces;
        goldberg.nbFacesAtPole = (goldberg.nbUnsharedFaces - 12) / 12;
        for (let f = 0; f < geodesicData.vertex.length; f++) {
            goldberg.faceCenters.push(Vector3.FromArray(geodesicData.vertex[f]));
            goldberg.faceColors.push(new Color4(1, 1, 1, 1));
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
            goldberg.faceXaxis.push(ca.normalize());
            goldberg.faceYaxis.push(norm);
            goldberg.faceZaxis.push(z);
        }
        goldberg.setMetadata();

        return goldberg;
    }
}

/**
 * Mixin to extend the Mesh class to a Goldberg class
 * When applied to extend a mesh tthe mesh must be an import of a previously exported Goldberg mesh
 */
function GoldbergCreate() {
    return class Goldberg extends Mesh {
        public faceColors: Color4[] = [];
        public faceCenters: Vector3[] = [];
        public faceZaxis: Vector3[] = [];
        public faceXaxis: Vector3[] = [];
        public faceYaxis: Vector3[] = [];
        public nbSharedFaces: number;
        public nbUnsharedFaces: number;
        public nbFaces: number;
        public nbFacesAtPole: number;
        public adjacentFaces: number[][];

        public setMetadata() {
            this.metadata = {
                nbSharedFaces: this.nbSharedFaces,
                nbUnsharedFaces: this.nbUnsharedFaces,
                nbFacesAtPole: this.nbFacesAtPole,
                nbFaces: this.nbFaces,
                faceCenters: this.faceCenters,
                faceXaxis: this.faceXaxis,
                faceYaxis: this.faceYaxis,
                faceZaxis: this.faceZaxis,
                adjacentFaces: this.adjacentFaces
            };
        }

        public relFace(poleOrShared: number, fromPole?: number): number {
            if (fromPole === void 0) {
                if (poleOrShared > this.nbUnsharedFaces - 1) {
                    Logger.Warn("Maximum number of unshared faces used");
                    poleOrShared = this.nbUnsharedFaces - 1;
                }
                return this.nbUnsharedFaces + poleOrShared;
            }
            if (poleOrShared > 11) {
                Logger.Warn("Last pole used");
                poleOrShared = 11;
            }
            if (fromPole > this.nbFacesAtPole - 1) {
                Logger.Warn("Maximum number of faces at a pole used");
                fromPole = this.nbFacesAtPole - 1;
            }
            return 12 + poleOrShared * this.nbFacesAtPole + fromPole;
        }

        public refreshFaceData() {
            this.nbSharedFaces = this.metadata.nbSharedFaces;
            this.nbUnsharedFaces = this.metadata.nbUnsharedFaces;
            this.nbFacesAtPole = this.metadata.nbFacesAtPole;
            this.adjacentFaces = this.metadata.adjacentFaces;
            this.nbFaces = this.metadata.nbFaces;
            this.faceCenters = this.metadata.faceCenters,
                this.faceXaxis = this.metadata.faceXaxis,
                this.faceYaxis = this.metadata.faceYaxis,
                this.faceZaxis = this.metadata.faceZaxis;
        }

        public changeFaceColors(colorRange: (number | Color4)[][]): number[] {
            for (let i = 0; i < colorRange.length; i++) {
                const min: number = <number>colorRange[i][0];
                const max: number = <number>colorRange[i][1];
                const col: Color4 = <Color4>colorRange[i][2];
                for (let f = min; f < max + 1; f++) {
                    this.faceColors[f] = col;
                }
            }
            const newCols: number[] = [];
            for (let f = 0; f < 12; f++) {
                for (let i = 0; i < 5; i++) {
                    newCols.push(this.faceColors[f].r, this.faceColors[f].g, this.faceColors[f].b, this.faceColors[f].a);
                }
            }
            for (let f = 12; f < this.faceColors.length; f++) {
                for (let i = 0; i < 6; i++) {
                    newCols.push(this.faceColors[f].r, this.faceColors[f].g, this.faceColors[f].b, this.faceColors[f].a);
                }
            }
            return newCols;
        }

        public setFaceColors(colorRange: (number | Color4)[][]) {
            const newCols = this.changeFaceColors(colorRange);
            this.setVerticesData(VertexBuffer.ColorKind, newCols);
        }

        public updateFaceColors(colorRange: (number | Color4)[][]) {
            const newCols = this.changeFaceColors(colorRange);
            this.updateVerticesData(VertexBuffer.ColorKind, newCols);
        }

        private changeFaceUVs(uvRange: (number | Vector2)[][]): FloatArray {
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

        public setFaceUVs(uvRange: (number | Vector2)[][]) {
            const newUVs: FloatArray = this.changeFaceUVs(uvRange);
            this.setVerticesData(VertexBuffer.UVKind, newUVs);
        }

        public updateFaceUVs(uvRange: (number | Vector2)[][]) {
            const newUVs = this.changeFaceUVs(uvRange);
            this.updateVerticesData(VertexBuffer.UVKind, newUVs);
        }

        public placeOnFaceAt(mesh: Mesh, face: number, position: Vector3) {
            const orientation = Vector3.RotationFromAxis(this.faceXaxis[face], this.faceYaxis[face], this.faceZaxis[face]);
            mesh.rotation = orientation;
            mesh.position = this.faceCenters[face].add(this.faceXaxis[face].scale(position.x)).add(this.faceYaxis[face].scale(position.y)).add(this.faceZaxis[face].scale(position.z));
        }
    };
}

/**
 * Function to use when extending the mesh class to a Goldberg class
 */
const GoldbergMesh = GoldbergCreate();
/**
 * Function to use when extending the mesh class to a Goldberg class
 */

export const ExtendMeshToGoldberg = (mesh: Mesh): Mesh => {
    const metadata = mesh.metadata;
    metadata.faceCenters = metadata.faceCenters.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    metadata.faceZaxis = metadata.faceZaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    metadata.faceXaxis = metadata.faceXaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
    metadata.faceYaxis = metadata.faceYaxis.map((el: Vector3) => new Vector3(el._x, el._y, el._z));
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
    goldberg.metadata = metadata;
    goldberg.refreshFaceData();
    goldberg.material = mesh.material;
    mesh.dispose();
    return goldberg;
};
