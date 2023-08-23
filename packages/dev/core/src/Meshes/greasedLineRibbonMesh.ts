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
    private _segmentLengths: number[][] = [];
    private _totalLengths: number[];
    private _counters: number[];
    private _slopes: number[];

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
        this._widths = [];

        if (_options.points) {
            this.addPoints(GreasedLineTools.ConvertPoints(_options.points));
        }
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
        // TODO
        // let pointCount = 0;
        // for (const points of this._points) {
        //     pointCount += points.length;
        // }
        // const countDiff = (pointCount / 3)  - this._widths.length;
        // for (let i = 0; i < countDiff; i++) {
        //     this._widths.push(0);
        // }
    }

    protected _setPoints(points: number[][]) {
        if (!this._options.ribbonOptions) {
            throw "No ribbonOptions provided.";
        }

        this._points = points;
        this._options.points = points;

        this._initGreasedLine();

        if (this._options.ribbonOptions.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS) {
            this._preprocess(GreasedLineTools.ToVector3Array(points) as Vector3[][], 0);
        } else {
            let indiceOffset = 0;
            points.forEach((p) => {
                const pathArray = GreasedLineRibbonMesh._ConvertToRibbonPath(p, this._options.ribbonOptions!);
                indiceOffset = this._preprocess(pathArray, indiceOffset);
            });
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
            // for (let i = 0, c = 0; i < positions.length / 3 - numOfPaths; i++) {
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
            // }
        } else {
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
        const mul = this.isFlatLine ? 1 : 0;
        const uLength = new Vector3();
        for (let i = 0; i < positions.length / (pathArrayLength * 3); i++) {
            let u = 0;
            let totalULength = 0;
            for (let pi = 1; pi < pathArrayLength; pi++) {
                pathArray[pi][i].subtractToRef(pathArray[pi - 1][i], uLength);
                totalULength += uLength.lengthSquared();
            }
            for (let pi = 0; pi < pathArrayLength; pi++) {
                if (pi > 0) {
                    pathArray[pi][i].subtractToRef(pathArray[pi - 1][i], uLength);
                    u = uLength.lengthSquared() / totalULength;
                }
                const counter = previousCounters[pi] + this._segmentLengths[pi][i] / this._totalLengths[pi];
                this._counters.push(counter);
                this._uvs.push(u);
                this._uvs.push(counter); // vl
                previousCounters[pi] = counter;
                this._colorPointers.push(i);
                this._widths.push((this._options.widths[pi * pathArrayLength + i] ?? 1 - 1) * this._halfWidth * mul);
            }
        }

        const slopes = GreasedLineRibbonMesh._CalculateSlopes(positions, this._paths);
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

        const countersBuffer = new Buffer(this._engine, this._counters, this._updatable, 1);
        this.setVerticesBuffer(countersBuffer.createVertexBuffer("grl_counters", 0, 1));

        const colorPointersBuffer = new Buffer(this._engine, this._colorPointers, this._updatable, 1);
        this.setVerticesBuffer(colorPointersBuffer.createVertexBuffer("grl_colorPointers", 0, 1));

        const slopesBuffer = new Buffer(this._engine, this._slopes, this._updatable, 3);
        this.setVerticesBuffer(slopesBuffer.createVertexBuffer("grl_slopes", 0, 3));

        const widthsBuffer = new Buffer(this._engine, this._widths, this._updatable, 1);
        this.setVerticesBuffer(widthsBuffer.createVertexBuffer("grl_widths", 0, 1));
        this._widthsBuffer = widthsBuffer;
    }

    private static _ConvertToRibbonPath(points: number[], ribbonInfo: GreasedLineRibbonOptions) {
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
        const deepCopiedLineOptions = {};
        DeepCopier.DeepCopy(lineOptions, deepCopiedLineOptions, ["instance"]);

        const cloned = new GreasedLineRibbonMesh(name, this._scene, <GreasedLineMeshOptions>deepCopiedLineOptions);
        if (newParent) {
            cloned.parent = newParent;
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
    }

    private static _CompareV3(v: Vector3, positions: number[], i: number, theta = 0.00001) {
        return Math.abs(v.x - positions[i]) < theta && Math.abs(v.y - positions[i + 1]) < theta && Math.abs(v.z - positions[i + 2]) < theta;
    }

    private static _VertexPositionToPathPositionIndex(vertexPositions: number[], i: number, paths: Vector3[][]) {
        for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
            const pointIndex = paths[pathIndex].findIndex((v) => GreasedLineRibbonMesh._CompareV3(v, vertexPositions, i));
            if (pointIndex > -1) {
                return { pointIndex, pathIndex };
            }
        }
        return { pointIndex: -1, pathIndex: -1 };
    }

    // private _alignWidthsNonAligned(widths: number[], vertexPositions: number[], paths: Vector3[][]) {
    //     const alignedWidths = new Array(vertexPositions.length / 3);

    //     if (!this._isLineRibbon) {
    //         alignedWidths.fill(0);
    //         return alignedWidths;
    //     }

    //     const path1 = paths[0];
    //     const path2 = paths.length === 2 ? paths[1] : paths[paths.length - 1];

    //     GreasedLineRibbonMesh._IterateVertices(vertexPositions, [path1, path2], null, (pointIndex, pathIndex, vertexPositionIndex) => {
    //         if (pathIndex === 0) {
    //             const w = widths[pointIndex * 2] - 1 ?? 0;
    //             alignedWidths[vertexPositionIndex / 3] = w * this._ribbonHalfWidth;
    //         } else {
    //             const w = widths[pointIndex * 2 + 1] - 1 ?? 0;
    //             alignedWidths[vertexPositionIndex / 3] = w * this._ribbonHalfWidth;
    //         }
    //     });

    //     return alignedWidths;
    // }

    // }
    // private _calculateSegmentLengths(paths: number[][]) {
    //     this._segmentLengths = new Array(paths.length);
    //     this._totalLengths = new Array(paths.length);
    //     for (let pi = 0; pi < paths.length; pi++) {
    //         const points = paths[pi];
    //         this._segmentLengths[pi] = [0]; // first point has 0 distance
    //         let length = 0;

    //         for (let i = 0; i < points.length - 3; i += 3) {
    //             TmpVectors.Vector3[0].x = points[i];
    //             TmpVectors.Vector3[0].y = points[i + 1];
    //             TmpVectors.Vector3[0].z = points[i + 3];
    //             TmpVectors.Vector3[1].x = points[i * 2];
    //             TmpVectors.Vector3[1].y = points[i * 2 + 1];
    //             TmpVectors.Vector3[1].z = points[i * 2 + 3];
    //             const l = Math.abs(TmpVectors.Vector3[0].subtract(TmpVectors.Vector3[1]).lengthSquared());
    //             length += l;
    //             this._segmentLengths[pi].push(l);
    //         }
    //         this._totalLengths[pi] = length;
    //     }
    // }
    private _calculateSegmentLengths(paths: Vector3[][]) {
        this._segmentLengths = new Array(paths.length);
        this._totalLengths = new Array(paths.length);
        for (let pi = 0; pi < paths.length; pi++) {
            const points = paths[pi];
            this._segmentLengths[pi] = [0]; // first point has 0 distance
            let length = 0;

            for (let i = 0; i < points.length - 1; i++) {
                const l = Math.abs(points[i].subtract(points[i + 1]).lengthSquared());
                length += l;
                this._segmentLengths[pi].push(l);
            }
            this._totalLengths[pi] = length;
        }
    }

    private static _CalculateSlopes(vertexPositions: number[], paths: Vector3[][]) {
        const points1 = paths[0];
        const points2 = paths.length === 2 ? paths[1] : paths[paths.length - 1];
        const slopes: number[] = [];

        let slope: Vector3;

        GreasedLineRibbonMesh._IterateVertices(
            vertexPositions,
            paths,
            () => {
                slope = new Vector3();
            },
            (pointIndex, pathIndex) => {
                if (pathIndex === 0) {
                    points1[pointIndex].subtract(points2[pointIndex]).normalizeToRef(slope);
                    slopes.push(slope.x, slope.y, slope.z);
                } else {
                    points2[pointIndex].subtract(points1[pointIndex]).normalizeToRef(slope);
                    slopes.push(slope.x, slope.y, slope.z);
                }
            }
        );

        return slopes;
    }

    // private static _CalcDistanceToPointIndex(index: number, segmentLengths: number[]) {
    //     let distance = 0;
    //     for (let i = 0; i <= index; i++) {
    //         distance += segmentLengths[i];
    //     }
    //     return distance;
    // }

    // private static _GetCountersAndColorPointersNonAligned(
    //     vertexPositions: number[],
    //     paths: Vector3[][],
    //     segmentLengths: number[][],
    //     totalLengths: number[],
    //     existingCountersLength: number,
    //     existingColorPointerssLength: number
    // ) {
    //     const counters: number[] = [];
    //     const colorPointers: number[] = [];

    //     let distance = -1;

    //     GreasedLineRibbonMesh._IterateVertices(
    //         vertexPositions,
    //         paths,
    //         () => {
    //             distance = -1;
    //         },
    //         (pointIndex, pathIndex) => {
    //             distance = GreasedLineRibbonMesh._CalcDistanceToPointIndex(pointIndex, segmentLengths[pathIndex]) / totalLengths[pathIndex];

    //             counters.push(distance);
    //             colorPointers.push(pointIndex + existingColorPointerssLength);
    //         }
    //     );

    //     return { counters, colorPointers };
    // }

    private static _IterateVertices(
        vertexPositions: number[],
        paths: Vector3[][],
        initFn: Nullable<() => void>,
        resultFn: (pointIndex: number, pathIndex: number, vertexPositionIndex: number) => void
    ) {
        for (let vertexPositionIndex = 0; vertexPositionIndex < vertexPositions.length; vertexPositionIndex += 3) {
            initFn && initFn();
            const { pointIndex, pathIndex } = GreasedLineRibbonMesh._VertexPositionToPathPositionIndex(vertexPositions, vertexPositionIndex, paths);
            if (pointIndex === -1) {
                console.error(
                    "Point couldn't be found. Index:",
                    vertexPositionIndex,
                    vertexPositions[vertexPositionIndex],
                    vertexPositions[vertexPositionIndex + 1],
                    vertexPositions[vertexPositionIndex + 2],
                    "paths:",
                    paths
                );
                break;
            }

            resultFn(pointIndex, pathIndex, vertexPositionIndex);
        }
    }
}
