import { Scene } from "../../scene";
import { Vector3, Vector4 } from "../../Maths/math.vector";
import { Color4 } from '../../Maths/math.color';
import { Mesh } from "../../Meshes/mesh";
import { VertexData } from "../mesh.vertexData";
import { Nullable } from '../../types';
import { Logger } from "../../Misc/logger";
import { Primary, GeoData, PolyhedronData} from "../geoMesh"
import { VertexBuffer } from "../../Buffers";

VertexData.CreateGoldbergSphere= function(options: { size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, faceUV?: Vector4[], faceColors?: Color4[], flat?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, goldbergData: PolyhedronData): VertexData {

    var size = options.size;
    var sizeX: number = options.sizeX || size || 1;
    var sizeY: number = options.sizeY || size || 1;
    var sizeZ: number = options.sizeZ || size || 1;
    //var data: { vertex: number[][], face: number[][], name?: string, category?: string };
    //var nbfaces = data.face.length;
    //var faceUV = options.faceUV || new Array(nbfaces);
    var faceColors = options.faceColors;
    var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || VertexData.DEFAULTSIDE;

    var positions = new Array<number>();
    var indices = new Array<number>();
    var normals = new Array<number>();
    var uvs = new Array<number>();
    var colors = new Array<number>();
    //var u: number, v: number, ang: number, x: number, y: number, tmp: number;

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
        }
        for (let v = 0; v < verts.length - 2; v++) {
            indices.push(index, index + v + 2, index + v + 1);
        }
        index += verts.length;
        if (faceColors) {
            colors.push(faceColors[f].r, faceColors[f].g, faceColors[f].b, faceColors[f].a);
        }
    }

    VertexData._ComputeSides(sideOrientation, positions, indices, normals, uvs, options.frontUVs, options.backUVs);

    var vertexData = new VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    if (faceColors) {
        vertexData.colors = colors;
    }
    return vertexData;
};

/**
 * Class add properties and methods to a Goldberg Sphere Mesh
 * @hidden
 */
export class GDMesh extends Mesh {

    constructor(
        name: string,
        scene: Nullable<Scene> = null,
        geoData: GeoData,
        goldbergData: PolyhedronData
    ) {
        super(name, scene);

        scene = this.getScene();

        this._nbSharedFaces = geoData._sharedNodes;
        this._nbUnsharedFaces = geoData._poleNodes;
        this._nbFaces = this._nbSharedFaces + this._nbUnsharedFaces;
        this._nbFacesAtPole = (this._nbUnsharedFaces - 12) / 12 - 1;
        for (let f = 0; f < geoData.vertex.length; f++) {
            this._faceCenters.push(Vector3.FromArray(geoData.vertex[f]));
        };
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

    private _faceColors: Color4[] = [];  
    private _faceCenters: Vector3[] = [];
    public _faceZaxis: Vector3[] = [];
    public _faceXaxis: Vector3[] = [];
    public _faceYaxis: Vector3[] = [];
    private _nbSharedFaces: number;
    private _nbUnsharedFaces: number;
    private _nbFaces: number;
    private _nbFacesAtPole: number;

    private _setMetadata = () => {
        this.metadata = {
            nbSharedFaces: this._nbSharedFaces,
            nbUnsharedFaces: this._nbUnsharedFaces,
            nbFacesAtPole: this._nbFacesAtPole,
            faceCenters: this._faceCenters,
            faceXaxis: this._faceXaxis,
            faceYaxis: this._faceYaxis,
            faceZaxis: this._faceZaxis
        }
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

    
    //after loading
    public refreshFaceData = () => {
        this._nbSharedFaces = this.metadata.nbSharedFaces;
        this._nbUnsharedFaces = this.metadata.nbUnsharedFaces;
        this._nbFacesAtPole = this.metadata.nbFacesAtPole;
        this._faceCenters = this.metadata.faceCenters,
        this._faceXaxis = this.metadata.faceXaxis,
        this._faceYaxis = this.metadata.faceYaxis,
        this._faceZaxis = this.metadata.faceZaxis
    }

    private _changeFaceColors = (colorRange : any[][]): number[] => {
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

    public setFaceColors = (colorRange : any[][]) => {
        const newCols = this._changeFaceColors(colorRange);
        this.setVerticesData(VertexBuffer.ColorKind, newCols);
    };

    public getFaceColors = () => {
        return this._faceColors;
    }

    public updateFaceColors = (colorRange : any[][]) => {
        const newCols = this._changeFaceColors(colorRange);
        this.updateVerticesData(VertexBuffer.ColorKind, newCols);
    }

    
};

Mesh.CreateGoldbergSphere = (name: string, options: { m?: number, n: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number }, scene: Scene): GDMesh => {
    return GoldbergBuilder.CreateGoldbergSphere(name, options, scene);
};

/**
 * Class containing static functions to help procedurally build meshes
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
    public static CreateGoldbergSphere(name: string, options: { m?: number, n?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number, frontUVs?: Vector4, backUVs?: Vector4 }, scene: Nullable<Scene> = null): GDMesh {
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
        const primTri: Primary = new Primary;
        primTri.build(m, n);
        const geoData = GeoData.BuildGeoData(primTri);
        const goldbergData = geoData._toGoldbergData();

        const goldberg = new GDMesh(name, scene, geoData, goldbergData);

        options.sideOrientation = Mesh._GetDefaultSideOrientation(options.sideOrientation);
        goldberg._originalBuilderSideOrientation = options.sideOrientation;
        
        

        const vertexData = VertexData.CreateGoldbergSphere(options, goldbergData)

        vertexData.applyToMesh(goldberg, options.updatable);

        return goldberg;        
    }
 }