import type { Scene } from "../scene";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { Mesh } from "./mesh";
import { Buffer } from "../Buffers/buffer";
import type { Nullable } from "../types";
import type { Node } from "../node";
import { DeepCopier } from "../Misc/deepCopier";
import { GreasedLineTools } from "../Misc/greasedLineTools";
import type { GreasedLineMeshOptions, GreasedLineRibbonOptions } from "./greasedLineBaseMesh";
import { GreasedLineBaseMesh, GreasedLineRibbonFacesMode, GreasedLineRibbonPointsMode } from "./greasedLineBaseMesh";

Mesh._GreasedLineRibbonMeshParser = (parsedMesh: any, scene: Scene): Mesh => {
    return GreasedLineRibbonMesh.Parse(parsedMesh, scene);
};

/**
 * GreasedLine
 */
export class GreasedLineRibbonMesh extends GreasedLineBaseMesh {
    /**
     * Defaule line width
     */
    public static DEFAULT_WIDTH = 0.1;

    private static _RightHandedForwardReadOnlyQuaternion = Quaternion.RotationAxis(Vector3.RightHandedForwardReadOnly, Math.PI / 2);
    private static _LeftHandedForwardReadOnlyQuaternion = Quaternion.RotationAxis(Vector3.LeftHandedForwardReadOnly, Math.PI / 2);
    private static _LeftReadOnlyQuaternion = Quaternion.RotationAxis(Vector3.LeftReadOnly, Math.PI / 2);
    private static _UpReadOnlyQuaternion = Quaternion.RotationAxis(Vector3.LeftHandedForwardReadOnly, Math.PI / 2);

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
    constructor(public readonly name: string, scene: Scene, _options: GreasedLineMeshOptions, _pathOptions?: { options: GreasedLineMeshOptions; pathCount: number }[]) {
        super(name, scene, _options);

        if (!_options.ribbonOptions) {
            throw "'ribbonOptions' is not set.";
        } else {
            _options.ribbonOptions.width = GreasedLineRibbonMesh.DEFAULT_WIDTH;
        }

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

        super.addPoints(points, options);
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

    protected _updateColorPointers() {
        // intentionally blank
    }

    protected _updateWidths(): void {
        super._updateWidthsWithValue(1);
    }

    protected _setPoints(points: number[][], options: GreasedLineMeshOptions) {
        if (!this._options.ribbonOptions) {
            throw "No ribbonOptions provided.";
        }

        this._points = points;
        this._options.points = points;
        this._pathsOptions.push({ options, pathCount: points.length });

        this._initGreasedLine();

        let indiceOffset = 0;
        for (let i = 0, c = 0; i < this._pathsOptions.length; i++) {
            const { options: pathOptions, pathCount } = this._pathsOptions[i];
            const subPoints = points.slice(c, c + pathCount);
            c += pathCount;
            if (pathOptions.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS) {
                indiceOffset = this._preprocess(GreasedLineTools.ToVector3Array(subPoints) as Vector3[][], indiceOffset, pathOptions);
            } else {
                const directionPlanes = GreasedLineRibbonMesh._GetDirectionPlanesFromDirectionsOption(subPoints.length, pathOptions.ribbonOptions!.directions);
                subPoints.forEach((p, idx) => {
                    const pathArray = GreasedLineRibbonMesh._ConvertToRibbonPath(
                        p,
                        pathOptions.ribbonOptions!,
                        this._scene.useRightHandedSystem,
                        directionPlanes ? directionPlanes[idx] : directionPlanes
                    );
                    indiceOffset = this._preprocess(pathArray, indiceOffset, pathOptions);
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

    // private static _GetDirectionPlanes(pointsArray: number[][]) {
    //     const directions = [];
    //     const lastPointIndex = pointsArray[0].length - 3;
    //     for (let i = 0; i < pointsArray.length; i++) {
    //         const points = pointsArray[i];

    //         TmpVectors.Vector3[0].x = points[0];
    //         TmpVectors.Vector3[0].y = points[1];
    //         TmpVectors.Vector3[0].z = points[2];

    //         TmpVectors.Vector3[1].x = points[lastPointIndex];
    //         TmpVectors.Vector3[1].y = points[lastPointIndex + 1];
    //         TmpVectors.Vector3[1].z = points[lastPointIndex + 2];

    //         TmpVectors.Vector3[1].subtractInPlace(TmpVectors.Vector3[0]); // direction

    //         if (TmpVectors.Vector3[1].x > TmpVectors.Vector3[1].y && TmpVectors.Vector3[1].x > TmpVectors.Vector3[1].z) {
    //             directions.push(new Vector3(0, 0, 1));
    //             continue;
    //         }
    //         if (TmpVectors.Vector3[1].y > TmpVectors.Vector3[1].x && TmpVectors.Vector3[1].y > TmpVectors.Vector3[1].z) {
    //             directions.push(new Vector3(1, 0, 0));
    //             continue;
    //         }
    //         directions.push(new Vector3(0, 1, 0));
    //     }

    //     return directions;
    // }

    private static _GetDirectionPlanesFromDirectionsOption(count: number, directions?: Vector3 | Vector3[]) {
        if (!directions) {
            return directions;
        }

        if (Array.isArray(directions)) {
            return directions;
        }

        return new Array(count).fill(directions);
    }

    // private static _GetDirectionPlaneQuaternion(point1: Vector3, point2: Vector3, rightHandedSystem: boolean) {
    //     const direction = point2.subtract(point1).normalize();

    //     return Quaternion.RotationAxis(direction, Math.PI / 2);

    //     // if (direction.x > direction.y && direction.x > direction.z) {
    //     //     // return rightHandedSystem ? GreasedLineRibbonMesh._RightHandedForwardReadOnlyQuaternion : GreasedLineRibbonMesh._LeftHandedForwardReadOnlyQuaternion;
    //     //     return GreasedLineRibbonMesh._LeftReadOnlyQuaternion;
    //     // }
    //     // return GreasedLineRibbonMesh._LeftReadOnlyQuaternion;
    // }

    private static _CreateRibbonVertexData(pathArray: Vector3[][], options: GreasedLineMeshOptions) {
        const numOfPaths = pathArray.length;
        if (numOfPaths < 2) {
            throw "Minimum of two paths are required to create a ribbon.";
        }

        const positions = [];
        const indices = [];

        const path = pathArray[0];
        for (let i = 0; i < path.length; i++) {
            for (let pi = 0; pi < pathArray.length; pi++) {
                const v = pathArray[pi][i];
                positions.push(v.x, v.y, v.z);
            }
        }

        const v: number[] = [1, 0, numOfPaths];
        const doubleSided = options.ribbonOptions?.facesMode === GreasedLineRibbonFacesMode.FACES_MODE_DOUBLE_SIDED ?? false;

        const closePath = options.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS && options.ribbonOptions.closePath;
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
                    indices.push(v[1] + (pi % 2 !== 0 ? numOfPaths : 0), v[0], v[2]);
                    if (doubleSided) {
                        indices.push(v[0], v[1] + (pi % 2 !== 0 ? numOfPaths : 0), v[2]);
                    }
                }
            }
        } else {
            for (let i = 0; i < positions.length / 3 - 3; i += 2) {
                indices.push(i, i + 1, i + 2);
                indices.push(i + 2, i + 1, i + 3);
                if (doubleSided) {
                    indices.push(i + 1, i, i + 2);
                    indices.push(i + 1, i + 2, i + 3);
                }
            }
        }
        if (closePath) {
            let lastIndice = numOfPaths * (path.length - 1);
            for (let pi = 0; pi < numOfPaths - 1; pi++) {
                indices.push(lastIndice, pi + 1, pi);
                indices.push(lastIndice + 1, pi + 1, lastIndice);
                if (doubleSided) {
                    indices.push(pi, pi + 1, lastIndice);
                    indices.push(lastIndice, pi + 1, lastIndice + 1);
                }
                lastIndice++;
            }
        }

        return {
            positions,
            indices,
        };
    }

    private _preprocess(pathArray: Vector3[][], indiceOffset: number, options: GreasedLineMeshOptions) {
        this._paths = pathArray;

        const ribbonVertexData = GreasedLineRibbonMesh._CreateRibbonVertexData(pathArray, options);

        const positions = ribbonVertexData.positions;

        if (!this._options.widths) {
            throw "No width table provided.";
        }

        for (const p of positions) {
            this._vertexPositions.push(p);
        }

        let pathArrayCopy = pathArray;
        if (options.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS && options.ribbonOptions.closePath) {
            pathArrayCopy = [];
            for (let i = 0; i < pathArray.length; i++) {
                const pathCopy = pathArray[i].slice();
                pathCopy.push(pathArray[i][0].clone());
                pathArrayCopy.push(pathCopy);
            }
        }

        this._calculateSegmentLengths(pathArrayCopy);

        const pathArrayLength = pathArrayCopy.length;
        const previousCounters = new Array(pathArrayLength).fill(0);
        let cp = this._colorPointers.length;
        for (let i = 0; i < pathArrayCopy[0].length; i++) {
            let v = 0;
            for (let pi = 0; pi < pathArrayLength; pi++) {
                const counter = previousCounters[pi] + this._vSegmentLengths[pi][i] / this._vTotalLengths[pi];
                this._counters.push(counter);
                this._uvs.push(counter, v); // counter = u
                this._colorPointers.push(cp);

                previousCounters[pi] = counter;
                v += this._uSegmentLengths[i][pi] / this._uTotalLengths[i];
            }

            cp++;
        }

        for (let i = 0, c = 0; i < pathArrayCopy[0].length; i++) {
            const widthLower = this._uSegmentLengths[i][0] / 2;
            const widthUpper = this._uSegmentLengths[i][pathArrayLength - 1] / 2;
            this._ribbonWidths.push(((this._widths[c++] ?? 1) - 1) * widthLower);
            for (let pi = 0; pi < pathArrayLength - 2; pi++) {
                this._ribbonWidths.push(0);
            }
            this._ribbonWidths.push(((this._widths[c++] ?? 1) - 1) * widthUpper);
        }

        const slopes =
            options.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_PATHS
                ? new Array(pathArrayCopy[0].length * pathArrayCopy.length * 6).fill(0)
                : GreasedLineRibbonMesh._CalculateSlopes(pathArrayCopy);
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

    private static _ConvertToRibbonPath(points: number[], ribbonInfo: GreasedLineRibbonOptions, rightHandedSystem: boolean, directionPlane?: Vector3) {
        if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS && !ribbonInfo.width) {
            throw "Width must be specified in GreasedLineRibbonPointsMode.POINTS_MODE_POINTS";
        }
        const path1 = [];
        const path2 = [];
        if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS) {
            const width = ribbonInfo.width! / 2;
            const pointVectors = GreasedLineTools.ToVector3Array(points) as Vector3[];
            for (let i = 0; i < pointVectors.length - (directionPlane ? 0 : 1); i++) {
                const p1 = pointVectors[i];
                const p2 = pointVectors[i + 1];

                let direction: Vector3;
                if (directionPlane) {
                    direction = <Vector3>directionPlane;
                } else {
                    const directionTemp = p2.subtract(p1);
                    // TmpVectors.Vector3[0].x = -directionTemp.y
                    // TmpVectors.Vector3[0].y = directionTemp.x
                    // TmpVectors.Vector3[0].z = directionTemp.z
                    directionTemp.applyRotationQuaternionInPlace(
                        directionTemp.x > directionTemp.y && directionTemp.x > directionTemp.z
                            ? rightHandedSystem
                                ? GreasedLineRibbonMesh._RightHandedForwardReadOnlyQuaternion
                                : GreasedLineRibbonMesh._LeftHandedForwardReadOnlyQuaternion
                            : GreasedLineRibbonMesh._LeftReadOnlyQuaternion
                    );
                    direction = directionTemp.normalize();
                }

                const fatDirection = direction.multiplyByFloats(width, width, width);
                path1.push(p1.add(fatDirection));
                path2.push(p1.subtract(fatDirection));
            }
            if (!directionPlane) {
                path1.push(path1[path1.length - 1]);
                path2.push(path1[path2.length - 1]);
            }
        }
        return [path1, path2];
    }

    // private static _ConvertToRibbonPath2(points: number[], ribbonInfo: GreasedLineRibbonOptions, directionPlane: Vector3) {
    //     if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS && !ribbonInfo.width) {
    //         throw "Width must be specified in GreasedLineRibbonPointsMode.POINTS_MODE_POINTS";
    //     }
    //     const path1 = [];
    //     const path2 = [];
    //     if (ribbonInfo.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS) {
    //         const width = ribbonInfo.width! / 2;
    //         // const direction = ribbonInfo.directions![pointsIndex].multiplyByFloats(width, width, width);
    //         const direction = directionPlane.multiplyByFloats(width, width, width);
    //         const pointVectors = GreasedLineTools.ToVector3Array(points) as Vector3[];
    //         for (const p of pointVectors) {
    //             path1.push(p.add(direction));
    //             path2.push(p.subtract(direction));
    //         }
    //     }
    //     return [path1, path2];
    // }

    /**
     * Clones the GreasedLineRibbonMesh.
     * @param name new line name
     * @param newParent new parent node
     * @returns cloned line
     */
    public clone(name: string = `${this.name}-cloned`, newParent?: Nullable<Node>) {
        const lineOptions = this._createLineOptions();
        const deepCopiedLineOptions: any = {};
        const pathOptionsCloned: any = [];
        DeepCopier.DeepCopy(this._pathsOptions, pathOptionsCloned);
        DeepCopier.DeepCopy(lineOptions, deepCopiedLineOptions, ["instance"]);

        const cloned = new GreasedLineRibbonMesh(name, this._scene, <GreasedLineMeshOptions>deepCopiedLineOptions, pathOptionsCloned);
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
        serializationObject.pathsOptions = this._pathsOptions;
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
        const pathOptions = parsedMesh.pathOptions;
        const result = new GreasedLineRibbonMesh(name, scene, lineOptions, pathOptions);
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
                const l = Math.abs(points[i].subtract(points[i + 1]).lengthSquared()); // it's ok to have lengthSquared() here
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
                const l = uLength.length(); // must be length()
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

    protected _createVertexBuffers() {
        super._createVertexBuffers(this._options.ribbonOptions?.smoothShading);

        console.log("vertices", this._vertexPositions);
        console.log("indices", this._indices);
        console.log("uvs", this._uvs);
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
}
