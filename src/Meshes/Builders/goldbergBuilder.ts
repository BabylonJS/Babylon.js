import { Scene } from "../../scene";
import { Vector3, Vector2 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../mesh.vertexData";
import { Nullable, FloatArray } from '../../types';
import { Logger } from "../../Misc/logger";
import { _PrimaryIsoTriangle, GeodesicData, PolyhedronData} from "../geodesicMesh"
import { VertexBuffer } from "../../Buffers";

VertexData.CreateGoldberg = function(options: { size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, sideOrientation?: number }, goldbergData: PolyhedronData): VertexData {

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
            uvs.push((pdata[0] * sizeX - minX)/(maxX - minX), (pdata[1] * sizeY - minY)/(maxY - minY));
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
 * Class adding properties and methods to a Mesh to form a Goldberg Mesh
 * Not intended to be used for the direct creation of a Goldberg Mesh
 */
export class Goldberg extends Mesh {

    /**
     * @constructor
     * @param name The value used by scene.getMeshByName() to do a lookup.
     * @param scene The scene to add this mesh to.
     * @param source An optional Mesh from which geometry is shared, cloned.
     * @param geodesicData the data describing the vertices and faces of a geodesic polyhedron
     * @param goldbergData the data describing the vertices and faces of a goldberg polyhedron
     */
    constructor(
        name: string,
        scene: Nullable<Scene> = null,
        source: Nullable<Mesh> = null,
        geodesicData: Nullable<GeodesicData>,
        goldbergData: Nullable<PolyhedronData>
    ) {
        super(name, scene, source);

        scene = this.getScene();

        if (geodesicData) {
            this._nbSharedFaces = geodesicData.sharedNodes;
            this._nbUnsharedFaces = geodesicData.poleNodes;
            this._adjacentFaces = geodesicData.adjacentFaces;
            this._nbFaces = this._nbSharedFaces + this._nbUnsharedFaces;
            this._nbFacesAtPole = (this._nbUnsharedFaces - 12) / 12;
            for (let f = 0; f < geodesicData.vertex.length; f++) {
                this._faceCenters.push(Vector3.FromArray(geodesicData.vertex[f]));
                this._faceColors.push(new Color4(1, 1, 1, 1));
            };
        }
        if (goldbergData) {
            for (let f = 0; f < goldbergData.face.length; f++) {
                const verts = goldbergData.face[f];
                const a = Vector3.FromArray(goldbergData.vertex[verts[0]]);
                const b = Vector3.FromArray(goldbergData.vertex[verts[2]]);
                const c = Vector3.FromArray(goldbergData.vertex[verts[1]]);
                const ba = b.subtract(a);
                const ca = c.subtract(a);
                const norm = Vector3.Cross(ca, ba).normalize();
                const z = Vector3.Cross(ca, norm).normalize();
                this._faceXaxis.push(ca.normalize());
                this._faceYaxis.push(norm);
                this._faceZaxis.push(z);
        };
        this._setMetadata();
        }
    }

    private _faceColors: Color4[] = [];  
    private _faceCenters: Vector3[] = [];
    private _faceZaxis: Vector3[] = [];
    private _faceXaxis: Vector3[] = [];
    private _faceYaxis: Vector3[] = [];
    private _nbSharedFaces: number;
    private _nbUnsharedFaces: number;
    private _nbFaces: number;
    private _nbFacesAtPole: number;
    private _adjacentFaces: number[][];

    private _setMetadata() {
        this.metadata = {
            nbSharedFaces: this._nbSharedFaces,
            nbUnsharedFaces: this._nbUnsharedFaces,
            nbFacesAtPole: this._nbFacesAtPole,
            nbFaces: this._nbFaces,
            faceCenters: this._faceCenters,
            faceXaxis: this._faceXaxis,
            faceYaxis: this._faceYaxis,
            faceZaxis: this._faceZaxis,
            adjacentFaces: this._adjacentFaces
        }
    }

    public relFace(poleOrShared: number, fromPole?: number): number {
        if (fromPole === void 0) {
            if (poleOrShared > this._nbUnsharedFaces - 1) {
                Logger.Warn("Maximum number of unshared faces used");
                poleOrShared = this._nbUnsharedFaces - 1;
            }
            return this._nbUnsharedFaces + poleOrShared;
        }
        if (poleOrShared > 11) {
            Logger.Warn("Last pole used");
            poleOrShared = 11;
        }
        if (fromPole > this._nbFacesAtPole - 1) {
            Logger.Warn("Maximum number of faces at a pole used");
            fromPole = this._nbFacesAtPole - 1;
        }
        return 12 + poleOrShared * this.nbFacesAtPole + fromPole;
    }

    public get nbSharedFaces() {
        return this._nbSharedFaces;
    }

    public get nbUnsharedFaces() {
        return this._nbUnsharedFaces;
    }

    public get nbFaces() {
        return this._nbFaces;
    }

    public get nbFacesAtPole() {
        return this._nbFacesAtPole;
    }

    public get faceCenters() {
        return this._faceCenters;
    }

    public get faceXaxis() {
        return this._faceXaxis;
    }

    public get faceYaxis() {
        return this._faceYaxis;
    }

    public get faceZaxis() {
        return this._faceZaxis;
    }

    public get adjacentFaces() {
        return this._adjacentFaces;
    }
    
    //after loading
    public refreshFaceData() {
        this._nbSharedFaces = this.metadata.nbSharedFaces;
        this._nbUnsharedFaces = this.metadata.nbUnsharedFaces;
        this._nbFacesAtPole = this.metadata.nbFacesAtPole;
        this._adjacentFaces = this.metadata.adjacentFaces;
        this._nbFaces = this.metadata.nbFaces;
        this._faceCenters = this.metadata.faceCenters,
        this._faceXaxis = this.metadata.faceXaxis,
        this._faceYaxis = this.metadata.faceYaxis,
        this._faceZaxis = this.metadata.faceZaxis
    }

    private _changeFaceColors(colorRange : any[][]): number[] {
        for ( let i = 0; i < colorRange.length; i++) {
            const min: number = colorRange[i][0];
            const max: number = colorRange[i][1];
            const col: Color4 = colorRange[i][2];
            for ( let f = min; f < max + 1; f++ ) {
                this._faceColors[f] = col;
            }
        }
        const newCols: number[] = [];
        for (let f = 0; f < 12; f++) {
            for (let i = 0; i < 5; i++) {
                newCols.push(this._faceColors[f].r, this._faceColors[f].g, this._faceColors[f].b, this._faceColors[f].a)
            }
        }
        for (let f = 12; f < this._faceColors.length; f++) {
            for (let i = 0; i < 6; i++) {
                newCols.push(this._faceColors[f].r, this._faceColors[f].g, this._faceColors[f].b, this._faceColors[f].a)
            }
        }
        return newCols;
    }

    public setFaceColors(colorRange : any[][]) {
        const newCols = this._changeFaceColors(colorRange);
        this.setVerticesData(VertexBuffer.ColorKind, newCols);
    };

    public getFaceColors() {
        return this._faceColors;
    }

    public updateFaceColors(colorRange : any[][]) {
        const newCols = this._changeFaceColors(colorRange);
        this.updateVerticesData(VertexBuffer.ColorKind, newCols);
    }

    private _changeFaceUVs(uvRange : any[][]): FloatArray {
        const uvs: FloatArray = this.getVerticesData(VertexBuffer.UVKind)!!;
        for ( let i = 0; i < uvRange.length; i++) {
            const min: number = uvRange[i][0];
            const max: number = uvRange[i][1];
            const center: Vector2 = uvRange[i][2]
            const radius: number = uvRange[i][3];
            const angle: number = uvRange[i][4];
            const points5: number[] = [];
            const points6: number[] = [];
            let u:number;
            let v: number;
            for (let p = 0; p < 5; p++ ) {
                u = center.x + radius * Math.cos(angle + p * Math.PI / 2.5);
                v = center.y + radius * Math.sin(angle + p * Math.PI / 2.5);
                if ( u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points5.push(u, v);
            }
            for (let p = 0; p < 6; p++ ) {
                u = center.x + radius * Math.cos(angle + p * Math.PI / 3);
                v = center.y + radius * Math.sin(angle + p * Math.PI / 3);
                if ( u < 0) {
                    u = 0;
                }
                if (u > 1) {
                    u = 1;
                }
                points6.push(u, v);
            }
            for ( let f = min; f < Math.min(12, max + 1); f++ ) {
                for (let p = 0; p < 5; p++) {
                    uvs[10 * f + 2 * p] = points5[2 * p];
                    uvs[10 * f + 2 * p + 1] = points5[2 * p + 1];
                }
            }
            for ( let f = Math.max(12, min); f < max + 1; f++ ) {
                for (let p = 0; p < 6; p++) {
                    //120 + 12 * (f - 12) = 12 * f - 24
                    uvs[12 * f - 24 + 2 * p] = points6[2 * p];
                    uvs[12 * f - 23 + 2 * p] = points6[2 * p + 1];
                }
            }
        }

        return uvs;
    }

    public setFaceUVs(uvRange : any[][]) {
        const newUVs: FloatArray = this._changeFaceUVs(uvRange);
        this.setVerticesData(VertexBuffer.UVKind, newUVs);
    };

    public updateFaceUVs(uvRange : any[][]) {
        const newUVs = this._changeFaceUVs(uvRange);
        this.updateVerticesData(VertexBuffer.UVKind, newUVs);
    }

    public placeOnFaceAt(mesh: Mesh, face: number, position: Vector3) {
		const orientation = Vector3.RotationFromAxis(this._faceXaxis[face], this._faceYaxis[face], this._faceZaxis[face]);
		mesh.rotation = orientation;
		mesh.position = this._faceCenters[face].add(this._faceXaxis[face].scale(position.x)).add(this._faceYaxis[face].scale(position.y)).add(this._faceZaxis[face].scale(position.z));
	}
};

Mesh.CreateGoldberg = (name: string, options: { m?: number, n: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, updatable?: boolean, sideOrientation?: number }, scene: Scene): Goldberg => {
    return GoldbergBuilder.CreateGoldberg(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build a Goldberg mesh
 */
 export class GoldbergBuilder {
    /**
     * Creates the Mesh for a Geodesic Polyhedron
     * @param name defines the name of the mesh
     * @param options an object used to set the following optional parameters for the polyhedron, required but can be empty
     * * m number of horizontal steps along an isogrid
     * * n number of angled steps along an isogrid
     * * size the size of the Geodesic, optional default 1
     * * sizeX allows stretching in the x direction, optional, default size
     * * sizeY allows stretching in the y direction, optional, default size
     * * sizeZ allows stretching in the z direction, optional, default size
     * * faceUV an array of Vector4 elements used to set different images to the top, rings and bottom respectively
     * * faceColors an array of Color3 elements used to set different colors to the top, rings and bottom respectively
     * * subdivisions increasing the subdivisions increases the number of faces, optional, default 4
     * * sideOrientation optional and takes the values : Mesh.FRONTSIDE (default), Mesh.BACKSIDE or Mesh.DOUBLESIDE
     * * frontUvs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the front side, optional, default vector4 (0, 0, 1, 1)
     * * backUVs only usable when you create a double-sided mesh, used to choose what parts of the texture image to crop and apply on the back side, optional, default vector4 (0, 0, 1, 1)
     * @param scene defines the hosting scene 
     * @returns Geodesic mesh
     */
    public static CreateGoldberg(name: string, options: { m?: number, n?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, updatable?: boolean, sideOrientation?: number }, scene: Nullable<Scene> = null): Goldberg {
        let m: number = options.m || 1;
        if (m !== Math.floor(m)) {
            m === Math.floor(m);
            Logger.Warn("m not an integer only floor(m) used");
        };
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

        const goldberg = new Goldberg(name, scene, null, geodesicData, goldbergData);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        goldberg._originalBuilderSideOrientation = options.sideOrientation;
        
        

        const vertexData = VertexData.CreateGoldberg(options, goldbergData)

        vertexData.applyToMesh(goldberg, options.updatable);

        return goldberg;        
    }

    public static CreateGoldbergFromMesh(mesh: Mesh): Goldberg {
        const goldberg = new Goldberg(mesh.name, mesh.getScene(), mesh, null, null);
        goldberg.refreshFaceData();
        return goldberg;
    }
}

