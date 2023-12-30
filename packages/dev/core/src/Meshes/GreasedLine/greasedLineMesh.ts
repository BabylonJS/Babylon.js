import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import type { Ray, TrianglePickingPredicate } from "../../Culling/ray";
import { Buffer, VertexBuffer } from "../../Buffers/buffer";
import { PickingInfo } from "../../Collisions/pickingInfo";
import type { Nullable } from "../../types";
import type { Node } from "../../node";
import { DeepCopier } from "../../Misc/deepCopier";
import { GreasedLineTools } from "../../Misc/greasedLineTools";
import type { GreasedLineMeshOptions } from "./greasedLineBaseMesh";
import { GreasedLineBaseMesh } from "./greasedLineBaseMesh";
import type { VertexData } from "../mesh.vertexData";

Mesh._GreasedLineMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineMesh.Parse(parsedMesh, scene);
};

/**
 * GreasedLineMesh
 * Use the GreasedLineBuilder.CreateGreasedLine function to create an instance of this class.
 */
export class GreasedLineMesh extends GreasedLineBaseMesh {
    private _previousAndSide: number[];
    private _nextAndCounters: number[];

    private static _V_START = new Vector3();
    private static _V_END = new Vector3();
    private static _V_OFFSET_START = new Vector3();
    private static _V_OFFSET_END = new Vector3();

    /**
     * Treshold used to pick the mesh
     */
    public intersectionThreshold = 0.1;

    /**
     * GreasedLineMesh
     * @param name name of the mesh
     * @param scene the scene
     * @param _options mesh options
     */
    constructor(
        public readonly name: string,
        scene: Scene,
        _options: GreasedLineMeshOptions
    ) {
        super(name, scene, _options);

        this._previousAndSide = [];
        this._nextAndCounters = [];

        if (_options.points) {
            this.addPoints(GreasedLineTools.ConvertPoints(_options.points));
        }
    }

    /**
     * "GreasedLineMesh"
     * @returns "GreasedLineMesh"
     */
    public getClassName(): string {
        return "GreasedLineMesh";
    }

    protected _updateColorPointers() {
        if (this._options.colorPointers) {
            return;
        }

        let colorPointer = 0;
        this._colorPointers = [];
        this._points.forEach((p) => {
            for (let jj = 0; jj < p.length; jj += 3) {
                this._colorPointers.push(colorPointer);
                this._colorPointers.push(colorPointer++);
            }
        });
    }

    protected _updateWidths(): void {
        super._updateWidthsWithValue(0);
    }

    protected _setPoints(points: number[][]) {
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
            let uvs: number[] = [];

            this._preprocess(positions, previous, next, side, uvs);

            for (const vp of positions) {
                this._vertexPositions.push(vp);
            }

            for (const i of indices) {
                this._indices.push(i);
            }

            for (let i = 0; i < side.length; i++) {
                this._previousAndSide.push(previous[i * 3], previous[i * 3 + 1], previous[i * 3 + 2], side[i]);
                this._nextAndCounters.push(next[i * 3], next[i * 3 + 1], next[i * 3 + 2], counters[i]);
            }

            uvs = this._options.uvs ?? uvs;
            for (const uv of uvs) {
                this._uvs.push(uv);
            }
        });

        if (!this._lazy) {
            if (!this._options.colorPointers) {
                this._updateColorPointers();
            }
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
        const lineOptions = this._createLineOptions();
        const deepCopiedLineOptions = {};
        DeepCopier.DeepCopy(lineOptions, deepCopiedLineOptions, ["instance"], undefined, true);

        const cloned = new GreasedLineMesh(name, this._scene, <GreasedLineMeshOptions>deepCopiedLineOptions);
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

        serializationObject.lineOptions = this._createLineOptions();
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

    protected _initGreasedLine() {
        super._initGreasedLine();

        this._previousAndSide = [];
        this._nextAndCounters = [];
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
        const intersections = this.findAllIntersections(ray, fastCheck, trianglePredicate, onlyBoundingInfo, worldToUse, skipBoundingInfo, true);
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
    public findAllIntersections(
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
        const widths = this._widths;

        const lineWidth = this.greasedLineMaterial?.width ?? 1;

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
                const precision = (this.intersectionThreshold * (lineWidth * width)) / 2;

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
            if (!this._options.uvs) {
                uvs.push(j / (l - 1), 0);
                uvs.push(j / (l - 1), 1);
            }

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

    protected _createVertexBuffers() {
        const vertexData: VertexData = super._createVertexBuffers();

        const engine = this._scene.getEngine();

        const previousAndSideBuffer = new Buffer(engine, this._previousAndSide, false, 4);
        this.setVerticesBuffer(previousAndSideBuffer.createVertexBuffer("grl_previousAndSide", 0, 4));

        const nextAndCountersBuffer = new Buffer(engine, this._nextAndCounters, false, 4);
        this.setVerticesBuffer(nextAndCountersBuffer.createVertexBuffer("grl_nextAndCounters", 0, 4));

        const widthBuffer = new Buffer(engine, this._widths, this._updatable, 1);
        this.setVerticesBuffer(widthBuffer.createVertexBuffer("grl_widths", 0, 1));
        this._widthsBuffer = widthBuffer;

        const colorPointersBuffer = new Buffer(engine, this._colorPointers, this._updatable, 1);
        this.setVerticesBuffer(colorPointersBuffer.createVertexBuffer("grl_colorPointers", 0, 1));
        this._colorPointersBuffer = colorPointersBuffer;

        return vertexData;
    }
}
