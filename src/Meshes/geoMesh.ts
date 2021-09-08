import { Vector3, TmpVectors } from "../Maths/math.vector";
import { Scalar } from '../Maths/math.scalar';
import { PHI, THIRDR3 } from '../Maths/math.constants';
import { IsoVector } from '../Maths/math.isovector';



/**
 * Class representing data for one face OAB of an equilateral icosahedron
 * When O is the isovector (0, 0), A is isovector (m, n)
 * @hidden
 */
export class Primary {
    //properties
    public _m: number;
    public _n: number;
    public _cartesian: Vector3[] = [];
    public _vertices: IsoVector[] = [];
    public _max: number[] = [];
    public _min: number[] = [];
    public _vecToIdx: {[key: string]: number};
    public _vertByDist: {[key: string]: any};
    public _closestTo: number[][] = [];

    public _innerFacets: string[][] = [];
    public _isoVecsABOB: IsoVector[][] = [];
    public _isoVecsOBOA: IsoVector[][] = [];
    public _isoVecsBAOA: IsoVector[][] = [];
    public _vertexTypes: number[][] = [];

    public _coau: number;
    public _cobu: number;
    public _coav: number;
    public _cobv: number;

    public _IDATA: PolyhedronData = new PolyhedronData("icosahedron", 
        "Regular", 
        [ [0, PHI, -1], [-PHI, 1, 0], [-1, 0, -PHI], [1, 0, -PHI], [PHI, 1, 0], [0, PHI, 1], [-1, 0, PHI], [-PHI, -1, 0], [0, -PHI, -1], [PHI, -1, 0], [1, 0, PHI], [0, -PHI, 1]], 
        [
            [ 0, 2, 1 ], [ 0, 3, 2 ], [ 0, 4, 3 ], [ 0, 5, 4 ], [ 0, 1, 5 ],
            [ 7, 6, 1 ],[ 8, 7, 2 ], [ 9, 8, 3 ], [ 10, 9, 4 ], [ 6, 10, 5 ],
            [ 2, 7, 1 ], [ 3, 8, 2 ],[ 4, 9, 3 ], [ 5, 10, 4 ], [ 1, 6, 5 ],
            [ 11, 6, 7 ], [ 11, 7, 8 ], [ 11, 8, 9 ], [ 11, 9, 10 ], [ 11, 10, 6 ]
        ]
    )

    /**
    * Creates the Primary Triangle OAB
    * @param m an integer
    * @param n an integer
    */
     
    //operators
    public _setIndices() {
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
        let isoId: string;
        let isoIdR: string;

        const closestTo = [];
        const vDist = this._vertByDist;

        this._IDATA._edgematch = [ [1, "B"], [2, "B"], [3, "B"], [4, "B"], [0, "B"], [10, "O", 14, "A"], [11, "O", 10, "A"], [12, "O", 11, "A"], [13, "O", 12, "A"], [14, "O", 13, "A"], [0, "O"], [1, "O"], [2, "O"], [3, "O"], [4, "O"], [19, "B", 5, "A"], [15, "B", 6, "A"], [16, "B", 7, "A"], [17, "B", 8, "A"], [18, "B", 9, "A"] ];
    
    
        /***edges AB to OB***** rotation about B*/
        for (let f = 0; f < 20; f++) { //f current face
    
            verts = this._IDATA.face[f];
            O = verts[2];
            A = verts[1];
            B = verts[0];
    
            isoId = Ovec.x + "|" + Ovec.y
            idx = f +"|"+ isoId;
            if (!(idx in vecToIdx)) {
                vecToIdx[idx] = O;
                closestTo[O] = [verts[vDist[isoId][0]], vDist[isoId][1]];
            }
            
            isoId = Avec.x + "|" + Avec.y
            idx = f +"|"+ isoId;
            if (!(idx in vecToIdx)) {
                vecToIdx[idx] = A;
                closestTo[A] = [verts[vDist[isoId][0]], vDist[isoId][1]];
        
            }

            isoId = Bvec.x + "|" + Bvec.y
            idx = f +"|"+ isoId;
            if (!(idx in vecToIdx)) {
                vecToIdx[idx] = B;
                closestTo[B] = [verts[vDist[isoId][0]], vDist[isoId][1]];
            }
    
            //for edge vertices
            fr = this._IDATA._edgematch[f][0];
            rot = this._IDATA._edgematch[f][1];
            if (rot === "B") {
                    for (let i = 1; i < g; i++) {
                        ABvec.x = m - i * (m1 + n1);
                        ABvec.y = n + i * m1;
                        OBvec.x = -i * n1;
                        OBvec.y = i * (m1 + n1);
                        isoId = ABvec.x + "|" + ABvec.y;
                        isoIdR = OBvec.x + "|" + OBvec.y 
                        matchIdx(f, fr, isoId, isoIdR);
                    }
            };
    
            if (rot === "O") {
                    for (let i = 1; i < g; i++) {
                        OBvec.x = -i * n1;
                        OBvec.y = i * (m1 + n1);
                        OAvec.x = i * m1;
                        OAvec.y = i * n1;
                        isoId = OBvec.x + "|" + OBvec.y;
                        isoIdR = OAvec.x + "|" + OAvec.y;
                        matchIdx(f, fr, isoId, isoIdR);
                    }
            };
    
            fr = this._IDATA._edgematch[f][2];
            rot = this._IDATA._edgematch[f][3];       
            if (rot && rot === "A") {
                    for (let i = 1; i < g; i++) {
                        OAvec.x = i * m1;
                        OAvec.y = i * n1;
                        ABvec.x = m - (g - i) * (m1 + n1);;  //reversed for BA
                        ABvec.y = n + (g - i) * m1; //reversed for BA
                        isoId = OAvec.x + "|" + OAvec.y;
                        isoIdR = ABvec.x + "|" + ABvec.y;
                        matchIdx(f, fr, isoId, isoIdR);
                    }
            };
    
    
            for (let i = 0; i < this._vertices.length; i++) {
                isoId = this._vertices[i].x + "|" + this._vertices[i].y
                idx = f + "|" + isoId;
                if (!(idx in vecToIdx)) {
                    vecToIdx[idx] = indexCount++;
                    if (vDist[isoId][0] > 2) {
                        closestTo[vecToIdx[idx]] = [-vDist[isoId][0], vDist[isoId][1], vecToIdx[idx]];
                    } 
                    else {
                        closestTo[vecToIdx[idx]] = [verts[vDist[isoId][0]], vDist[isoId][1], idx];
                    }
                }
            } 
        };
    
        function matchIdx(f: number, fr: number, isoId: string, isoIdR: string) {
            idx = f +"|"+ isoId;
            idxR = fr +"|"+ isoIdR;
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
            if (vDist[isoId][0] > 2) {
                closestTo[vecToIdx[idx]] = [-vDist[isoId][0], vDist[isoId][1], vecToIdx[idx]];
            } 
            else {
                closestTo[vecToIdx[idx]] = [verts[vDist[isoId][0]], vDist[isoId][1], idx];
            }
        };
        this._closestTo = closestTo;
        this._vecToIdx = vecToIdx;
    }

    public _calcCoeffs() {
        const m = this._m;
        const n = this._n;
    
        const LSQD = m * m + n * n + m * n;
    
        this._coau = (m + n) / LSQD;
        this._cobu = -n / LSQD;
        this._coav = -THIRDR3 * (m - n) / LSQD;
        this._cobv = THIRDR3 * (2* m + n) / LSQD;
    }
    
    
    public _createInnerFacets() {
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

    public _edgeVecsABOB() {
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

    public _mapABOBtoOBOA() {
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

    public _mapABOBtoBAOA() {
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

    public _MapToFace(faceNb: number, geoData: PolyhedronData) {
        const F = this._IDATA.face[faceNb];
        const Oidx = F[2];
        const Aidx = F[1];
        const Bidx = F[0];
    
        const O = Vector3.FromArray(this._IDATA.vertex[Oidx]);
        const A = Vector3.FromArray(this._IDATA.vertex[Aidx]);
        const B = Vector3.FromArray(this._IDATA.vertex[Bidx]);
    
        const OA = A.subtract(O);
        const OB = B.subtract(O);
    
        let x: Vector3 = OA.scale(this._coau).add(OB.scale(this._cobu));
        let y: Vector3 = OA.scale(this._coav).add(OB.scale(this._cobv));
        
        const mapped = [];
    
        let idx: string; 
        let tempVec: Vector3 = TmpVectors.Vector3[0]
        for (var i = 0; i < this._cartesian.length; i++) {
            tempVec  = x.scale(this._cartesian[i].x).add(y.scale(this._cartesian[i].y)).add(O);
            mapped[i] = [tempVec.x, tempVec.y, tempVec.z];
            idx = faceNb + "|" + this._vertices[i].x + "|" + this._vertices[i].y;
            geoData.vertex[this._vecToIdx[idx]] = [tempVec.x, tempVec.y, tempVec.z];
        }
    };


    //statics
    /**Creates a primary triangle
     * @param m 
     * @param n 
     * @hidden
     */

    public build(m: number, n: number) {
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
        //order vertices by x and then y
        vertices.sort((a, b) => {
            return a.x - b.x
        });
    
        vertices.sort((a, b) => {
            return a.y - b.y
        });
    
        let min = new Array<number>(m + n + 1);
        let max = new Array<number>(m + n + 1);
        for (let i = 0; i < min.length; i++) {
            min[i] = Infinity;
            max[i] = -Infinity;
        }
    
        let y: number = 0;
        let x: number = 0;
    
        let len: number = vertices.length;   
        for (let i = 0; i < len; i++) {
            x = vertices[i].x;
            y = vertices[i].y
            min[y] = Math.min(x, min[y]);
            max[y] = Math.max(x, max[y]);
        };

        //calculates the distance of a vertex from a given primary vertex
        const  distFrom = (vert: IsoVector, primVert: string) => {
            const v = vert.clone();
            if (primVert === "A") {
                v.rotateNeg120(m, n);
            };
            if (primVert === "B") {
                v.rotate120(m, n);
            };
            if (v.x < 0) {
                return v.y;
            }
            return v.x + v.y;
        }

        const cartesian = new Array<Vector3>();
        const distFromO = new Array<number>();
        const distFromA = new Array<number>();
        const distFromB = new Array<number>();
        const vertByDist: {[key: string]: any} = {};
        const vertData = new Array<any>();
        let closest: number = -1;
        let dist: number = -1;
        for (let i = 0; i < len; i++) {
            cartesian[i] = vertices[i].toCartesianOrigin(new IsoVector(0, 0))
            distFromO[i] = distFrom(vertices[i], "O");
            distFromA[i] = distFrom(vertices[i], "A");
            distFromB[i] = distFrom(vertices[i], "B");
            
            if ((distFromO[i] === distFromA[i]) && (distFromA[i] === distFromB[i])) {
                closest = 3;
                dist = distFromO[i];
            }
            else if (distFromO[i] === distFromA[i]) {
                closest = 4;
                dist = distFromO[i];
            }
            else if (distFromA[i] === distFromB[i]) {
                closest = 5;
                dist = distFromA[i];
            }
            else if (distFromB[i] === distFromO[i]) {
                closest = 6;
                dist = distFromO[i];
            }
            if (distFromO[i] < distFromA[i] && distFromO[i] < distFromB[i]) {
                closest = 2;
                dist = distFromO[i];
            }
            if (distFromA[i] < distFromO[i] && distFromA[i] < distFromB[i]) {
                closest = 1;
                dist = distFromA[i];
            }
            if (distFromB[i] < distFromA[i] && distFromB[i] < distFromO[i]) {
                closest = 0;
                dist = distFromB[i];
            }
            vertData.push([closest, dist, vertices[i].x, vertices[i].y]);
        };
    
        vertData.sort((a, b) => {
            return a[2] - b[2];
        })
        vertData.sort((a, b) => {
            return a[3] - b[3];
        })
        vertData.sort((a, b) => {
            return a[1] - b[1];
        })
        vertData.sort((a, b) => {
            return a[0] - b[0];
        })
        
        for (let v = 0; v < vertData.length; v++) {
            vertByDist[vertData[v][2] + "|" + vertData[v][3]] = [vertData[v][0], vertData[v][1], v];
        }

        this._m = m;
        this._n = n;
        this._vertices = vertices;
        this._vertByDist = vertByDist;
        this._cartesian = cartesian;
        this._min = min;
        this._max = max;
    
        return this;
    }
};

/** Builds Polyhedron Data
* @hidden
*/

export class PolyhedronData {

    public _edgematch: any[][];

    constructor (
        public name: string,
        public category  : string,
        public vertex: number[][],
        public face: number[][]
    ) {

    }
}

export class GeoData extends PolyhedronData{

    public _edgematch: any[][];
    public _adjacentFaces: number[][];
    
    public _sharedNodes: number;
    public _poleNodes: number;

    public _innerToData(face : number, primTri: Primary) {
        for (let i = 0; i < primTri._innerFacets.length; i++) {
            this.face.push(primTri._innerFacets[i].map((el) => primTri._vecToIdx[face + el]));
        }
    };

    public _mapABOBtoDATA(faceNb: number, primTri: Primary) {
        const fr = primTri._IDATA._edgematch[faceNb][0];
        for (let i = 0; i < primTri._isoVecsABOB.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri._vertexTypes[i][j] === 0) {
                    temp.push(faceNb + "|" + primTri._isoVecsABOB[i][j].x + "|" + primTri._isoVecsABOB[i][j].y);
                }
                else {
                    temp.push(fr + "|" + primTri._isoVecsABOB[i][j].x + "|" + primTri._isoVecsABOB[i][j].y);
                }
            }
            this.face.push([primTri._vecToIdx[temp[0]], primTri._vecToIdx[temp[1]], primTri._vecToIdx[temp[2]]]);
        }
    };

    public _mapOBOAtoDATA(faceNb: number, primTri: Primary) {
        const fr = primTri._IDATA._edgematch[faceNb][0];
        for (let i = 0; i < primTri._isoVecsOBOA.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri._vertexTypes[i][j] === 1) {
                    temp.push(faceNb + "|" + primTri._isoVecsOBOA[i][j].x + "|" + primTri._isoVecsOBOA[i][j].y);
                }
                else {
                    temp.push(fr + "|" + primTri._isoVecsOBOA[i][j].x + "|" + primTri._isoVecsOBOA[i][j].y);
                }
            }
            this.face.push([primTri._vecToIdx[temp[0]], primTri._vecToIdx[temp[1]], primTri._vecToIdx[temp[2]]]);
        }
    };

    public _mapBAOAtoDATA(faceNb: number, primTri: Primary) {
        const fr = primTri._IDATA._edgematch[faceNb][2];
        for (let i = 0; i < primTri._isoVecsBAOA.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri._vertexTypes[i][j] === 1) {
                    temp.push(faceNb + "|" + primTri._isoVecsBAOA[i][j].x + "|" + primTri._isoVecsBAOA[i][j].y);
                }
                else {
                    temp.push(fr + "|" + primTri._isoVecsBAOA[i][j].x + "|" + primTri._isoVecsBAOA[i][j].y);
                }
            }
            this.face.push([primTri._vecToIdx[temp[0]], primTri._vecToIdx[temp[1]], primTri._vecToIdx[temp[2]]]);
        }
    };

    public _orderData(primTri: Primary) {
        const nearTo: any = [];
        for (let i = 0; i < 13; i++) {
            nearTo[i] = [];
        }
        const close = primTri._closestTo;
        for (let i = 0; i < close.length; i++) {
           if (close[i][0] > -1) {
               if(close[i][1] > 0) {
                   nearTo[close[i][0]].push([i, close[i][1]]);
               }
           }
           else {
               nearTo[12].push([i, close[i][0]])
           }
        }
        
        const near = [];
        for (let i = 0; i < 12; i++) {
            near[i] = i;
        }
        let nearIndex = 12;
        for (let i = 0; i < 12; i++) {
            nearTo[i].sort((a: number[],b: number[]) => {
                return a[1] - b[1];
            });
            for (let j = 0; j < nearTo[i].length; j++) {
                near[nearTo[i][j][0]] = nearIndex++;
            }
            
        };
   
        for (let j = 0; j < nearTo[12].length; j++) {
           near[nearTo[12][j][0]] = nearIndex++;
        }
   
        for (let i = 0; i < this.vertex.length; i++) {
            this.vertex[i].push(near[i]);
        }
       
        this.vertex.sort((a, b) => {
            return a[3] - b[3];
        });
       
   
        for (let i = 0; i < this.vertex.length; i++) {
            this.vertex[i].pop();
        }
   
        for (let i = 0; i < this.face.length; i++) {
            for (let j = 0; j < this.face[i].length; j++) {
                this.face[i][j] = near[this.face[i][j]];
            }
        }

        this._sharedNodes = nearTo[12].length
        this._poleNodes = this.vertex.length - this._sharedNodes;

    }

    //Puts vertices of a face for GP in correct order for mesh construction
    public _setOrder(m: number, faces: number[]) {
        const adjVerts: number[] = []
        const dualFaces: number[] = [];
        let face: any = faces.pop();
        dualFaces.push(face);
        let index = this.face[face].indexOf(m);
        index = (index + 2) % 3; //index to vertex included in adjacent face
        let v = this.face[face][index];
        let f = 0;
        this._adjacentFaces = [];
        while (faces.length > 0) {
            face = faces[f]
            if (this.face[face].indexOf(v) > -1) { // v is a vertex of face f
                index = (this.face[face].indexOf(v) + 1) % 3;
                v = this.face[face][index];
                adjVerts.push(v);
                dualFaces.push(face);
                faces.splice(f, 1);
                f = 0;
            }
            else {
                f++
            }
        }
        this._adjacentFaces.push(adjVerts);
        return dualFaces; 
    }

    public _toGoldbergData(): PolyhedronData {
        const goldbergData: PolyhedronData = new PolyhedronData("GeoDual", "Goldberg", [], []);
        goldbergData.name = "GD dual";
        const verticesNb: number = this.vertex.length;
        const map = new Array(verticesNb);
        for (let v = 0; v < verticesNb; v++) {
            map[v] = [];
        }
        for (let f = 0; f < this.face.length; f++) {
            for (let i = 0; i < 3; i++) {
                map[this.face[f][i]].push(f);
            }
        }
        let cx = 0;
        let cy = 0;
        let cz = 0;
        let face = [];
        let vertex = [];
        for(let m = 0; m < map.length; m++) {
            goldbergData.face[m] = this._setOrder(m, map[m].concat([]));
            map[m].forEach((el: number) => {
                cx = 0;
                cy = 0;
                cz = 0;
                face = this.face[el];
                for(let i = 0; i < 3; i++) {
                    vertex = this.vertex[face[i]];
                    cx += vertex[0];
                    cy += vertex[1];
                    cz += vertex[2];
                }
                goldbergData.vertex[el] = [cx / 3, cy / 3, cz / 3];  
            });
        }
        return goldbergData;
    }



    //statics
    /**Builds the data for a Geodesic Polyhedron from a primary triangle 
     * @param primTri the primary triangle 
     * @hidden
     */

    public static BuildGeoData(primTri: Primary) {
        
        const geoDATA = new GeoData("Geodesic-m-n", "Geodesic", [ [0, PHI, -1], [-PHI, 1, 0], [-1, 0, -PHI], [1, 0, -PHI], [PHI, 1, 0], [0, PHI, 1], [-1, 0, PHI], [-PHI, -1, 0], [0, -PHI, -1], [PHI, -1, 0], [1, 0, PHI], [0, -PHI, 1]], [])

        primTri._setIndices();
        primTri._calcCoeffs();
        primTri._createInnerFacets();
        primTri._edgeVecsABOB();
        primTri._mapABOBtoOBOA();
        primTri._mapABOBtoBAOA();

        for (let f = 0; f < primTri._IDATA.face.length; f++) {
            primTri._MapToFace(f, geoDATA);
            geoDATA._innerToData(f, primTri);
            if(primTri._IDATA._edgematch[f][1] === "B") {
                geoDATA._mapABOBtoDATA(f, primTri);
            };
            if(primTri._IDATA._edgematch[f][1] === "O") {
                geoDATA._mapOBOAtoDATA(f, primTri);
            };
            if(primTri._IDATA._edgematch[f][3] === "A") {
                geoDATA._mapBAOAtoDATA(f, primTri);
            };
        };

        geoDATA._orderData(primTri);
        const radius = 1;
        geoDATA.vertex = geoDATA.vertex.map(function (el) {
            var a = el[0];
            var b = el[1];
            var c = el[2];
            var d = Math.sqrt(a * a + b * b + c * c);
            el[0] *= radius / d;
            el[1] *= radius / d;
            el[2] *= radius / d;
            return el;
        });

        return geoDATA;
    }

}


