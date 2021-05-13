import { Logger } from "../Misc/logger";
import { Scene } from "../scene";
import { Vector3, TmpVectors } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { Mesh } from "../Meshes/mesh";
import { VertexData } from "../Meshes/mesh.vertexData";
import { Engine } from "../Engines/engine";
import { Nullable } from "../types";
import { Scalar } from '../Maths/math.scalar';
import { Epsilon, PHI, THIRDR3, IsoGridSize } from '../Maths/math.constants';
import { IsoVector, TmpIsoVectors } from '../Maths/math.isovector';


/**
 * Class representing data for one face OAB of an equilateral icosahedron
 * When O is the isovector (0, 0), A is isovector (m, n)
 * @hidden
 */
class Primary {
    //properties
    public _cartesian: Vector3[];
    public _vertices: IsoVector[];
    public _mapped = new Array();
    public _max: number[];
    public _min: number[];
    public _vecToIdx: {[key: string]: number};

    public _innerFacets: string[][];
    public _isoVecsABOB: IsoVector[][];
    public _isoVecsOBOA: IsoVector[][];
    public _isoVecsBAOA: IsoVector[][];
    public _vertexTypes: number[][];

    public _coau: number;
    public _cobu: number;
    public _coav: number;
    public _cobv: number;

    public _IDATA = { 
        "name": "icosahedron", 
        "category":["Regular"],
        "edgematch": [ [1, "B"], [2, "B"], [3, "B"], [4, "B"], [0, "B"], [10, "O", 14, "A"], [11, "O", 10, "A"], [12, "O", 11, "A"], [13, "O", 12, "A"], [14, "O", 13, "A"], [0, "O"], [1, "O"], [2, "O"], [3, "O"], [4, "O"], [19, "B", 5, "A"], [15, "B", 6, "A"], [16, "B", 7, "A"], [17, "B", 8, "A"], [18, "B", 9, "A"] ], 
        "vertex":[ [0, PHI, -1], [-PHI, 1, 0], [-1, 0, -PHI], [1, 0, -PHI], [PHI, 1, 0], [0, PHI, 1], [-1, 0, PHI], [-PHI, -1, 0], [0, -PHI, -1], [PHI, -1, 0], [1, 0, PHI], [0, -PHI, 1]],
        "face":[
            [ 0, 2, 1 ], [ 0, 3, 2 ], [ 0, 4, 3 ], [ 0, 5, 4 ], [ 0, 1, 5 ],
            [ 7, 6, 1 ],[ 8, 7, 2 ], [ 9, 8, 3 ], [ 10, 9, 4 ], [ 6, 10, 5 ],
            [ 2, 7, 1 ], [ 3, 8, 2 ],[ 4, 9, 3 ], [ 5, 10, 4 ], [ 1, 6, 5 ],
            [ 11, 6, 7 ], [ 11, 7, 8 ], [ 11, 8, 9 ], [ 11, 9, 10 ], [ 11, 10, 6 ]
    
        ]
    };

    /**
    * Creates the Primary Triangle OAB
    * @param m an integer
    * @param n an integer
    */
   constructor (
        /** defines the x distance m of A from O*/
        public _m: number,
        /** defines the y distance n of A from O*/
        public _n: number,
        ) {
            
        }
         
        //operators
        public setIndices() {
            let indexCount = 12; // 12 vertices already assigned
            const vecToIdx: {[key: string]: number} = {}; //maps iso-vectors to indexCount;
            const m = this._m;
            const n = this._n;
            let g = m; // hcf of m, n when n != 0
            let m1 = 1;
            let n1 = 0;
            if (n !== 0) {
                g = Scalar.HCF(m, n);
            };
            m1 = m / g;
            n1 = n / g;
        
            let fr: any; //face to the right of current face
            let rot: any; //rotation about which vertex for fr
            let O: number;
            let A: number;
            let B: number;
            const Ovec: IsoVector = IsoVector.Zero();
            const Avec = new IsoVector(m, n);
            const Bvec = new IsoVector(-n, m + n);
            let OAvec: IsoVector = IsoVector.Zero();
            let ABvec: IsoVector = IsoVector.Zero();
            let OBvec: IsoVector = IsoVector.Zero();
            let verts: number[] = [];
            let idx: string;
            let idxR: string;
        
        
            /***edges AB to OB***** rotation about B*/
            for (let f = 0; f < 20; f++) { //f current face
        
                verts = this._IDATA.face[f];
                O = verts[2];
                A = verts[1];
                B = verts[0];
        
                idx = f +"|"+ Ovec.x + "|" + Ovec.y;
                if (!(idx in vecToIdx)) {
                    vecToIdx[idx] = O;
                }
                
                idx = f +"|"+ Avec.x + "|" + Avec.y;
                if (!(idx in vecToIdx)) {
                    vecToIdx[idx] = A;
                }
                idx = f +"|"+ Bvec.x + "|" + Bvec.y;
                if (!(idx in vecToIdx)) {
                    vecToIdx[idx] = B;
                }
                fr = this._IDATA.edgematch[f][0];
                rot = this._IDATA.edgematch[f][1];
                if (rot === "B") {
                        for (let i = 1; i < g; i++) {
                            ABvec.x = m - i * (m1 + n1);
                            ABvec.y = n + i * m1;
                            OBvec.x = -i * n1;
                            OBvec.y = i * (m1 + n1);
                            idx = f +"|"+ ABvec.x + "|" + ABvec.y;
                            idxR = fr +"|"+ OBvec.x + "|" + OBvec.y;
                            matchIdx(idx, idxR);
                        }
                };
        
               if (rot === "O") {
                        for (let i = 1; i < g; i++) {
                            OBvec.x = -i * n1;
                            OBvec.y = i * (m1 + n1);
                            OAvec.x = i * m1;
                            OAvec.y = i * n1;
                            idx = f +"|"+ OBvec.x + "|" + OBvec.y;
                            idxR = fr +"|"+ OAvec.x + "|" + OAvec.y;
                            matchIdx(idx, idxR);
                        }
                };
        
                fr = this._IDATA.edgematch[f][2];
                rot = this._IDATA.edgematch[f][3];       
              if (rot && rot === "A") {
                        for (let i = 1; i < g; i++) {
                            OAvec.x = i * m1;
                            OAvec.y = i * n1;
                            ABvec.x = m - (g - i) * (m1 + n1);;  //reversed for BA
                            ABvec.y = n + (g - i) * m1; //reversed for BA
                            idx = f +"|"+ OAvec.x + "|" + OAvec.y;
                            idxR = fr +"|"+ ABvec.x + "|" + ABvec.y;
                            matchIdx(idx, idxR);
                        }
                };
        
                for (let i = 0; i < this._vertices.length; i++) {
                    idx = f + "|" + this._vertices[i].x + "|" + this._vertices[i].y;
                    if (!(idx in vecToIdx)) {
                        vecToIdx[idx] = indexCount++;
                    }
                } 
            };
        
            function matchIdx(idx: string, idxR: string) {
                if (!(idx in vecToIdx || idxR in vecToIdx )) {
                    vecToIdx[idx] = indexCount;
                    vecToIdx[idxR] = indexCount;
                    indexCount++;
                }
                else if ((idx in vecToIdx) && !(idxR in vecToIdx)) {
                    vecToIdx[idxR] = vecToIdx[idx];
                }
                else if ((idxR in vecToIdx) && !(idx in vecToIdx)) {
                    vecToIdx[idx] = vecToIdx[idxR];
                }
            };
            
            this._vecToIdx = vecToIdx;
        }

        public calcCoeffs() {
            const m = this._m;
            const n = this._n;
        
            const LSQD = m * m + n * n + m * n;
        
            this._coau = (m + n) / LSQD;
            this._cobu = -n / LSQD;
            this._coav = -THIRDR3 * (m - n) / LSQD;
            this._cobv = THIRDR3 * (2* m + n) / LSQD;
        }
        
        
        public innerFacets() {
            const m = this._m;
            const n = this._n;
            for (let y = 0; y < n + m + 1; y++) {
                for (let x = this._min[y]; x < this._max[y] + 1; x++) {
                    if (x < this._max[y] && x < this._max[y + 1] + 1) {
                        this._innerFacets.push(["|" + x + "|" + y, "|" + x + "|" + (y + 1), "|" + (x + 1) + "|" + y]);
                    }
                    if ( y > 0 && x < this._max[y - 1] && x + 1 < this._max[y] + 1) {
                        this._innerFacets.push(["|" + x + "|" + y, "|" + (x + 1) + "|" + y, "|" + (x + 1) + "|" + (y - 1)]);
                    }
                }    
            }
        }

        public edgeVecsABOB() {
            let m = this._m;
            let n = this._n;
        
            const B = new IsoVector(-n, m + n)
        
            for (let y = 1; y < m + n; y++) {
                const point = new IsoVector(this._min[y], y);
                const prev = new IsoVector(this._min[y - 1], y - 1);
                const next = new IsoVector(this._min[y + 1], y + 1);
                const pointR = point.clone();
                const prevR = prev.clone();
                const nextR = next.clone();
                
                pointR.rotate60About(B);
                prevR.rotate60About(B);
                nextR.rotate60About(B);
        
                const maxPoint = new IsoVector(this._max[pointR.y], pointR.y);
                const maxPrev = new IsoVector(this._max[pointR.y - 1], pointR.y - 1);
                const maxLeftPrev = new IsoVector( this._max[pointR.y - 1] - 1, pointR.y - 1);
        
                if ((pointR.x !== maxPoint.x) || (pointR.y !== maxPoint.y)) {
                    if (pointR.x !== maxPrev.x) { // type2
                        //up
                        this._vertexTypes.push([1, 0, 0]);
                        this._isoVecsABOB.push([point, maxPrev, maxLeftPrev]);
                        //down
                        this._vertexTypes.push([1, 0, 0]);
                        this._isoVecsABOB.push([point, maxLeftPrev, maxPoint]);
                    }
                    else if (pointR.y === nextR.y) { // type1
                        //up
                        this._vertexTypes.push([1, 1, 0]);
                        this._isoVecsABOB.push([point, prev, maxPrev]);
                        //down
                        this._vertexTypes.push([1, 0, 1]);
                        this._isoVecsABOB.push([point, maxPrev, next]);
                    }
                    else { // type 0
                        //up
                        this._vertexTypes.push([1, 1, 0]);
                        this._isoVecsABOB.push([point, prev, maxPrev])
                        //down
                        this._vertexTypes.push([1, 0, 0]);
                        this._isoVecsABOB.push([point, maxPrev, maxPoint]);
                    }
                };
            };
        };

        public mapABOBtoOBOA() {
            let point = new IsoVector(0, 0);
            for (let i = 0; i < this._isoVecsABOB.length; i++) {
                const temp = [];
                for (let j = 0; j < 3; j++) {
                    point.x = this._isoVecsABOB[i][j].x;
                    point.y = this._isoVecsABOB[i][j].y;
                    if (this._vertexTypes[i][j] === 0) {
                        point.rotateNeg120(this._m, this._n);
                    }
                    temp.push(point.clone());
                }
                this._isoVecsOBOA.push(temp);
            }
        };

        public mapABOBtoBAOA() {
            let point = new IsoVector(0, 0);
            for (let i = 0; i < this._isoVecsABOB.length; i++) {
                const temp = [];
                for (let j = 0; j < 3; j++) {
                    point.x = this._isoVecsABOB[i][j].x;
                    point.y = this._isoVecsABOB[i][j].y;
                    if (this._vertexTypes[i][j] === 1) {
                        point.rotate120(this._m, this._n);
                    }
                    temp.push(point.clone());
                }
                this._isoVecsBAOA.push(temp);
            }
            
        };


        //statics
        /**Creates a primary triangle
         * @param m 
         * @param n 
         * @hidden
         */

        public static Create(m: number, n: number) {
            const vertices = new Array<IsoVector>();
        
            const O:IsoVector = IsoVector.Zero();
            const A:IsoVector = new IsoVector(m, n);
            const B:IsoVector = new IsoVector(-n, m + n);
            vertices.push(O, A, B);
        
            //max internal isoceles triangle vertices
            for (let y = n; y < m + 1 ; y++) {
                for (let x = 0; x < m + 1 - y; x++ ) {
                    vertices.push(new IsoVector(x, y));
                }
            }
        
            //shared vertices along edges when needed
            if (n > 0) {
                const g = Scalar.HCF(m, n);
                const m1 = m / g;
                const n1 = n / g; 
        
                for (let i = 1; i < g; i++) {
                    vertices.push(new IsoVector(i * m1, i * n1)); //OA
                    vertices.push(new IsoVector(-i * n1, i * (m1 + n1)));  //OB
                    vertices.push(new IsoVector(m - i * (m1 + n1), n + i * m1)); // AB
                }; 
        
                //lower rows vertices and their rotations
                const ratio = m / n;
                for (let y = 1; y < n; y++) {
                    for (let x = 0; x < y * ratio; x++) {
                        vertices.push(new IsoVector(x, y));
                        vertices.push(new IsoVector(x, y).rotate120(m , n));
                        vertices.push(new IsoVector(x, y).rotateNeg120(m , n));
                    }
                }
            }
            //order vertices by y and then x
            vertices.sort((a, b) => {
                return a.x - b.x
            });
        
            vertices.sort((a, b) => {
                return a.y - b.y
            });
        
            let min = new Array<number>(m + n + 1);
            let max = new Array<number>(m + n + 1);
            min = min.map((element) => element = Infinity);
            max = max.map((element) => element = -Infinity);
        
            let y: number = 0;
            let x: number = 0;
        
            let len: number = vertices.length;   
            for (let i = 0; i < len; i++) {
                x = vertices[i].x;
                y = vertices[i].y
                min[y] = Math.min(x, min[y]);
                max[y] = Math.max(x, max[y]);
            };

            const cartesian = new Array<Vector3>();
            for (let i = 0; i < len; i++) {
                cartesian[i] = vertices[i].toCartesianOrigin(O)
            };
        
            const P = new Primary(m, n);
            P._vertices = vertices;
            P._cartesian = cartesian;
            P._min = min;
            P._max = max;
        
            return P;
        }
    };

    /** Builds the data for a Geodesic Polyhedron from a primary triangle 
    * @hidden
    */
    export class BuildGeoData {
        /**
        * @param pt primary triangle
        */
        public _primTri: Primary;

        public _name: string = "Geodesic-m-n";
        public _category: string[] = ["Geodesic"];
        public _vertex: number[][] = [ [0, PHI, -1], [-PHI, 1, 0], [-1, 0, -PHI], [1, 0, -PHI], [PHI, 1, 0], [0, PHI, 1], [-1, 0, PHI], [-PHI, -1, 0], [0, -PHI, -1], [PHI, -1, 0], [1, 0, PHI], [0, -PHI, 1]];
        public _face: number[] = [];

        constructor (
            /* defines the */
            public _m: number,
            public _n: number 
        ) {
            this._primTri = Primary.Create(this._m, this._n);
        }
        

        public MapToFace(faceNb: number, _primTri: Primary) {
            const F = this._primTri._IDATA.face[faceNb];
            const Oidx = F[2];
            const Aidx = F[1];
            const Bidx = F[0];
        
            const O = Vector3.FromArray(this._primTri._IDATA.vertex[Oidx]);
            const A = Vector3.FromArray(this._primTri._IDATA.vertex[Aidx]);
            const B = Vector3.FromArray(this._primTri._IDATA.vertex[Bidx]);
        
            const OA = A.subtract(O);
            const OB = B.subtract(O);
        
            let x: Vector3 = OA.scale(this._primTri._coau).add(OB.scale(this._primTri._cobu));
            let y: Vector3 = OA.scale(this._primTri._coav).add(OB.scale(this._primTri._cobv));
            
            const mapped = [];
        
            let idx: string; 
            let tempVec: Vector3 = TmpVectors.Vector3[0]
            for (var i = 0; i < this._primTri._cartesian.length; i++) {
                tempVec  = x.scale(this._primTri._cartesian[i].x).add(y.scale(this._primTri._cartesian[i].y)).add(O);
                mapped[i] = [tempVec.x, tempVec.y, tempVec.z];
                idx = faceNb + "|" + this._primTri._vertices[i].x + "|" + this._primTri._vertices[i].y;
                this._vertex[this._primTri._vecToIdx[idx]] = [tempVec.x, tempVec.y, tempVec.z];
            }
        
            this._primTri._mapped.push(mapped);
        };
        
    }

