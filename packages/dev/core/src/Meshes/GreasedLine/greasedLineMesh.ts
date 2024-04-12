import type { Scene } from "../../scene";
import type { Matrix } from "../../Maths/math.vector";
import { Vector3 } from "../../Maths/math.vector";
import { Mesh } from "../mesh";
import type { Ray, TrianglePickingPredicate } from "../../Culling/ray";
import { Buffer, VertexBuffer } from "../../Buffers/buffer";
import { PickingInfo } from "../../Collisions/pickingInfo";
import type { Nullable, FloatArray } from "../../types";
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
    private _previousAndSide: FloatArray;
    private _nextAndCounters: FloatArray;

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
        let vertexPositionsLen = 0,
            indicesLength = 0,
            uvLength = 0,
            previousAndSideLength = 0;
        points.forEach((p) => {
            vertexPositionsLen += p.length * 2;
            indicesLength += (p.length - 3) * 2;
            uvLength += (p.length * 4) / 3;
            previousAndSideLength += (p.length * 8) / 3;
        });
        const vertexPositionsArr = new Float32Array(vertexPositionsLen);
        const indicesArr = vertexPositionsLen > 65535 ? new Uint32Array(indicesLength) : new Uint16Array(indicesLength);
        const uvArr = new Float32Array(uvLength);
        const previousAndSide = new Float32Array(previousAndSideLength);
        // it's the same length here
        const nextAndCounters = new Float32Array(previousAndSideLength);
        let vertexPositionsOffset = 0,
            indicesOffset = 0,
            uvOffset = 0,
            previousAndSideOffset = 0,
            nextAndCountersOffset = 0;

        points.forEach((p) => {
            const lengthArray = GreasedLineTools.GetLineLengthArray(p);
            const totalLength = lengthArray[lengthArray.length - 1];
            for (let j = 0, jj = 0; jj < p.length; j++, jj += 3) {
                const baseOffset = vertexPositionsOffset + jj * 2;
                vertexPositionsArr[baseOffset + 0] = p[jj + 0];
                vertexPositionsArr[baseOffset + 1] = p[jj + 1];
                vertexPositionsArr[baseOffset + 2] = p[jj + 2];
                vertexPositionsArr[baseOffset + 3] = p[jj + 0];
                vertexPositionsArr[baseOffset + 4] = p[jj + 1];
                vertexPositionsArr[baseOffset + 5] = p[jj + 2];

                if (jj < p.length - 3) {
                    const n = j * 2 + indiceOffset;
                    const baseIndicesOffset = indicesOffset + jj * 2;
                    indicesArr[baseIndicesOffset + 0] = n;
                    indicesArr[baseIndicesOffset + 1] = n + 1;
                    indicesArr[baseIndicesOffset + 2] = n + 2;
                    indicesArr[baseIndicesOffset + 3] = n + 2;
                    indicesArr[baseIndicesOffset + 4] = n + 1;
                    indicesArr[baseIndicesOffset + 5] = n + 3;
                }
            }

            indiceOffset += (p.length / 3) * 2;
            const currVertexPositionsOffsetLength = p.length * 2;
            const positions = vertexPositionsArr.subarray(vertexPositionsOffset, vertexPositionsOffset + currVertexPositionsOffsetLength);
            vertexPositionsOffset += currVertexPositionsOffsetLength;
            indicesOffset += (p.length - 3) * 2;

            const previous = new Float32Array(positions.length);
            const next = new Float32Array(positions.length);
            const l = positions.length / 6;
            let v;
            if (GreasedLineMesh._CompareV3(0, l - 1, positions)) {
                v = positions.subarray((l - 2) * 6, (l - 1) * 6);
            } else {
                v = positions.subarray(0, 6);
            }
            previous.set(v);
            previous.set(positions.subarray(0, positions.length - 6), 6);
            next.set(positions.subarray(6));
            if (GreasedLineMesh._CompareV3(l - 1, 0, positions)) {
                v = positions.subarray(6, 12);
            } else {
                v = positions.subarray((l - 1) * 6, l * 6);
            }
            next.set(v, next.length - 6);

            for (let i = 0, sidesLength = positions.length / 3; i < sidesLength; i++) {
                previousAndSide[previousAndSideOffset++] = previous[i * 3];
                previousAndSide[previousAndSideOffset++] = previous[i * 3 + 1];
                previousAndSide[previousAndSideOffset++] = previous[i * 3 + 2];
                // side[i] = i % 2 ? -1 : 1;
                // side[i] = 1 - ((i & 1) << 1);
                previousAndSide[previousAndSideOffset++] = 1 - ((i & 1) << 1);
                nextAndCounters[nextAndCountersOffset++] = next[i * 3];
                nextAndCounters[nextAndCountersOffset++] = next[i * 3 + 1];
                nextAndCounters[nextAndCountersOffset++] = next[i * 3 + 2];
                // counters[i] = lengthArray[i >> 1] / totalLength;
                nextAndCounters[nextAndCountersOffset++] = lengthArray[i >> 1] / totalLength;
            }
            if (this._options.uvs) {
                for (let i = 0; i < this._options.uvs.length; i++) {
                    uvArr[uvOffset++] = this._options.uvs[i];
                }
            } else {
                for (let j = 0; j < l; j++) {
                    // uvs
                    const uvOffsetBase = uvOffset + j * 4;
                    uvArr[uvOffsetBase + 0] = j / (l - 1);
                    uvArr[uvOffsetBase + 1] = 0;
                    uvArr[uvOffsetBase + 2] = j / (l - 1);
                    uvArr[uvOffsetBase + 3] = 1;
                }
                uvOffset += l * 4;
            }
        });
        this._vertexPositions = vertexPositionsArr;
        this._indices = indicesArr;
        this._uvs = uvArr;
        this._previousAndSide = previousAndSide;
        this._nextAndCounters = nextAndCounters;

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

    private static _CompareV3(positionIdx1: number, positionIdx2: number, positions: number[] | Float32Array) {
        const arrayIdx1 = positionIdx1 * 6;
        const arrayIdx2 = positionIdx2 * 6;
        return positions[arrayIdx1] === positions[arrayIdx2] && positions[arrayIdx1 + 1] === positions[arrayIdx2 + 1] && positions[arrayIdx1 + 2] === positions[arrayIdx2 + 2];
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
