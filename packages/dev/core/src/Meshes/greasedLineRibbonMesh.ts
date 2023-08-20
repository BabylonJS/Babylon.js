import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import type { IGreasedLineMaterial } from "../Materials/greasedLinePluginMaterial";
import { GreasedLinePluginMaterial } from "../Materials/greasedLinePluginMaterial";
import { Mesh } from "./mesh";
import { Buffer } from "../Buffers/buffer";
import { VertexData } from "./mesh.vertexData";
import type { Nullable } from "../types";
import type { Node } from "../node";
import { DeepCopier } from "../Misc/deepCopier";
import { GreasedLineTools } from "../Misc/greasedLineTools";
import { GreasedLineSimpleMaterial } from "../Materials/greasedLineSimpleMaterial";
import { CreateRibbonVertexData } from "./Builders/ribbonBuilder";
import type { GreasedLineMeshOptions } from "./greasedLineMesh";

Mesh._GreasedLineRibbonMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineRibbonMesh.Parse(parsedMesh, scene);
};

export enum GreasedLineRibbonPointsMode {
    POINTS_MODE_POINTS = 0,
    POINTS_MODE_PATHS = 1,
}

export type GreasedLineRibbonOptions = {
    /**
     * Whether the ribbon should be doublesided.
     * Defaults to true.
     */
    doubleSided?: boolean;
} & (
    | {
          /**
           * Defines how the points are processed.
           * Every array of points will become the center of the ribbon. The ribbon will be expanded by width/2 to direction and -direction as well.
           */
          pointsMode: GreasedLineRibbonPointsMode.POINTS_MODE_POINTS;
          /**
           * Normalized direction of the slope of the non camera facing line.
           */
          direction: Vector3;
          /**
           * Width of the ribbon.
           */
          width: number;
      }
    | {
          /**
           * Defines how the points are processed.
           * Every array of points is one path. These will be used to buuld one ribbon.
           */
          pointsMode: GreasedLineRibbonPointsMode.POINTS_MODE_PATHS;
      }
);

/**
 * GreasedLine
 */
export class GreasedLineRibbonMesh extends Mesh {
    private _paths: Vector3[][];
    private _segmentLengths: number[][] = [];
    private _totalLengths: number[];
    private _counters: number[];
    private _slopes: number[];

    private _vertexPositions: number[];
    private _indices: number[];
    private _uvs: number[];
    private _points: number[][];
    private _offsets: number[];
    private _colorPointers: number[];
    private _widths: number[];

    private _offsetsBuffer?: Buffer;
    private _widthsBuffer?: Buffer;
    private _colorPointersBuffer?: Buffer;

    private _lazy = false;
    private _updatable = false;

    /**
     * Treshold used to pick the mesh
     */
    public intersectionThreshold = 0.1;

    constructor(public readonly name: string, scene: Scene, private _options: GreasedLineMeshOptions) {
        super(name, scene, null, null, false, false);

        this._lazy = _options.lazy ?? false;
        this._updatable = _options.updatable ?? false;

        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
        this._points = [];
        this._colorPointers = _options.colorPointers ?? [];
        this._widths = _options.widths ?? new Array(_options.points.length).fill(1);

        this._paths = [];
        this._counters = [];
        this._slopes = [];

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
     * Updated a lazy line. Rerenders the line and updates boundinfo as well.
     */
    public updateLazy() {
        this._setPoints(this._points);
        if (!this._options.colorPointers) {
            this._updateColorPointers();
        }
        this._createVertexBuffers();
        this.refreshBoundingInfo();

        this.greasedLineMaterial?.updateLazy();
    }

    /**
     * Dispose the line and it's resources
     */
    public dispose() {
        super.dispose();
    }

    /**
     *
     * @returns true if the mesh was created in lazy mode
     */
    public isLazy(): boolean {
        return this._lazy;
    }

    /**
     * Return the the points offsets
     */
    get offsets() {
        return this._offsets;
    }

    /**
     * Sets point offests
     * @param offsets offset table [x,y,z, x,y,z, ....]
     */
    set offsets(offsets: number[]) {
        this._offsets = offsets;
        if (!this._offsetsBuffer) {
            this._createOffsetsBuffer(offsets);
        } else {
            this._offsetsBuffer && this._offsetsBuffer.update(offsets);
        }
    }

    /**
     * Gets widths at each line point like [widthLower, widthUpper, widthLower, widthUpper, ...]
     */
    get widths() {
        return this._widths;
    }

    /**
     * Sets widths at each line point
     * @param widths width table [widthLower, widthUpper, widthLower, widthUpper ...]
     */
    set widths(widths: number[]) {
        this._widths = widths;
        if (!this._lazy) {
            this._widthsBuffer && this._widthsBuffer.update(widths);
        }
    }

    /**
     * Gets the color pointer. Each vertex need a color pointer. These color pointers points to the colors in the color table @see colors
     */
    get colorPointers() {
        return this._colorPointers;
    }

    /**
     * Sets the color pointer
     * @param colorPointers array of color pointer in the colors array. One pointer for every vertex is needed.
     */
    set colorPointers(colorPointers: number[]) {
        this._colorPointers = colorPointers;
        if (!this._lazy) {
            this._colorPointersBuffer && this._colorPointersBuffer.update(colorPointers);
        }
    }

    /**
     * Gets the pluginMaterial associated with line
     */
    get greasedLineMaterial(): IGreasedLineMaterial | undefined {
        if (this.material && this.material instanceof GreasedLineSimpleMaterial) {
            return this.material;
        }
        const materialPlugin = this.material?.pluginManager?.getPlugin(GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME);
        if (materialPlugin) {
            return <GreasedLinePluginMaterial>materialPlugin;
        }
        return;
    }

    /**
     * Return copy the points.
     */
    get points() {
        const pointsCopy: number[][] = [];
        DeepCopier.DeepCopy(this._points, pointsCopy);
        return pointsCopy;
    }

    /**
     * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
     * @param points points table
     */
    public addPoints(points: number[][]) {
        for (const p of points) {
            this._points.push(p);
        }

        if (!this._lazy) {
            this.setPoints(this._points);
        }
    }

    private _updateColorPointers() {}

    private _updateWidths() {
        // let pointCount = 0;
        // for (const points of this._points) {
        //     pointCount += points.length;
        // }
        // const countDiff = (pointCount / 3)  - this._widths.length;
        // for (let i = 0; i < countDiff; i++) {
        //     this._widths.push(0);
        // }
    }

    /**
     * Sets line points and rerenders the line.
     * @param points points table
     */
    public setPoints(points: number[][]) {
        this._points = points;
        this._updateWidths();
        this._updateColorPointers();
        this._setPoints(points);
    }

    private _setPoints(points: number[][]) {
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

    private get _isLineRibbon() {
        return this._paths.length < 3;
    }

    private _preprocess(pathArray: Vector3[][], indiceOffset: number) {
        this._calculateSegmentLengths(pathArray);
        this._paths = pathArray;

        const ribbonVertexData = CreateRibbonVertexData({
            pathArray,
            sideOrientation: this._options.ribbonOptions!.doubleSided ? Mesh.DOUBLESIDE : undefined,
        });

        const positions = Array.from(ribbonVertexData.positions ?? []);
        const { counters, colorPointers } = GreasedLineRibbonMesh._GetCountersAndColorPointers(positions, this._paths, this._segmentLengths, this._totalLengths);

        if (!this._options.widths) {
            throw "No width table provided.";
        }
        const widths = this._alignWidths(this._widths, positions, this._paths);
        // if (this._isLineRibbon) {
        //     for (const w of widths) {
        //         this._widths.push(w);
        //     }
        // } else {
            this._widths = widths;
        // }

        for (const p of positions) {
            this._vertexPositions.push(p);
        }

        for (const c of counters) {
            this._counters.push(c);
        }

        for (const cp of colorPointers) {
            this._colorPointers.push(cp);
        }

        const slopes = this._calculateSlopes(positions, this._paths);
        for (const s of slopes) {
            this._slopes.push(s);
        }

        if (ribbonVertexData.indices) {
            for (let i = 0; i < ribbonVertexData.indices.length; i++) {
                this._indices.push(ribbonVertexData.indices[i] + indiceOffset);
            }
        }
        indiceOffset += positions.length / 3;

        if (ribbonVertexData.uvs) {
            for (let i = 0; i < ribbonVertexData.uvs.length; i++) {
                this._uvs.push(ribbonVertexData.uvs[i]);
            }
        }

        return indiceOffset;
    }

    private _createVertexBuffers() {
        console.log("vertices", this._vertexPositions);
        console.log("indices", this._indices);
        console.log("counters", this._counters);
        console.log("colorPointers", this._colorPointers);
        console.log("slopes", this._slopes);
        console.log("widths", this._widths);

        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        vertexData.applyToMesh(this, this._options.updatable);

        const engine = this._scene.getEngine();

        const countersBuffer = new Buffer(engine, this._counters, this._updatable, 1);
        this.setVerticesBuffer(countersBuffer.createVertexBuffer("grl_counters", 0, 1));

        const colorPointersBuffer = new Buffer(engine, this._colorPointers, this._updatable, 1);
        this.setVerticesBuffer(colorPointersBuffer.createVertexBuffer("grl_colorPointers", 0, 1));

        const slopesBuffer = new Buffer(engine, this._slopes, this._updatable, 3);
        this.setVerticesBuffer(slopesBuffer.createVertexBuffer("grl_slopes", 0, 3));

        const widthsBuffer = new Buffer(engine, this._widths, this._updatable, 1);
        this.setVerticesBuffer(widthsBuffer.createVertexBuffer("grl_widths", 0, 1));
        this._widthsBuffer = widthsBuffer;
    }

    private _createOffsetsBuffer(offsets: number[]) {
        const engine = this._scene.getEngine();

        const offsetBuffer = new Buffer(engine, offsets, this._updatable, 3);
        this.setVerticesBuffer(offsetBuffer.createVertexBuffer("grl_offsets", 0, 3));
        this._offsetsBuffer = offsetBuffer;
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

    private _createLineOptions() {
        const lineOptions: GreasedLineMeshOptions = {
            points: this._points,
            colorPointers: this._colorPointers,
            lazy: this._lazy,
            updatable: this._updatable,
            uvs: this._uvs,
            widths: this._widths,
        };
        return lineOptions;
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

    private _initGreasedLine() {
        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
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

    private _alignWidths(widths: number[], vertexPositions: number[], paths: Vector3[][]) {
        const alignedWidths = new Array(vertexPositions.length / 3);

        if (!this._isLineRibbon) {
            alignedWidths.fill(0);
            return alignedWidths;
        }

        const path1 = paths[0];
        const path2 = paths.length === 2 ? paths[1] : paths[paths.length - 1];

        GreasedLineRibbonMesh._IterateVertices(vertexPositions, [path1, path2], null, (pointIndex, pathIndex, vertexPositionIndex) => {
            if (pathIndex === 0) {
                const w = widths[pointIndex * 2] ?? 1;
                alignedWidths[vertexPositionIndex / 3] = w - 1;
            } else {
                const w = widths[pointIndex * 2 + 1] ?? 1;
                alignedWidths[vertexPositionIndex / 3] = w - 1;
            }
        });

        return alignedWidths;
    }

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

    private _calculateSlopes(vertexPositions: number[], paths: Vector3[][]) {
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

    private static _CalcDistanceToPointIndex(index: number, segmentLengths: number[]) {
        let distance = 0;
        for (let i = 0; i <= index; i++) {
            distance += segmentLengths[i];
        }
        return distance;
    }

    private static _GetCountersAndColorPointers(vertexPositions: number[], paths: Vector3[][], segmentLengths: number[][], totalLengths: number[]) {
        const counters: number[] = [];
        const colorPointers: number[] = [];

        let distance = -1;

        GreasedLineRibbonMesh._IterateVertices(
            vertexPositions,
            paths,
            () => {
                distance = -1;
            },
            (pointIndex, pathIndex) => {
                distance = GreasedLineRibbonMesh._CalcDistanceToPointIndex(pointIndex, segmentLengths[pathIndex]) / totalLengths[pathIndex];

                counters.push(distance);
                colorPointers.push(pointIndex);
            }
        );

        return { counters, colorPointers };
    }

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
