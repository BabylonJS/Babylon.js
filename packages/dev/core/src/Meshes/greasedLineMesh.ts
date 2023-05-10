// import type { Nullable } from './../types';
import type { Scene } from "../scene";
import type { Matrix } from "../Maths/math.vector";
import { Vector3 } from "../Maths/math.vector";
import type { GreasedLineMaterialOptions } from "../Materials/greasedLinePluginMaterial";
import { GreasedLineMeshMaterialType, GreasedLinePluginMaterial } from "../Materials/greasedLinePluginMaterial";
import { BoundingSphere } from "../Culling/boundingSphere";
import { Mesh } from "./mesh";
import type { Ray, TrianglePickingPredicate } from "../Culling/ray";
import { Buffer, VertexBuffer } from "../Buffers/buffer";
import { VertexData } from "./mesh.vertexData";
import { PickingInfo } from "../Collisions/pickingInfo";
import type { Nullable } from "../types";
import type { Node } from "../node";
import { PBRMaterial } from "../Materials/PBR/pbrMaterial";
import { StandardMaterial } from "../Materials/standardMaterial";
import { DeepCopier } from "../Misc/deepCopier";

/**
 * Options for creating a GreasedLineMesh
 */
export interface GreasedLineMeshOptions {
    /**
     * Points of the line.
     */
    points: number[][];
    /**
     * Each line segmment (from point to point) can have it's width multiplier. Final width = widths[segmentIdx] * width.
     */
    widths?: number[];
    /**
     * How to distribute the widths if the width table contains fewer entries than there are line segments.
     * @see NormalizeWidthTable
     */
    widthsDistribution?: GreasedLineMeshWidthDistribution;
    /**
     * Each line point can have an offset.
     */
    offsets?: number[];
    /**
     * If instance is specified, lines are added to the specified instance.
     */
    instance?: GreasedLineMesh;
    /**
     * If true, offsets and widths are updatable.
     */
    updatable?: boolean;
    /**
     * Use when @see instance is specified.
     * If true, the line will be rendered only after calling instance.updateLazy(). If false, line will be rerendered after every call to @see CreateGreasedLine
     */
    lazy?: boolean;
}

export enum GreasedLineMeshColorDistribution {
    COLOR_DISTRIBUTION_NONE = 0,
    COLOR_DISTRIBUTION_REPEAT = 1,
    COLOR_DISTRIBUTION_EVEN = 2,
    COLOR_DISTRIBUTION_START = 3,
    COLOR_DISTRIBUTION_END = 4,
    COLOR_DISTRIBUTION_START_END = 5,
}

export enum GreasedLineMeshWidthDistribution {
    WIDTH_DISTRIBUTION_NONE = 0,
    WIDTH_DISTRIBUTION_REPEAT = 1,
    WIDTH_DISTRIBUTION_EVEN = 2,
    WIDTH_DISTRIBUTION_START = 3,
    WIDTH_DISTRIBUTION_END = 4,
    WIDTH_DISTRIBUTION_START_END = 5,
}

/**
 * GreasedLine
 */
export class GreasedLineMesh extends Mesh {
    private _vertexPositions: number[];
    private _offsets?: number[];
    private _previous: number[];
    private _next: number[];
    private _side: number[];
    private _widths: number[];

    private _indices: number[];
    private _uvs: number[];
    private _counters: number[];
    private _points: number[][];

    private _offsetsBuffer?: Buffer;
    private _widthsBuffer?: Buffer;

    private _matrixWorld: Matrix;

    private _boundingSphere: BoundingSphere;
    private _lazy = false;
    private _updatable: boolean = false;

    /**
     * Treshold used to pick the mesh
     */
    public intersectionThreshold = 10; // TODO: tune default value

    constructor(public readonly name: string, scene: Scene, private _options: GreasedLineMeshOptions, private _pluginMaterial: GreasedLinePluginMaterial) {
        super(name, scene, null, null, false, false);

        this._lazy = this._options.lazy ?? false;
        this._updatable = this._options.updatable ?? false;

        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];

        if (_options.offsets) {
            this._offsets = [..._options.offsets];
        }
        this._previous = [];
        this._next = [];
        this._side = [];
        this._widths = _options.widths ?? new Array(_options.points.length).fill(1);
        this._counters = [];

        this._points = [];

        this._matrixWorld = this.getWorldMatrix();

        this._boundingSphere = new BoundingSphere(Vector3.Zero(), Vector3.Zero(), this._matrixWorld);

        if (this._options.points) {
            this.addPoints(this._options.points);
        }
    }

    /**
     * Updated a lazy line. Rerenders the line and updates boundinfo as well.
     */
    public updateLazy() {
        this.setPoints(this._points);
        this._drawLine();
        this._updateRaycastBoundingInfo();

        if (this.greasedLineMaterial) {
            this.greasedLineMaterial.updateLazy();
        }
    }

    /**
     * Dispose the line and it's resources
     */
    public dispose() {
        this.greasedLineMaterial?.dispose();
        this.material?.dispose();
        super.dispose();
    }

    // TODO: do we need any of these?

    // public get positions() {
    //     return this._vertexPositions; // TODO: clone?
    // }

    // public get points() {
    //     return this._points; // TODO: clone?
    // }

    // public set points(points: number[][]) {
    //     this.setPoints(points);
    // }

    public isLazy(): boolean {
        return this._lazy;
    }

    /**
     *
     * @returns currente segment widths
     */
    public getSegmentWidths(): number[] {
        return this._widths; // TODO: clone?
    }

    /**
     *
     * @returns options of the line
     */
    public getOptions(): GreasedLineMeshOptions {
        // const options = {};
        // DeepCopier.DeepCopy(this._options, options);
        return this._options; // TODO: DeepCopy?
    }

    /**
     * Sets point offets
     * @param offsets offset table [x,y,z, x,y,z, ....]
     */
    public setOffsets(offsets: number[]) {
        this._offsetsBuffer && this._offsetsBuffer.update(offsets);
    }

    /**
     * Sets widths at each line point
     * @param widths width table [widthUpper,widthLower, widthUpper,widthLower, ...]
     */
    public setSegmentWidths(widths: number[]) {
        this._widths = widths;
        if (!this._lazy) {
            this._widthsBuffer && this._widthsBuffer.update(widths);
        }
    }

    /**
     * Gets the pluginMaterial associated with line
     */
    get greasedLineMaterial() {
        return this._pluginMaterial;
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
            const positions: number[] = [];
            const counters: number[] = [];
            const indices: number[] = [];

            for (let j = 0, jj = 0; jj < p.length; j++, jj += 3) {
                const c = jj / p.length;

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

            const { previous, next, uvs, side } = this._preprocess(positions);

            this._vertexPositions.push(...positions);
            this._indices.push(...indices);
            this._counters.push(...counters);
            this._previous.push(...previous);
            this._next.push(...next);
            this._uvs.push(...uvs);
            this._side.push(...side);
        });

        if (!this._lazy) {
            this._drawLine();
            this._updateRaycastBoundingInfo();
        }
    }

    /**
     * Clones the line.
     * @param name new line name
     * @param newParent new parent node
     * @returns cloned line
     */
    public clone(name: string = `${this.name}-cloned`, newParent?: Nullable<Node>) {
        // TODO: can this method be async and can we use dynamic imports of the material?

        const lineOptions = {};
        DeepCopier.DeepCopy(this._options, lineOptions);
        const materialOptions = {};
        DeepCopier.DeepCopy(this._pluginMaterial.getOptions(), materialOptions);

        const material =
            (<GreasedLineMaterialOptions>materialOptions).materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR
                ? new PBRMaterial(name, this._scene)
                : new StandardMaterial(name, this._scene);
        const pluginMaterial = new GreasedLinePluginMaterial(material, this._scene, materialOptions);
        const cloned = new GreasedLineMesh(name, this._scene, <GreasedLineMeshOptions>lineOptions, pluginMaterial);
        cloned.material = material;

        if (newParent) {
            cloned.parent = newParent;
        }

        return cloned;
    }

    /**
     * Serializes this ground mesh
     * @param serializationObject object to write serialization to
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
        serializationObject.lineOptions = this._options;
        serializationObject.materialOptions = this._pluginMaterial.getOptions();
    }

    /**
     * Parses a serialized ground mesh
     * @param serializedMesh the serialized mesh
     * @param scene the scene to create the ground mesh in
     * @returns the created ground mesh
     */
    public static Parse(serializedMesh: any, scene: Scene): Mesh {
        const lineOptions = <GreasedLineMeshOptions>serializedMesh.lineOptions;
        const materialOptions = <GreasedLineMaterialOptions>serializedMesh.materialOptions;
        const name = <string>serializedMesh.name;

        const material =
            materialOptions.materialType === GreasedLineMeshMaterialType.MATERIAL_TYPE_PBR ? new PBRMaterial(name, this._scene) : new StandardMaterial(name, this._scene);
        const pluginMaterial = new GreasedLinePluginMaterial(material, scene, materialOptions);

        const parsed = new GreasedLineMesh(name, scene, lineOptions, pluginMaterial);
        parsed.material = material;
        return parsed;
    }

    // TODO: which parameters to suppport?
    public intersects(
        ray: Ray,
        fastCheck?: boolean | undefined,
        trianglePredicate?: TrianglePickingPredicate | undefined,
        onlyBoundingInfo?: boolean,
        worldToUse?: Matrix | undefined,
        skipBoundingInfo?: boolean
    ): PickingInfo {
        const pickingInfo = new PickingInfo();
        const intersections = this.intersections(ray);
        if (intersections?.length === 1) {
            const intersection = intersections[0];
            pickingInfo.hit = true;
            pickingInfo.distance = intersection.distance;
            pickingInfo.ray = ray;
            pickingInfo.pickedMesh = intersection.object;
            pickingInfo.pickedPoint = intersection.point;
        }

        return pickingInfo;
    }

    /**
     * Gets all intersections of a ray and the line.
     * @param ray Ray
     * @param firstOnly If true, the first and only intersection is immediatelly returned if found.
     * @returns intersection(s)
     */
    public intersections(ray: Ray, firstOnly = true): { distance: number; point: Vector3; object: GreasedLineMesh }[] | undefined {
        if (this._boundingSphere && ray.intersectsSphere(this._boundingSphere, this.intersectionThreshold) === false) {
            return;
        }

        const vStart = new Vector3();
        const vEnd = new Vector3();
        const vOffsetStart = new Vector3();
        const vOffsetEnd = new Vector3();

        const indices = this.getIndices();
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const widths = this._widths;

        const lineWidth = this.greasedLineMaterial.getOptions().width ?? 1;

        const intersects = [];
        if (indices !== null && positions !== null) {
            let i = 0,
                l = 0;
            for (i = 0, l = indices.length - 1; i < l; i += 3) {
                const a = indices[i];
                const b = indices[i + 1];

                vStart.fromArray(positions, a * 3);
                vEnd.fromArray(positions, b * 3);

                if (this._offsets) {
                    vOffsetStart.fromArray(this._offsets, a * 3);
                    vOffsetEnd.fromArray(this._offsets, b * 3);
                    vStart.addInPlace(vOffsetStart);
                    vStart.addInPlace(vOffsetEnd);
                }

                const iFloored = Math.floor(i / 3);
                const width = widths[iFloored] !== undefined ? widths[iFloored] : 1;
                const precision = this.intersectionThreshold + (lineWidth * width) / 2;

                const distance = ray.intersectionSegment(vStart, vEnd, precision / 1000); // TODO: sizeAtt - keep in mind
                if (distance !== -1) {
                    intersects.push({
                        distance: distance,
                        point: ray.direction.normalize().multiplyByFloats(distance, distance, distance).add(ray.origin),
                        object: this,
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
        this._counters = [];
        this._previous = [];
        this._next = [];
        this._side = [];
        this._indices = [];
        this._uvs = [];
    }

    private _updateRaycastBoundingInfo() {
        const boundingInfo = this.getBoundingInfo();
        this._boundingSphere.reConstruct(boundingInfo.minimum, boundingInfo.maximum, this._matrixWorld);
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

    private _preprocess(positions: number[]) {
        const l = positions.length / 6;

        let v: number[] = [];

        const previous = [];
        const next = [];
        const side = [];
        const uvs = [];

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

    private _drawLine() {
        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        vertexData.applyToMesh(this, false);

        const engine = this._scene.getEngine();

        const previousBuffer = new Buffer(engine, this._previous, false, 3);
        this.setVerticesBuffer(previousBuffer.createVertexBuffer("previous", 0, 3));

        const nextBuffer = new Buffer(engine, this._next, false, 3);
        this.setVerticesBuffer(nextBuffer.createVertexBuffer("next", 0, 3));

        const sideBuffer = new Buffer(engine, this._side, false, 1);
        this.setVerticesBuffer(sideBuffer.createVertexBuffer("side", 0, 1));

        const countersBuffer = new Buffer(engine, this._counters, false, 1);
        this.setVerticesBuffer(countersBuffer.createVertexBuffer("counters", 0, 1));

        const widthBuffer = new Buffer(engine, this._widths, this._updatable, 1);
        this.setVerticesBuffer(widthBuffer.createVertexBuffer("widths", 0, 1));
        this._widthsBuffer = widthBuffer;

        if (this._offsets) {
            const offsetBuffer = new Buffer(engine, this._offsets, this._updatable, 3);
            this.setVerticesBuffer(offsetBuffer.createVertexBuffer("offsets", 0, 3));
            this._offsetsBuffer = offsetBuffer;
        }
    }
}
