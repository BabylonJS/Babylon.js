import type { Scene } from "../scene";
import type { Matrix } from "../Maths/math.vector";
import { Vector3 } from "../Maths/math.vector";
import { GreasedLinePluginMaterial } from "../Materials/greasedLinePluginMaterial";
import { Mesh } from "./mesh";
import type { Ray, TrianglePickingPredicate } from "../Culling/ray";
import { Buffer, VertexBuffer } from "../Buffers/buffer";
import { VertexData } from "./mesh.vertexData";
import { PickingInfo } from "../Collisions/pickingInfo";
import type { Nullable } from "../types";
import type { Node } from "../node";
import { DeepCopier } from "../Misc/deepCopier";
import { GreasedLineTools } from "core/Misc/greasedLineTools";

export type GreasedLinePoints = Vector3[] | Vector3[][] | Float32Array | Float32Array[] | number[][];

/**
 * Options for creating a GreasedLineMesh
 */
export interface GreasedLineMeshOptions {
    /**
     * Points of the line.
     */
    points: GreasedLinePoints;
    /**
     * Each line segmment (from point to point) can have it's width multiplier. Final width = widths[segmentIdx] * width.
     * Defaults to empty array.
     */
    widths?: number[];
    /**
     * If instance is specified, lines are added to the specified instance.
     * Defaults to undefined.
     */
    instance?: GreasedLineMesh;
    /**
     * If true, offsets and widths are updatable.
     * Defaults to false.
     */
    updatable?: boolean;
    /**
     * Use when @see instance is specified.
     * If true, the line will be rendered only after calling instance.updateLazy(). If false, line will be rerendered after every call to @see CreateGreasedLine
     * Defaults to false.
     */
    lazy?: boolean;
}

Mesh._GreasedLineMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineMesh.Parse(parsedMesh, scene);
};

/**
 * GreasedLine
 */
export class GreasedLineMesh extends Mesh {
    private _vertexPositions: number[];
    private _offsets?: number[];
    private _colorPointers: number[];
    private _previousAndSide: number[];
    private _nextAndCounters: number[];

    private _indices: number[];
    private _uvs: number[];
    private _points: number[][];

    private _offsetsBuffer?: Buffer;
    private _widthsBuffer?: Buffer;
    private _colorPointersBuffer?: Buffer;

    private _lazy = false;
    private _updatable = false;

    private static _V_START = new Vector3();
    private static _V_END = new Vector3();
    private static _V_OFFSET_START = new Vector3();
    private static _V_OFFSET_END = new Vector3();

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
        this._colorPointers = [];

        this._previousAndSide = [];
        this._nextAndCounters = [];
        _options.widths = _options.widths ?? new Array(_options.points.length).fill(1);

        if (_options.points) {
            this.addPoints(GreasedLineMesh.ConvertPoints(_options.points));
        }
    }

    /**
     * "GreasedLineMesh"
     * @returns "GreasedLineMesh"
     */
    public getClassName(): string {
        return "GreasedLineMesh";
    }

    /**
     * Converts GreasedLinePoints to number[][]
     * @param points GreasedLinePoints
     * @returns number[][] with x, y, z coordinates of the points, like [[x, y, z, x, y, z, ...], [x, y, z, ...]]
     */
    public static ConvertPoints(points: GreasedLinePoints): number[][] {
        if (points.length && Array.isArray(points[0]) && typeof points[0][0] === "number") {
            return <number[][]>points;
        } else if (points.length && !Array.isArray(points[0]) && points[0] instanceof Vector3) {
            const positions: number[] = [];
            for (let j = 0; j < points.length; j++) {
                const p = points[j] as Vector3;
                positions.push(p.x, p.y, p.z);
            }
            return [positions];
        } else if (points.length > 0 && Array.isArray(points[0]) && points[0].length > 0 && points[0][0] instanceof Vector3) {
            const positions: number[][] = [];
            const vectorPoints = points as Vector3[][];
            vectorPoints.forEach((p) => {
                positions.push(p.flatMap((p2) => [p2.x, p2.y, p2.z]));
            });
            return positions;
        } else if (points instanceof Float32Array) {
            return [Array.from(points)];
        } else if (points.length && points[0] instanceof Float32Array) {
            const positions: number[][] = [];
            points.forEach((p) => {
                positions.push(Array.from(p as Float32Array));
            });
            return positions;
        }

        return [];
    }

    /**
     * Updated a lazy line. Rerenders the line and updates boundinfo as well.
     */
    public updateLazy() {
        this.setPoints(this._points);
        this._updateColorPointers();
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
     *
     * @returns options of the line
     */
    get options(): GreasedLineMeshOptions {
        return this._options;
    }

    /**
     * Calculates the sum of points of every line and the number of points in each line.
     * This function is useful when you are drawing multiple lines in one mesh and you want
     * to know the counts. For example for creating an offsets table.
     * @param points point array
     * @returns points count info
     */
    public static GetPointsCountInfo(points: number[][]): { total: number; counts: number[] } {
        const counts = new Array(points.length);
        let total = 0;
        for (let n = points.length; n--; ) {
            counts[n] = points[n].length / 3;
            total += counts[n];
        }
        return { total, counts };
    }

    /**
     * Sets point offets
     * @param offsets offset table [x,y,z, x,y,z, ....]
     */
    public setOffsets(offsets: number[]) {
        if (!this._offsetsBuffer) {
            this._createOffsetsBuffer(offsets);
        } else {
            this._offsetsBuffer && this._offsetsBuffer.update(offsets);
        }
    }

    /**
     * Sets widths at each line point
     * @param widths width table [widthUpper,widthLower, widthUpper,widthLower, ...]
     */
    public setSegmentWidths(widths: number[]) {
        this._options.widths = widths;
        if (!this._lazy) {
            this._widthsBuffer && this._widthsBuffer.update(widths);
        }
    }

    /**
     * Sets the color pointer
     * @param colorPointers arra of color pointer in the colors array. Oone pointer for every vertex is needed.
     */
    public setColorPointers(colorPointers: number[]) {
        if (!this._lazy) {
            this._colorPointersBuffer && this._colorPointersBuffer.update(colorPointers);
        }
    }

    /**
     * Gets the pluginMaterial associated with line
     */
    get greasedLineMaterial() {
        return <GreasedLinePluginMaterial>this.material?.pluginManager?.getPlugin(GreasedLinePluginMaterial.GREASED_LINE_MATERIAL_NAME);
        return null;
    }

    /**
     * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
     * @param points points table
     */
    public addPoints(points: number[][]) {
        const numberPoints = points;
        this._points.push(...numberPoints);
        if (!this._lazy) {
            this.setPoints(this._points);
        }
    }

    private _updateColorPointers() {
        let colorPointer = 0;
        this._colorPointers = [];
        this._points.forEach((p) => {
            for (let jj = 0; jj < p.length; jj += 3) {
                this._colorPointers.push(colorPointer);
                this._colorPointers.push(colorPointer++);
            }
        });
    }

    /**
     * Sets line points and rerenders the line.
     * @param points points table
     */
    public setPoints(points: number[][]) {
        this._points = points;
        this._options.points = points;

        this._initGreasedLine();

        let indiceOffset = 0;

        points.forEach((p) => {
            const counters: number[] = [];
            const positions: number[] = [];
            const indices: number[] = [];

            const totalLength = GreasedLineTools.GetLineLength(p);
            for (let j = 0, jj = 0; jj < p.length; j++, jj += 3) {
                const partialLine = p.slice(0, jj + 3);
                const partialLineLength = GreasedLineTools.GetLineLength(partialLine);
                const c = partialLineLength / totalLength;

                positions.push(p[jj], p[jj + 1], p[jj + 2]);
                positions.push(p[jj], p[jj + 1], p[jj + 2]);
                counters.push(c);
                counters.push(c);

                if (jj < p.length - 3) {
                    const n = j * 2 + indiceOffset;
                    indices.push(n, n + 1, n + 2);
                    indices.push(n + 2, n + 1, n + 3);
                }
            }

            indiceOffset += (p.length / 3) * 2;

            const previous: number[] = [];
            const next: number[] = [];
            const side: number[] = [];
            const uvs: number[] = [];

            this._preprocess(positions, previous, next, side, uvs);

            this._vertexPositions.push(...positions);
            this._indices.push(...indices);

            for (let i = 0; i < side.length; i++) {
                this._previousAndSide.push(previous[i * 3], previous[i * 3 + 1], previous[i * 3 + 2], side[i]);
                this._nextAndCounters.push(next[i * 3], next[i * 3 + 1], next[i * 3 + 2], counters[i]);
            }
            this._uvs.push(...uvs);
        });

        if (!this._lazy) {
            this._updateColorPointers();
            this._createVertexBuffers();
            this.refreshBoundingInfo();
        }
    }

    /**
     * Clones the GreasedLineMesh.
     * @param name new line name
     * @param newParent new parent node
     * @returns cloned line
     */
    public clone(name: string = `${this.name}-cloned`, newParent?: Nullable<Node>) {
        const lineOptions = {};
        DeepCopier.DeepCopy(this._options, lineOptions);

        const cloned = new GreasedLineMesh(name, this._scene, <GreasedLineMeshOptions>lineOptions);
        if (newParent) {
            cloned.parent = newParent;
        }

        cloned.material = this.material;

        return cloned;
    }

    /**
     * Serializes this GreasedLineMesh
     * @param serializationObject object to write serialization to
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
        serializationObject.type = this.getClassName();
        serializationObject.lineOptions = this._options;
    }

    /**
     * Parses a serialized GreasedLineMesh
     * @param parsedMesh the serialized GreasedLineMesh
     * @param scene the scene to create the GreasedLineMesh in
     * @returns the created GreasedLineMesh
     */
    public static Parse(parsedMesh: any, scene: Scene): Mesh {
        const lineOptions = <GreasedLineMeshOptions>parsedMesh.lineOptions;
        const name = <string>parsedMesh.name;
        const result = new GreasedLineMesh(name, scene, lineOptions);
        return result;
    }

    /**
     * Checks whether a ray is intersecting this GreasedLineMesh
     * @param ray ray to check the intersection of this mesh with
     * @param fastCheck not supported
     * @param trianglePredicate not supported
     * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
     * @param worldToUse not supported
     * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
     * @returns the picking info
     */
    public intersects(
        ray: Ray,
        fastCheck?: boolean,
        trianglePredicate?: TrianglePickingPredicate,
        onlyBoundingInfo = false,
        worldToUse?: Matrix,
        skipBoundingInfo = false
    ): PickingInfo {
        const pickingInfo = new PickingInfo();
        const intersections = this.getIntersections(ray, fastCheck, trianglePredicate, onlyBoundingInfo, worldToUse, skipBoundingInfo, true);
        if (intersections?.length === 1) {
            const intersection = intersections[0];
            pickingInfo.hit = true;
            pickingInfo.distance = intersection.distance;
            pickingInfo.ray = ray;
            pickingInfo.pickedMesh = this;
            pickingInfo.pickedPoint = intersection.point;
        }
        return pickingInfo;
    }

    /**
     * Gets all intersections of a ray and the line
     * @param ray Ray to check the intersection of this mesh with
     * @param _fastCheck not supported
     * @param _trianglePredicate not supported
     * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
     * @param _worldToUse not supported
     * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
     * @param firstOnly If true, the first and only intersection is immediatelly returned if found
     * @returns intersection(s)
     */
    public getIntersections(
        ray: Ray,
        _fastCheck?: boolean,
        _trianglePredicate?: TrianglePickingPredicate,
        onlyBoundingInfo = false,
        _worldToUse?: Matrix,
        skipBoundingInfo = false,
        firstOnly = false
    ): { distance: number; point: Vector3 }[] | undefined {
        if (onlyBoundingInfo && !skipBoundingInfo && ray.intersectsSphere(this._boundingSphere, this.intersectionThreshold) === false) {
            return;
        }

        const indices = this.getIndices();
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const widths = this._options.widths;

        const lineWidth = this.greasedLineMaterial?.getOptions().width ?? 1;

        const intersects = [];
        if (indices && positions && widths) {
            let i = 0,
                l = 0;
            for (i = 0, l = indices.length - 1; i < l; i += 3) {
                const a = indices[i];
                const b = indices[i + 1];

                GreasedLineMesh._V_START.fromArray(positions, a * 3);
                GreasedLineMesh._V_END.fromArray(positions, b * 3);

                if (this._offsets) {
                    GreasedLineMesh._V_OFFSET_START.fromArray(this._offsets, a * 3);
                    GreasedLineMesh._V_OFFSET_END.fromArray(this._offsets, b * 3);
                    GreasedLineMesh._V_START.addInPlace(GreasedLineMesh._V_OFFSET_START);
                    GreasedLineMesh._V_END.addInPlace(GreasedLineMesh._V_OFFSET_END);
                }

                const iFloored = Math.floor(i / 3);
                const width = widths[iFloored] !== undefined ? widths[iFloored] : 1;
                const precision = this.intersectionThreshold + (lineWidth * width) / 2;

                const distance = ray.intersectionSegment(GreasedLineMesh._V_START, GreasedLineMesh._V_END, precision);
                if (distance !== -1) {
                    intersects.push({
                        distance: distance,
                        point: ray.direction.normalize().multiplyByFloats(distance, distance, distance).add(ray.origin),
                    });
                    if (firstOnly) {
                        return intersects;
                    }
                }
            }
            i = l;
        }

        return intersects;
    }

    private _initGreasedLine() {
        this._vertexPositions = [];
        this._previousAndSide = [];
        this._nextAndCounters = [];
        this._indices = [];
        this._uvs = [];
    }

    private get _boundingSphere() {
        return this.getBoundingInfo().boundingSphere;
    }

    private static _CompareV3(positionIdx1: number, positionIdx2: number, positions: number[]) {
        const arrayIdx1 = positionIdx1 * 6;
        const arrayIdx2 = positionIdx2 * 6;
        return positions[arrayIdx1] === positions[arrayIdx2] && positions[arrayIdx1 + 1] === positions[arrayIdx2 + 1] && positions[arrayIdx1 + 2] === positions[arrayIdx2 + 2];
    }

    private static _CopyV3(positionIdx: number, positions: number[]) {
        const arrayIdx = positionIdx * 6;
        return [positions[arrayIdx], positions[arrayIdx + 1], positions[arrayIdx + 2]];
    }

    private _preprocess(positions: number[], previous: number[], next: number[], side: number[], uvs: number[]) {
        const l = positions.length / 6;

        let v: number[] = [];

        if (GreasedLineMesh._CompareV3(0, l - 1, positions)) {
            v = GreasedLineMesh._CopyV3(l - 2, positions);
        } else {
            v = GreasedLineMesh._CopyV3(0, positions);
        }
        previous.push(v[0], v[1], v[2]);
        previous.push(v[0], v[1], v[2]);

        for (let j = 0; j < l; j++) {
            side.push(1);
            side.push(-1);

            // uvs
            uvs.push(j / (l - 1), 0);
            uvs.push(j / (l - 1), 1);

            if (j < l - 1) {
                v = GreasedLineMesh._CopyV3(j, positions);
                previous.push(v[0], v[1], v[2]);
                previous.push(v[0], v[1], v[2]);
            }
            if (j > 0) {
                v = GreasedLineMesh._CopyV3(j, positions);
                next.push(v[0], v[1], v[2]);
                next.push(v[0], v[1], v[2]);
            }
        }

        if (GreasedLineMesh._CompareV3(l - 1, 0, positions)) {
            v = GreasedLineMesh._CopyV3(1, positions);
        } else {
            v = GreasedLineMesh._CopyV3(l - 1, positions);
        }
        next.push(v[0], v[1], v[2]);
        next.push(v[0], v[1], v[2]);

        return {
            previous,
            next,
            uvs,
            side,
        };
    }

    private _createVertexBuffers() {
        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        vertexData.applyToMesh(this, false);

        const engine = this._scene.getEngine();

        const previousAndSideBuffer = new Buffer(engine, this._previousAndSide, false, 4);
        this.setVerticesBuffer(previousAndSideBuffer.createVertexBuffer("grl_previousAndSide", 0, 4));

        const nextAndCountersBuffer = new Buffer(engine, this._nextAndCounters, false, 4);
        this.setVerticesBuffer(nextAndCountersBuffer.createVertexBuffer("grl_nextAndCounters", 0, 4));

        const widthBuffer = new Buffer(engine, this._options.widths!, this._updatable, 1);
        this.setVerticesBuffer(widthBuffer.createVertexBuffer("grl_widths", 0, 1));
        this._widthsBuffer = widthBuffer;

        const colorPointersBuffer = new Buffer(engine, this._colorPointers, this._updatable, 1);
        this.setVerticesBuffer(colorPointersBuffer.createVertexBuffer("grl_colorPointers", 0, 1));
        this._colorPointersBuffer = colorPointersBuffer;
    }

    private _createOffsetsBuffer(offsets: number[]) {
        const engine = this._scene.getEngine();

        const offsetBuffer = new Buffer(engine, offsets, this._updatable, 3);
        this.setVerticesBuffer(offsetBuffer.createVertexBuffer("grl_offsets", 0, 3));
        this._offsetsBuffer = offsetBuffer;
    }
}
