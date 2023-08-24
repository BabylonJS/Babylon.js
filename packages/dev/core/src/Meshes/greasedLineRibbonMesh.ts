import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { Mesh } from "./mesh";
import { Buffer } from "../Buffers/buffer";
import type { Nullable } from "../types";
import type { Node } from "../node";
import { DeepCopier } from "../Misc/deepCopier";
import { GreasedLineTools } from "../Misc/greasedLineTools";
import type { GreasedLineMeshOptions, GreasedLineRibbonOptions } from "./greasedLineBaseMesh";
import { GreasedLineBaseMesh, GreasedLineRibbonPointsMode } from "./greasedLineBaseMesh";

Mesh._GreasedLineRibbonMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineRibbonMesh.Parse(parsedMesh, scene);
};

/**
 * GreasedLine
 */
export class GreasedLineRibbonMesh extends GreasedLineBaseMesh {
    private _paths: Vector3[][];
    private _pathsOptions: { options: GreasedLineMeshOptions; pathCount: number }[];
    private _vSegmentLengths: number[][];
    private _uSegmentLengths: number[][];
    private _vTotalLengths: number[];
    private _uTotalLengths: number[];

    private _counters: number[];
    private _slopes: number[];
    private _ribbonWidths: number[];

    /**
     * GreasedLineRibbonMesh
     * @param name name of the mesh
     * @param scene the scene
     * @param _options mesh options
     */
    constructor(public readonly name: string, scene: Scene, _options: GreasedLineMeshOptions) {
        super(name, scene, _options);

        this._paths = [];
        this._counters = [];
        this._slopes = [];
        this._colorPointers = [];
        this._widths = _options.widths ?? [];
        this._ribbonWidths = [];
        this._pathsOptions = [];

        if (_options.points) {
            this.addPoints(GreasedLineTools.ConvertPoints(_options.points), _options);
        }
    }

    /**
     * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
     * @param points points table
     */
    public override addPoints(points: number[][], options: GreasedLineMeshOptions) {
        const ribbonOptions = options.ribbonOptions;
        if (!ribbonOptions) {
            throw "addPoints on GreasedLineRibbonMesh instance requires ribbonOptions";
        }

        this._pathsOptions.push({
            options,
            pathCount: points.length,
        });
        super.addPoints(points);
    }

    /**
     * "GreasedLineRibbonMesh"
     * @returns "GreasedLineRibbonMesh"
     */
    public getClassName(): string {
        return "GreasedLineRibbonMesh";
    }

    /**
     * Returns the slopes of the line at each point relative to the center of the line
     */
    get slopes() {
        return this._slopes;
    }

    /**
     * Set the slopes of the line at each point relative to the center of the line
     */
    set slopes(slopes: number[]) {
        this._slopes = slopes;
    }

    protected _updateWidths() {
        let pointCount = 0;
        for (const points of this._points) {
            pointCount += points.length;
        }
        const countDiff = (pointCount / 3) * 2 - this._widths.length;
        for (let i = 0; i < countDiff; i++) {
            this._widths.push(0);
        }
    }

    protected _setPoints(points: number[][]) {
        if (!this._options.ribbonOptions) {
            throw "No ribbonOptions provided.";
        }

        this._points = points;
        this._options.points = points;

        this._initGreasedLine();

        let indiceOffset = 0;
        for (let i = 0, c = 0; i < this._pathsOptions.length; i++) {
            const { options, pathCount } = this._pathsOptions[i];
            const subPoints = points.slice(c, c + pathCount);
            c += pathCount;
            if (options.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS) {
                indiceOffset = this._preprocess(GreasedLineTools.ToVector3Array(subPoints) as Vector3[][], indiceOffset);
            } else {
                subPoints.forEach((p) => {
                    const pathArray = GreasedLineRibbonMesh._ConvertToRibbonPath(p, options.ribbonOptions!);
                    indiceOffset = this._preprocess(pathArray, indiceOffset);
                });
            }
        }

        if (!this._lazy) {
            if (!this._options.colorPointers) {
                this._updateColorPointers();
            }
            this._createVertexBuffers();
            this.refreshBoundingInfo();
        }
    }

    /**
     * Return true if the line was created from two edge paths or one points path.
     * In this case the line is always flat.
     */
    public get isFlatLine() {
        return this._paths.length < 3;
    }

    private static _CreateRibbonVertexData(options: { pathArray: Vector3[][] }) {
        const numOfPaths = options.pathArray.length;
        if (numOfPaths < 2) {
            throw "Minimum of two paths is required to create a ribbon.";
        }

        const positions = [];
        const indices = [];

        const path = options.pathArray[0];
        for (let i = 0; i < path.length; i++) {
            for (let pi = 0; pi < options.pathArray.length; pi++) {
                // if (numOfPaths === 3 && pi == 2) {
                //     continue;
                // }
                const v = options.pathArray[pi][i];
                positions.push(v.x, v.y, v.z);
            }
        }

        const v: number[] = [1, 0, numOfPaths];
        if (numOfPaths > 2) {
            for (let i = 0; i < path.length - 1; i++) {
                v[0] = 1 + numOfPaths * i;
                v[1] = numOfPaths * i;
                v[2] = (i + 1) * numOfPaths;
                for (let pi = 0; pi < (numOfPaths - 1) * 2; pi++) {
                    if (pi % 2 !== 0) {
                        v[2] += 1;
                    }
                    if (pi % 2 === 0 && pi > 0) {
                        v[0] += 1;
                        v[1] += 1;
                    }
                    indices.push(v[0]);
                    indices.push(v[1] + (pi % 2 !== 0 ? numOfPaths : 0));
                    indices.push(v[2]);
                }
            }
        } else {
            // for (let i = 0; i < options.pathArray[0].length; i++) {
            //     positions.push(options.pathArray[0][i].x, options.pathArray[0][i].y, options.pathArray[0][i].z);
            //     positions.push(options.pathArray[1][i].x, options.pathArray[1][i].y, options.pathArray[1][i].z);
            // }
            for (let i = 0; i < positions.length / 3 - numOfPaths; i++) {
                indices.push(i, i + 1, i + numOfPaths);
            }
        }

        return {
            positions,
            indices,
        };
    }

    private _preprocess(pathArray: Vector3[][], indiceOffset: number) {
        this._calculateSegmentLengths(pathArray);
        this._paths = pathArray;

        const ribbonVertexData = GreasedLineRibbonMesh._CreateRibbonVertexData({
            pathArray,
        });

        const positions = ribbonVertexData.positions;

        if (!this._options.widths) {
            throw "No width table provided.";
        }

        for (const p of positions) {
            this._vertexPositions.push(p);
        }

        const pathArrayLength = pathArray.length;
        const previousCounters = new Array(pathArrayLength).fill(0);
        for (let i = 0; i < pathArray[0].length; i++) {
            let u = 0;
            for (let pi = 0; pi < pathArrayLength; pi++) {
                const counter = previousCounters[pi] + this._vSegmentLengths[pi][i] / this._vTotalLengths[pi];
                this._counters.push(counter);
                this._uvs.push(u);
                this._uvs.push(counter); // vl
                previousCounters[pi] = counter;
                this._colorPointers.push(i);

                const l = this._uSegmentLengths[i][pi] / this._uTotalLengths[i];
                console.log(pi, i, this._widths[pi * pathArray[0].length + i]);
                this._ribbonWidths.push((((this._widths[pi * pathArray[0].length + i] ?? 1) - 1) * this._uSegmentLengths[i][pi]) / 2);

                u += l;
            }
        }

        // debugger;
        let c = 0;
        for (let pi = 0; pi < pathArrayLength; pi++) {
            for (let i = 0; i < pathArray[0].length; i++) {
                const hw = this._uSegmentLengths[i][pi] / 2;
                this._ribbonWidths.push(((this._widths[c++] ?? 1) - 1) * hw);

                this._ribbonWidths.push(((this._widths[c++] ?? 1) - 1) * hw);
            }
        }
        if (!this.isFlatLine) {
            // this._widths = new Array(positions.length / 3).fill(0);
        }

        const slopes = GreasedLineRibbonMesh._CalculateSlopes(this._paths);
        for (const s of slopes) {
            this._slopes.push(s);
        }

        if (ribbonVertexData.indices) {
            for (let i = 0; i < ribbonVertexData.indices.length; i++) {
                this._indices.push(ribbonVertexData.indices[i] + indiceOffset);
            }
        }
        indiceOffset += positions.length / 3;

        return indiceOffset;
    }

    protected _createVertexBuffers() {
        super._createVertexBuffers();

        console.log("vertices", this._vertexPositions);
        console.log("indices", this._indices);
        console.log("counters", this._counters);
        console.log("colorPointers", this._colorPointers);
        console.log("slopes", this._slopes);
        console.log("widths", this._widths);
        console.log("ribbonWidths", this._ribbonWidths);
        console.log("uSegmentLengths", this._uSegmentLengths);
        console.log("vSegmentLengths", this._vSegmentLengths);
        console.log("uTotalLengths", this._uTotalLengths);
        console.log("vTotalLengths", this._vTotalLengths);

        const countersBuffer = new Buffer(this._engine, this._counters, this._updatable, 1);
        this.setVerticesBuffer(countersBuffer.createVertexBuffer("grl_counters", 0, 1));

        const colorPointersBuffer = new Buffer(this._engine, this._colorPointers, this._updatable, 1);
        this.setVerticesBuffer(colorPointersBuffer.createVertexBuffer("grl_colorPointers", 0, 1));

        const slopesBuffer = new Buffer(this._engine, this._slopes, this._updatable, 3);
        this.setVerticesBuffer(slopesBuffer.createVertexBuffer("grl_slopes", 0, 3));

        const widthsBuffer = new Buffer(this._engine, this._ribbonWidths, this._updatable, 1);
        this.setVerticesBuffer(widthsBuffer.createVertexBuffer("grl_widths", 0, 1));
        this._widthsBuffer = widthsBuffer;
    }

    private static _ConvertToRibbonPath(points: number[], ribbonInfo: GreasedLineRibbonOptions) {
        if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS && !ribbonInfo.width) {
            throw "Width must be specified in GreasedLineRibbonPointsMode.POINTS_MODE_POINTS";
        }
        const path1 = [];
        const path2 = [];
        if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS) {
            const width = ribbonInfo.width / 2;
            const direction = ribbonInfo.direction.multiplyByFloats(width, width, width);
            const pointVectors = GreasedLineTools.ToVector3Array(points) as Vector3[];
            for (const p of pointVectors) {
                path1.push(p.add(direction));
                path2.push(p.subtract(direction));
            }
        }
        return [path1, path2];
    }

    /**
     * Clones the GreasedLineRibbonMesh.
     * @param name new line name
     * @param newParent new parent node
     * @returns cloned line
     */
    public clone(name: string = `${this.name}-cloned`, newParent?: Nullable<Node>) {
        const lineOptions = this._createLineOptions();
        const deepCopiedLineOptions: any = {};
        DeepCopier.DeepCopy(lineOptions, deepCopiedLineOptions, ["instance", "points"]);

        const cloned = new GreasedLineRibbonMesh(name, this._scene, <GreasedLineMeshOptions>deepCopiedLineOptions);
        if (newParent) {
            cloned.parent = newParent;
        }

        const pointsCloned = this.points;
        for (let i = 0, c = 0; i < this._pathsOptions.length; i++) {
            const { options, pathCount } = this._pathsOptions[i];
            const subPoints = pointsCloned.slice(c, c + pathCount);
            c += pathCount;
            cloned.addPoints(subPoints, options);
        }

        cloned.material = this.material;

        return cloned;
    }

    /**
     * Serializes this GreasedLineRibbonMesh
     * @param serializationObject object to write serialization to
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
        serializationObject.type = this.getClassName();

        serializationObject.lineOptions = this._createLineOptions();
    }

    /**
     * Parses a serialized GreasedLineRibbonMesh
     * @param parsedMesh the serialized GreasedLineRibbonMesh
     * @param scene the scene to create the GreasedLineRibbonMesh in
     * @returns the created GreasedLineRibbonMesh
     */
    public static Parse(parsedMesh: any, scene: Scene): Mesh {
        const lineOptions = <GreasedLineMeshOptions>parsedMesh.lineOptions;
        const name = <string>parsedMesh.name;
        const result = new GreasedLineRibbonMesh(name, scene, lineOptions);
        return result;
    }

    protected _initGreasedLine() {
        super._initGreasedLine();

        this._paths = [];
        this._counters = [];
        this._slopes = [];
        this._ribbonWidths = [];
    }

    private _calculateSegmentLengths(pathArray: Vector3[][]) {
        const pathArrayLength = pathArray.length;
        this._vSegmentLengths = new Array(pathArrayLength);
        this._vTotalLengths = new Array(pathArrayLength);
        let length = 0;
        for (let pi = 0; pi < pathArrayLength; pi++) {
            const points = pathArray[pi];
            this._vSegmentLengths[pi] = [0]; // first point has 0 distance
            length = 0;
            for (let i = 0; i < points.length - 1; i++) {
                const l = Math.abs(points[i].subtract(points[i + 1]).lengthSquared());
                length += l;
                this._vSegmentLengths[pi].push(l);
            }
            this._vTotalLengths[pi] = length;
        }

        //
        const positionsLength = pathArray[0].length;
        this._uSegmentLengths = new Array(positionsLength).fill([]);
        this._uTotalLengths = new Array(positionsLength).fill([]);
        const uLength = new Vector3();
        for (let i = 0; i < positionsLength; i++) {
            length = 0;
            for (let pi = 1; pi < pathArrayLength; pi++) {
                pathArray[pi][i].subtractToRef(pathArray[pi - 1][i], uLength);
                const l = uLength.lengthSquared();
                length += l;
                this._uSegmentLengths[i].push(l);
            }
            this._uTotalLengths[i] = length;
        }
    }

    private static _CalculateSlopes(paths: Vector3[][]) {
        const points1 = paths[0];
        const points2 = paths.length === 2 ? paths[1] : paths[paths.length - 1];
        const slopes: number[] = [];

        const slope = new Vector3();
        for (let i = 0; i < points1.length; i++) {
            for (let pi = 0; pi < paths.length; pi++) {
                if (pi === 0 || pi === paths.length - 1) {
                    points1[i].subtract(points2[i]).normalizeToRef(slope);
                    slopes.push(slope.x, slope.y, slope.z);
                    slopes.push(-slope.x, -slope.y, -slope.z);
                } else {
                    slopes.push(0, 0, 0, 0, 0, 0);
                }
            }
        }

        return slopes;
    }
}
