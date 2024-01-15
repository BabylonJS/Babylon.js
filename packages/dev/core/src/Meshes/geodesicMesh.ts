import { Vector3, TmpVectors } from "../Maths/math.vector";
import { Scalar } from "../Maths/math.scalar";
import { PHI } from "../Maths/math.constants";
import { _IsoVector } from "../Maths/math.isovector";

/**
 * Class representing data for one face OAB of an equilateral icosahedron
 * When O is the isovector (0, 0), A is isovector (m, n)
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _PrimaryIsoTriangle {
    //properties
    public m: number;
    public n: number;
    public cartesian: Vector3[] = [];
    public vertices: _IsoVector[] = [];
    public max: number[] = [];
    public min: number[] = [];
    public vecToidx: { [key: string]: number };
    public vertByDist: { [key: string]: number[] };
    public closestTo: number[][] = [];

    public innerFacets: string[][] = [];
    public isoVecsABOB: _IsoVector[][] = [];
    public isoVecsOBOA: _IsoVector[][] = [];
    public isoVecsBAOA: _IsoVector[][] = [];
    public vertexTypes: number[][] = [];

    public coau: number;
    public cobu: number;
    public coav: number;
    public cobv: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public IDATA: PolyhedronData = new PolyhedronData(
        "icosahedron",
        "Regular",
        [
            [0, PHI, -1],
            [-PHI, 1, 0],
            [-1, 0, -PHI],
            [1, 0, -PHI],
            [PHI, 1, 0],
            [0, PHI, 1],
            [-1, 0, PHI],
            [-PHI, -1, 0],
            [0, -PHI, -1],
            [PHI, -1, 0],
            [1, 0, PHI],
            [0, -PHI, 1],
        ],
        [
            [0, 2, 1],
            [0, 3, 2],
            [0, 4, 3],
            [0, 5, 4],
            [0, 1, 5],
            [7, 6, 1],
            [8, 7, 2],
            [9, 8, 3],
            [10, 9, 4],
            [6, 10, 5],
            [2, 7, 1],
            [3, 8, 2],
            [4, 9, 3],
            [5, 10, 4],
            [1, 6, 5],
            [11, 6, 7],
            [11, 7, 8],
            [11, 8, 9],
            [11, 9, 10],
            [11, 10, 6],
        ]
    );

    /**
     * Creates the PrimaryIsoTriangle Triangle OAB
     * @param m an integer
     * @param n an integer
     */

    //operators
    public setIndices() {
        let indexCount = 12; // 12 vertices already assigned
        const vecToidx: { [key: string]: number } = {}; //maps iso-vectors to indexCount;
        const m = this.m;
        const n = this.n;
        let g = m; // hcf of m, n when n != 0
        let m1 = 1;
        let n1 = 0;
        if (n !== 0) {
            g = Scalar.HCF(m, n);
        }
        m1 = m / g;
        n1 = n / g;

        let fr: number | string; //face to the right of current face
        let rot: number | string; //rotation about which vertex for fr
        let O: number;
        let A: number;
        let B: number;
        const oVec: _IsoVector = _IsoVector.Zero();
        const aVec = new _IsoVector(m, n);
        const bVec = new _IsoVector(-n, m + n);
        const oaVec: _IsoVector = _IsoVector.Zero();
        const abVec: _IsoVector = _IsoVector.Zero();
        const obVec: _IsoVector = _IsoVector.Zero();
        let verts: number[] = [];
        let idx: string;
        let idxR: string;
        let isoId: string;
        let isoIdR: string;

        const closestTo: number[][] = [];
        const vDist = this.vertByDist;

        const matchIdx = (f: number, fr: number, isoId: string, isoIdR: string) => {
            idx = f + "|" + isoId;
            idxR = fr + "|" + isoIdR;
            if (!(idx in vecToidx || idxR in vecToidx)) {
                vecToidx[idx] = indexCount;
                vecToidx[idxR] = indexCount;
                indexCount++;
            } else if (idx in vecToidx && !(idxR in vecToidx)) {
                vecToidx[idxR] = vecToidx[idx];
            } else if (idxR in vecToidx && !(idx in vecToidx)) {
                vecToidx[idx] = vecToidx[idxR];
            }
            if (vDist[isoId][0] > 2) {
                closestTo[vecToidx[idx]] = [-vDist[isoId][0], vDist[isoId][1], vecToidx[idx]];
            } else {
                closestTo[vecToidx[idx]] = [verts[vDist[isoId][0]], vDist[isoId][1], vecToidx[idx]];
            }
        };

        this.IDATA.edgematch = [
            [1, "B"],
            [2, "B"],
            [3, "B"],
            [4, "B"],
            [0, "B"],
            [10, "O", 14, "A"],
            [11, "O", 10, "A"],
            [12, "O", 11, "A"],
            [13, "O", 12, "A"],
            [14, "O", 13, "A"],
            [0, "O"],
            [1, "O"],
            [2, "O"],
            [3, "O"],
            [4, "O"],
            [19, "B", 5, "A"],
            [15, "B", 6, "A"],
            [16, "B", 7, "A"],
            [17, "B", 8, "A"],
            [18, "B", 9, "A"],
        ];

        /***edges AB to OB***** rotation about B*/
        for (let f = 0; f < 20; f++) {
            //f current face

            verts = this.IDATA.face[f];
            O = verts[2];
            A = verts[1];
            B = verts[0];

            isoId = oVec.x + "|" + oVec.y;
            idx = f + "|" + isoId;
            if (!(idx in vecToidx)) {
                vecToidx[idx] = O;
                closestTo[O] = [verts[vDist[isoId][0]], vDist[isoId][1]];
            }

            isoId = aVec.x + "|" + aVec.y;
            idx = f + "|" + isoId;
            if (!(idx in vecToidx)) {
                vecToidx[idx] = A;
                closestTo[A] = [verts[vDist[isoId][0]], vDist[isoId][1]];
            }

            isoId = bVec.x + "|" + bVec.y;
            idx = f + "|" + isoId;
            if (!(idx in vecToidx)) {
                vecToidx[idx] = B;
                closestTo[B] = [verts[vDist[isoId][0]], vDist[isoId][1]];
            }

            //for edge vertices
            fr = <number>this.IDATA.edgematch[f][0];
            rot = <string>this.IDATA.edgematch[f][1];
            if (rot === "B") {
                for (let i = 1; i < g; i++) {
                    abVec.x = m - i * (m1 + n1);
                    abVec.y = n + i * m1;
                    obVec.x = -i * n1;
                    obVec.y = i * (m1 + n1);
                    isoId = abVec.x + "|" + abVec.y;
                    isoIdR = obVec.x + "|" + obVec.y;
                    matchIdx(f, fr, isoId, isoIdR);
                }
            }

            if (rot === "O") {
                for (let i = 1; i < g; i++) {
                    obVec.x = -i * n1;
                    obVec.y = i * (m1 + n1);
                    oaVec.x = i * m1;
                    oaVec.y = i * n1;
                    isoId = obVec.x + "|" + obVec.y;
                    isoIdR = oaVec.x + "|" + oaVec.y;
                    matchIdx(f, fr, isoId, isoIdR);
                }
            }

            fr = <number>this.IDATA.edgematch[f][2];
            rot = <string>this.IDATA.edgematch[f][3];
            if (rot && rot === "A") {
                for (let i = 1; i < g; i++) {
                    oaVec.x = i * m1;
                    oaVec.y = i * n1;
                    abVec.x = m - (g - i) * (m1 + n1); //reversed for BA
                    abVec.y = n + (g - i) * m1; //reversed for BA
                    isoId = oaVec.x + "|" + oaVec.y;
                    isoIdR = abVec.x + "|" + abVec.y;
                    matchIdx(f, fr, isoId, isoIdR);
                }
            }

            for (let i = 0; i < this.vertices.length; i++) {
                isoId = this.vertices[i].x + "|" + this.vertices[i].y;
                idx = f + "|" + isoId;
                if (!(idx in vecToidx)) {
                    vecToidx[idx] = indexCount++;
                    if (vDist[isoId][0] > 2) {
                        closestTo[vecToidx[idx]] = [-vDist[isoId][0], vDist[isoId][1], vecToidx[idx]];
                    } else {
                        closestTo[vecToidx[idx]] = [verts[vDist[isoId][0]], vDist[isoId][1], vecToidx[idx]];
                    }
                }
            }
        }

        this.closestTo = closestTo;
        this.vecToidx = vecToidx;
    }

    public calcCoeffs() {
        const m = this.m;
        const n = this.n;
        const thirdR3 = Math.sqrt(3) / 3;

        const LSQD = m * m + n * n + m * n;

        this.coau = (m + n) / LSQD;
        this.cobu = -n / LSQD;
        this.coav = (-thirdR3 * (m - n)) / LSQD;
        this.cobv = (thirdR3 * (2 * m + n)) / LSQD;
    }

    public createInnerFacets() {
        const m = this.m;
        const n = this.n;
        for (let y = 0; y < n + m + 1; y++) {
            for (let x = this.min[y]; x < this.max[y] + 1; x++) {
                if (x < this.max[y] && x < this.max[y + 1] + 1) {
                    this.innerFacets.push(["|" + x + "|" + y, "|" + x + "|" + (y + 1), "|" + (x + 1) + "|" + y]);
                }
                if (y > 0 && x < this.max[y - 1] && x + 1 < this.max[y] + 1) {
                    this.innerFacets.push(["|" + x + "|" + y, "|" + (x + 1) + "|" + y, "|" + (x + 1) + "|" + (y - 1)]);
                }
            }
        }
    }

    public edgeVecsABOB() {
        const m = this.m;
        const n = this.n;

        const B = new _IsoVector(-n, m + n);

        for (let y = 1; y < m + n; y++) {
            const point = new _IsoVector(this.min[y], y);
            const prev = new _IsoVector(this.min[y - 1], y - 1);
            const next = new _IsoVector(this.min[y + 1], y + 1);
            const pointR = point.clone();
            const prevR = prev.clone();
            const nextR = next.clone();

            pointR.rotate60About(B);
            prevR.rotate60About(B);
            nextR.rotate60About(B);

            const maxPoint = new _IsoVector(this.max[pointR.y], pointR.y);
            const maxPrev = new _IsoVector(this.max[pointR.y - 1], pointR.y - 1);
            const maxLeftPrev = new _IsoVector(this.max[pointR.y - 1] - 1, pointR.y - 1);

            if (pointR.x !== maxPoint.x || pointR.y !== maxPoint.y) {
                if (pointR.x !== maxPrev.x) {
                    // type2
                    //up
                    this.vertexTypes.push([1, 0, 0]);
                    this.isoVecsABOB.push([point, maxPrev, maxLeftPrev]);
                    //down
                    this.vertexTypes.push([1, 0, 0]);
                    this.isoVecsABOB.push([point, maxLeftPrev, maxPoint]);
                } else if (pointR.y === nextR.y) {
                    // type1
                    //up
                    this.vertexTypes.push([1, 1, 0]);
                    this.isoVecsABOB.push([point, prev, maxPrev]);
                    //down
                    this.vertexTypes.push([1, 0, 1]);
                    this.isoVecsABOB.push([point, maxPrev, next]);
                } else {
                    // type 0
                    //up
                    this.vertexTypes.push([1, 1, 0]);
                    this.isoVecsABOB.push([point, prev, maxPrev]);
                    //down
                    this.vertexTypes.push([1, 0, 0]);
                    this.isoVecsABOB.push([point, maxPrev, maxPoint]);
                }
            }
        }
    }

    public mapABOBtoOBOA() {
        const point = new _IsoVector(0, 0);
        for (let i = 0; i < this.isoVecsABOB.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                point.x = this.isoVecsABOB[i][j].x;
                point.y = this.isoVecsABOB[i][j].y;
                if (this.vertexTypes[i][j] === 0) {
                    point.rotateNeg120(this.m, this.n);
                }
                temp.push(point.clone());
            }
            this.isoVecsOBOA.push(temp);
        }
    }

    public mapABOBtoBAOA() {
        const point = new _IsoVector(0, 0);
        for (let i = 0; i < this.isoVecsABOB.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                point.x = this.isoVecsABOB[i][j].x;
                point.y = this.isoVecsABOB[i][j].y;
                if (this.vertexTypes[i][j] === 1) {
                    point.rotate120(this.m, this.n);
                }
                temp.push(point.clone());
            }
            this.isoVecsBAOA.push(temp);
        }
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public MapToFace(faceNb: number, geodesicData: PolyhedronData) {
        const F = this.IDATA.face[faceNb];
        const oidx = F[2];
        const aidx = F[1];
        const bidx = F[0];

        const O = Vector3.FromArray(this.IDATA.vertex[oidx]);
        const A = Vector3.FromArray(this.IDATA.vertex[aidx]);
        const B = Vector3.FromArray(this.IDATA.vertex[bidx]);

        const OA = A.subtract(O);
        const OB = B.subtract(O);

        const x: Vector3 = OA.scale(this.coau).add(OB.scale(this.cobu));
        const y: Vector3 = OA.scale(this.coav).add(OB.scale(this.cobv));

        const mapped = [];

        let idx: string;
        let tempVec: Vector3 = TmpVectors.Vector3[0];
        for (let i = 0; i < this.cartesian.length; i++) {
            tempVec = x.scale(this.cartesian[i].x).add(y.scale(this.cartesian[i].y)).add(O);
            mapped[i] = [tempVec.x, tempVec.y, tempVec.z];
            idx = faceNb + "|" + this.vertices[i].x + "|" + this.vertices[i].y;
            geodesicData.vertex[this.vecToidx[idx]] = [tempVec.x, tempVec.y, tempVec.z];
        }
    }

    //statics
    /**Creates a primary triangle
     * @internal
     */

    public build(m: number, n: number) {
        const vertices: _IsoVector[] = [];

        const O: _IsoVector = _IsoVector.Zero();
        const A: _IsoVector = new _IsoVector(m, n);
        const B: _IsoVector = new _IsoVector(-n, m + n);
        vertices.push(O, A, B);

        //max internal isoceles triangle vertices
        for (let y = n; y < m + 1; y++) {
            for (let x = 0; x < m + 1 - y; x++) {
                vertices.push(new _IsoVector(x, y));
            }
        }

        //shared vertices along edges when needed
        if (n > 0) {
            const g = Scalar.HCF(m, n);
            const m1 = m / g;
            const n1 = n / g;

            for (let i = 1; i < g; i++) {
                vertices.push(new _IsoVector(i * m1, i * n1)); //OA
                vertices.push(new _IsoVector(-i * n1, i * (m1 + n1))); //OB
                vertices.push(new _IsoVector(m - i * (m1 + n1), n + i * m1)); // AB
            }

            //lower rows vertices and their rotations
            const ratio = m / n;
            for (let y = 1; y < n; y++) {
                for (let x = 0; x < y * ratio; x++) {
                    vertices.push(new _IsoVector(x, y));
                    vertices.push(new _IsoVector(x, y).rotate120(m, n));
                    vertices.push(new _IsoVector(x, y).rotateNeg120(m, n));
                }
            }
        }
        //order vertices by x and then y
        vertices.sort((a, b) => {
            return a.x - b.x;
        });

        vertices.sort((a, b) => {
            return a.y - b.y;
        });

        const min = new Array<number>(m + n + 1);
        const max = new Array<number>(m + n + 1);
        for (let i = 0; i < min.length; i++) {
            min[i] = Infinity;
            max[i] = -Infinity;
        }

        let y: number = 0;
        let x: number = 0;

        const len: number = vertices.length;
        for (let i = 0; i < len; i++) {
            x = vertices[i].x;
            y = vertices[i].y;
            min[y] = Math.min(x, min[y]);
            max[y] = Math.max(x, max[y]);
        }

        //calculates the distance of a vertex from a given primary vertex
        const distFrom = (vert: _IsoVector, primVert: string) => {
            const v = vert.clone();
            if (primVert === "A") {
                v.rotateNeg120(m, n);
            }
            if (primVert === "B") {
                v.rotate120(m, n);
            }
            if (v.x < 0) {
                return v.y;
            }
            return v.x + v.y;
        };

        const cartesian: Vector3[] = [];
        const distFromO: number[] = [];
        const distFromA: number[] = [];
        const distFromB: number[] = [];
        const vertByDist: { [key: string]: number[] } = {};
        const vertData: number[][] = [];
        let closest: number = -1;
        let dist: number = -1;
        for (let i = 0; i < len; i++) {
            cartesian[i] = vertices[i].toCartesianOrigin(new _IsoVector(0, 0), 0.5);
            distFromO[i] = distFrom(vertices[i], "O");
            distFromA[i] = distFrom(vertices[i], "A");
            distFromB[i] = distFrom(vertices[i], "B");

            if (distFromO[i] === distFromA[i] && distFromA[i] === distFromB[i]) {
                closest = 3;
                dist = distFromO[i];
            } else if (distFromO[i] === distFromA[i]) {
                closest = 4;
                dist = distFromO[i];
            } else if (distFromA[i] === distFromB[i]) {
                closest = 5;
                dist = distFromA[i];
            } else if (distFromB[i] === distFromO[i]) {
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
        }

        vertData.sort((a, b) => {
            return a[2] - b[2];
        });
        vertData.sort((a, b) => {
            return a[3] - b[3];
        });
        vertData.sort((a, b) => {
            return a[1] - b[1];
        });
        vertData.sort((a, b) => {
            return a[0] - b[0];
        });

        for (let v = 0; v < vertData.length; v++) {
            vertByDist[vertData[v][2] + "|" + vertData[v][3]] = [vertData[v][0], vertData[v][1], v];
        }

        this.m = m;
        this.n = n;
        this.vertices = vertices;
        this.vertByDist = vertByDist;
        this.cartesian = cartesian;
        this.min = min;
        this.max = max;

        return this;
    }
}

/** Builds Polyhedron Data
 * @internal
 */

export class PolyhedronData {
    /**
     * @internal
     */
    public edgematch: (number | string)[][];

    constructor(
        /**
         * The name of the polyhedron
         */
        public name: string,
        /**
         * The category of the polyhedron
         */
        public category: string,
        /**
         * vertex data
         */
        public vertex: number[][],
        /**
         * face data
         */
        public face: number[][]
    ) {}
}

/**
 * This class Extends the PolyhedronData Class to provide measures for a Geodesic Polyhedron
 */
export class GeodesicData extends PolyhedronData {
    /**
     * @internal
     */
    public edgematch: (number | string)[][];
    /**
     * @internal
     */
    public adjacentFaces: number[][];
    /**
     * @internal
     */
    public sharedNodes: number;
    /**
     * @internal
     */
    public poleNodes: number;
    /**
     * @internal
     */
    public innerToData(face: number, primTri: _PrimaryIsoTriangle) {
        for (let i = 0; i < primTri.innerFacets.length; i++) {
            this.face.push(primTri.innerFacets[i].map((el) => primTri.vecToidx[face + el]));
        }
    }
    /**
     * @internal
     */
    public mapABOBtoDATA(faceNb: number, primTri: _PrimaryIsoTriangle) {
        const fr = primTri.IDATA.edgematch[faceNb][0];
        for (let i = 0; i < primTri.isoVecsABOB.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri.vertexTypes[i][j] === 0) {
                    temp.push(faceNb + "|" + primTri.isoVecsABOB[i][j].x + "|" + primTri.isoVecsABOB[i][j].y);
                } else {
                    temp.push(fr + "|" + primTri.isoVecsABOB[i][j].x + "|" + primTri.isoVecsABOB[i][j].y);
                }
            }
            this.face.push([primTri.vecToidx[temp[0]], primTri.vecToidx[temp[1]], primTri.vecToidx[temp[2]]]);
        }
    }
    /**
     * @internal
     */
    public mapOBOAtoDATA(faceNb: number, primTri: _PrimaryIsoTriangle) {
        const fr = primTri.IDATA.edgematch[faceNb][0];
        for (let i = 0; i < primTri.isoVecsOBOA.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri.vertexTypes[i][j] === 1) {
                    temp.push(faceNb + "|" + primTri.isoVecsOBOA[i][j].x + "|" + primTri.isoVecsOBOA[i][j].y);
                } else {
                    temp.push(fr + "|" + primTri.isoVecsOBOA[i][j].x + "|" + primTri.isoVecsOBOA[i][j].y);
                }
            }
            this.face.push([primTri.vecToidx[temp[0]], primTri.vecToidx[temp[1]], primTri.vecToidx[temp[2]]]);
        }
    }
    /**
     * @internal
     */
    public mapBAOAtoDATA(faceNb: number, primTri: _PrimaryIsoTriangle) {
        const fr = primTri.IDATA.edgematch[faceNb][2];
        for (let i = 0; i < primTri.isoVecsBAOA.length; i++) {
            const temp = [];
            for (let j = 0; j < 3; j++) {
                if (primTri.vertexTypes[i][j] === 1) {
                    temp.push(faceNb + "|" + primTri.isoVecsBAOA[i][j].x + "|" + primTri.isoVecsBAOA[i][j].y);
                } else {
                    temp.push(fr + "|" + primTri.isoVecsBAOA[i][j].x + "|" + primTri.isoVecsBAOA[i][j].y);
                }
            }
            this.face.push([primTri.vecToidx[temp[0]], primTri.vecToidx[temp[1]], primTri.vecToidx[temp[2]]]);
        }
    }
    /**
     * @internal
     */
    public orderData(primTri: _PrimaryIsoTriangle) {
        const nearTo: number[][][] = [];
        for (let i = 0; i < 13; i++) {
            nearTo[i] = [];
        }
        const close: number[][] = primTri.closestTo;
        for (let i = 0; i < close.length; i++) {
            if (close[i][0] > -1) {
                if (close[i][1] > 0) {
                    nearTo[close[i][0]].push([i, close[i][1]]);
                }
            } else {
                nearTo[12].push([i, close[i][0]]);
            }
        }

        const near: number[] = [];
        for (let i = 0; i < 12; i++) {
            near[i] = i;
        }
        let nearIndex = 12;
        for (let i = 0; i < 12; i++) {
            nearTo[i].sort((a: number[], b: number[]) => {
                return a[1] - b[1];
            });
            for (let j = 0; j < nearTo[i].length; j++) {
                near[nearTo[i][j][0]] = nearIndex++;
            }
        }

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

        this.sharedNodes = nearTo[12].length;
        this.poleNodes = this.vertex.length - this.sharedNodes;
    }

    /**
     * @internal
     */
    public setOrder(m: number, faces: number[]) {
        const adjVerts: number[] = [];
        const dualFaces: number[] = [];
        let face: number = <number>faces.pop();
        dualFaces.push(face);
        let index = this.face[face].indexOf(m);
        index = (index + 2) % 3;
        let v = this.face[face][index];
        adjVerts.push(v);
        let f = 0;
        while (faces.length > 0) {
            face = faces[f];
            if (this.face[face].indexOf(v) > -1) {
                // v is a vertex of face f
                index = (this.face[face].indexOf(v) + 1) % 3;
                v = this.face[face][index];
                adjVerts.push(v);
                dualFaces.push(face);
                faces.splice(f, 1);
                f = 0;
            } else {
                f++;
            }
        }
        this.adjacentFaces.push(adjVerts);
        return dualFaces;
    }
    /**
     * @internal
     */
    public toGoldbergPolyhedronData(): PolyhedronData {
        const goldbergPolyhedronData: PolyhedronData = new PolyhedronData("GeoDual", "Goldberg", [], []);
        goldbergPolyhedronData.name = "GD dual";
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
        this.adjacentFaces = [];
        for (let m = 0; m < map.length; m++) {
            goldbergPolyhedronData.face[m] = this.setOrder(m, map[m].concat([]));
            map[m].forEach((el: number) => {
                cx = 0;
                cy = 0;
                cz = 0;
                face = this.face[el];
                for (let i = 0; i < 3; i++) {
                    vertex = this.vertex[face[i]];
                    cx += vertex[0];
                    cy += vertex[1];
                    cz += vertex[2];
                }
                goldbergPolyhedronData.vertex[el] = [cx / 3, cy / 3, cz / 3];
            });
        }
        return goldbergPolyhedronData;
    }

    //statics
    /**Builds the data for a Geodesic Polyhedron from a primary triangle
     * @param primTri the primary triangle
     * @internal
     */

    public static BuildGeodesicData(primTri: _PrimaryIsoTriangle) {
        const geodesicData = new GeodesicData(
            "Geodesic-m-n",
            "Geodesic",
            [
                [0, PHI, -1],
                [-PHI, 1, 0],
                [-1, 0, -PHI],
                [1, 0, -PHI],
                [PHI, 1, 0],
                [0, PHI, 1],
                [-1, 0, PHI],
                [-PHI, -1, 0],
                [0, -PHI, -1],
                [PHI, -1, 0],
                [1, 0, PHI],
                [0, -PHI, 1],
            ],
            []
        );

        primTri.setIndices();
        primTri.calcCoeffs();
        primTri.createInnerFacets();
        primTri.edgeVecsABOB();
        primTri.mapABOBtoOBOA();
        primTri.mapABOBtoBAOA();

        for (let f = 0; f < primTri.IDATA.face.length; f++) {
            primTri.MapToFace(f, geodesicData);
            geodesicData.innerToData(f, primTri);
            if (primTri.IDATA.edgematch[f][1] === "B") {
                geodesicData.mapABOBtoDATA(f, primTri);
            }
            if (primTri.IDATA.edgematch[f][1] === "O") {
                geodesicData.mapOBOAtoDATA(f, primTri);
            }
            if (primTri.IDATA.edgematch[f][3] === "A") {
                geodesicData.mapBAOAtoDATA(f, primTri);
            }
        }

        geodesicData.orderData(primTri);
        const radius = 1;
        geodesicData.vertex = geodesicData.vertex.map(function (el) {
            const a = el[0];
            const b = el[1];
            const c = el[2];
            const d = Math.sqrt(a * a + b * b + c * c);
            el[0] *= radius / d;
            el[1] *= radius / d;
            el[2] *= radius / d;
            return el;
        });

        return geodesicData;
    }
}
