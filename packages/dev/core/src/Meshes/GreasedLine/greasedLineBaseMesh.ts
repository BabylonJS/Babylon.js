import type { Scene } from "../../scene";
import type { IGreasedLineMaterial } from "../../Materials/GreasedLine/greasedLineMaterialInterfaces";
import { GreasedLinePluginMaterial } from "../../Materials/GreasedLine/greasedLinePluginMaterial";
import { Mesh } from "../mesh";
import { Buffer } from "../../Buffers/buffer";
import type { Vector3 } from "../../Maths/math.vector";
import { VertexData } from "../mesh.vertexData";
import { DeepCopier } from "../../Misc/deepCopier";
import { GreasedLineSimpleMaterial } from "../../Materials/GreasedLine/greasedLineSimpleMaterial";
import type { Engine } from "../../Engines/engine";
import type { FloatArray, IndicesArray } from "../../types";

/**
 * In POINTS_MODE_POINTS every array of points will become the center (backbone) of the ribbon. The ribbon will be expanded by `width / 2` to `+direction` and `-direction` as well.
 * In POINTS_MODE_PATHS every array of points specifies an edge. These will be used to build one ribbon.
 */
export enum GreasedLineRibbonPointsMode {
    POINTS_MODE_POINTS = 0,
    POINTS_MODE_PATHS = 1,
}

/**
 * FACES_MODE_SINGLE_SIDED single sided with back face culling. Default value.
 * FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING single sided without back face culling. Sets backFaceCulling = false on the material so it affects all line ribbons added to the line ribbon instance.
 * FACES_MODE_DOUBLE_SIDED extra back faces are created. This doubles the amount of faces of the mesh.
 */
export enum GreasedLineRibbonFacesMode {
    FACES_MODE_SINGLE_SIDED = 0,
    FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING = 1,
    FACES_MODE_DOUBLE_SIDED = 2,
}

/**
 * Only with POINTS_MODE_PATHS.
 * AUTO_DIRECTIONS_FROM_FIRST_SEGMENT sets the direction (slope) of the ribbon from the direction of the first line segment. Recommended.
 * AUTO_DIRECTIONS_FROM_ALL_SEGMENTS in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments. Slow method.
 * AUTO_DIRECTIONS_ENHANCED in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments using a more sophisitcaed algorithm. Slowest method.
 * AUTO_DIRECTIONS_FACE_TO in this mode the direction (slope) will be calculated for each line segment according to the direction vector between each point of the line segments and a direction (face-to) vector specified in direction. The resulting line will face to the direction of this face-to vector.
 * AUTO_DIRECTIONS_NONE you have to set the direction (slope) manually. Recommended.
 */
export enum GreasedLineRibbonAutoDirectionMode {
    AUTO_DIRECTIONS_FROM_FIRST_SEGMENT = 0,
    AUTO_DIRECTIONS_FROM_ALL_SEGMENTS = 1,
    AUTO_DIRECTIONS_ENHANCED = 2,
    AUTO_DIRECTIONS_FACE_TO = 3,
    AUTO_DIRECTIONS_NONE = 99,
}

export type GreasedLineRibbonOptions = {
    /**
     * Defines how the points are processed.
     * In GreasedLineRibbonPointsMode.POINTS_MODE_POINTS every array of points will become the center of the ribbon. The ribbon will be expanded by width/2 to +direction and -direction as well.
     * In GreasedLineRibbonPointsMode.POINTS_MODE_PATHS every array of points is one path. These will be used to buuid one ribbon.
     */
    pointsMode?: GreasedLineRibbonPointsMode;
    /**
     * Normalized directions of the slopes of the non camera facing lines.
     */
    directions?: Vector3[] | Vector3;
    /**
     * Defines the calculation mode of the directions which the line will be thickened to.
     */
    directionsAutoMode?: GreasedLineRibbonAutoDirectionMode;
    /**
     * Width of the ribbon.
     */
    width?: number;
    /**
     * Controls how the faces are created.
     * GreasedLineRibbonFacesMode.FACES_MODE_SINGLE_SIDED = single sided with back face culling. Default value.
     * GreasedLineRibbonFacesMode.FACES_MODE_SINGLE_SIDED_NO_BACKFACE_CULLING = single sided without back face culling
     * GreasedLineRibbonFacesMode.FACES_MODE_DOUBLE_SIDED = extra back faces are created. This doubles the amount of faces of the mesh.
     */
    facesMode?: GreasedLineRibbonFacesMode;
    /**
     * If true, the path will be closed.
     */
    closePath?: boolean;
    /**
     * If true, normals will be computed when creating the vertex buffers.
     * This results to smooth shading of the mesh.
     */
    smoothShading?: boolean;
};

export type GreasedLinePoints = Vector3[] | Vector3[][] | Float32Array | Float32Array[] | number[][] | number[];

/**
 * Options for creating a GreasedLineMesh
 */
export interface GreasedLineMeshOptions {
    /**
     * Points of the line.
     */
    points: GreasedLinePoints;
    /**
     * Each line segment (from point to point) can have it's width multiplier. Final width = widths[segmentIdx] * width.
     * Defaults to empty array.
     */
    widths?: number[];
    /**
     * If instance is specified, lines are added to the specified instance.
     * Defaults to undefined.
     */
    instance?: GreasedLineBaseMesh;
    /**
     * You can manually set the color pointers so you can control which segment/part
     * will use which color from the colors material option
     */
    colorPointers?: number[];
    /**
     * UVs for the mesh
     */
    uvs?: FloatArray;
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
    /**
     * The options for the ribbon which will be used as a line.
     * If this option is set the line switches automatically to a non camera facing mode.
     */
    ribbonOptions?: GreasedLineRibbonOptions;
}

/**
 * GreasedLineBaseMesh
 */
export abstract class GreasedLineBaseMesh extends Mesh {
    protected _vertexPositions: FloatArray;
    protected _indices: IndicesArray;
    protected _uvs: FloatArray;
    protected _points: number[][];
    protected _offsets: number[];
    protected _colorPointers: number[];
    protected _widths: number[];

    protected _offsetsBuffer?: Buffer;
    protected _widthsBuffer?: Buffer;
    protected _colorPointersBuffer?: Buffer;

    protected _lazy = false;
    protected _updatable = false;

    protected _engine: Engine;

    constructor(
        public readonly name: string,
        scene: Scene,
        protected _options: GreasedLineMeshOptions
    ) {
        super(name, scene, null, null, false, false);

        this._engine = scene.getEngine();

        this._lazy = _options.lazy ?? false;
        this._updatable = _options.updatable ?? false;

        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
        this._points = [];
        this._colorPointers = _options.colorPointers ?? [];
        this._widths = _options.widths ?? new Array(_options.points.length).fill(1);
    }

    /**
     * "GreasedLineMesh"
     * @returns "GreasedLineMesh"
     */
    public getClassName(): string {
        return "GreasedLineMesh";
    }

    protected abstract _setPoints(points: number[][], options?: GreasedLineMeshOptions): void;
    protected abstract _updateColorPointers(): void;
    protected abstract _updateWidths(): void;

    protected _updateWidthsWithValue(defaulValue: number) {
        let pointCount = 0;
        for (const points of this._points) {
            pointCount += points.length;
        }
        const countDiff = (pointCount / 3) * 2 - this._widths.length;
        for (let i = 0; i < countDiff; i++) {
            this._widths.push(defaulValue);
        }
    }

    /**
     * Updated a lazy line. Rerenders the line and updates boundinfo as well.
     */
    public updateLazy() {
        this._setPoints(this._points);
        if (!this._options.colorPointers) {
            this._updateColorPointers();
        }
        this._createVertexBuffers(this._options.ribbonOptions?.smoothShading);
        this.refreshBoundingInfo();

        this.greasedLineMaterial?.updateLazy();
    }

    /**
     * Adds new points to the line. It doesn't rerenders the line if in lazy mode.
     * @param points points table
     * @param options optional options
     */
    public addPoints(points: number[][], options?: GreasedLineMeshOptions) {
        for (const p of points) {
            this._points.push(p);
        }

        if (!this._lazy) {
            this.setPoints(this._points, options);
        }
    }

    /**
     * Dispose the line and it's resources
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false) {
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    /**
     * @returns true if the mesh was created in lazy mode
     */
    public isLazy(): boolean {
        return this._lazy;
    }

    /**
     * Returns the UVs
     */
    get uvs() {
        return this._uvs;
    }

    /**
     * Sets the UVs
     * @param uvs the UVs
     */
    set uvs(uvs: FloatArray) {
        this._uvs = uvs instanceof Float32Array ? uvs : new Float32Array(uvs);
        this._createVertexBuffers();
    }

    /**
     * Returns the points offsets
     * Return the points offsets
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
            this._offsetsBuffer.update(offsets);
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
     * Sets line points and rerenders the line.
     * @param points points table
     * @param options optional options
     */
    public setPoints(points: number[][], options?: GreasedLineMeshOptions) {
        this._points = points;
        this._updateWidths();
        if (!options?.colorPointers) {
            this._updateColorPointers();
        }
        this._setPoints(points, options);
    }

    protected _initGreasedLine() {
        this._vertexPositions = [];
        this._indices = [];
        this._uvs = [];
    }

    protected _createLineOptions() {
        const lineOptions: GreasedLineMeshOptions = {
            points: this._points,
            colorPointers: this._colorPointers,
            lazy: this._lazy,
            updatable: this._updatable,
            uvs: this._uvs,
            widths: this._widths,
            ribbonOptions: this._options.ribbonOptions,
        };
        return lineOptions;
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

    protected _createVertexBuffers(computeNormals = false) {
        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        if (computeNormals) {
            vertexData.normals = [];
            VertexData.ComputeNormals(this._vertexPositions, this._indices, vertexData.normals);
        }
        vertexData.applyToMesh(this, this._options.updatable);
        return vertexData;
    }

    protected _createOffsetsBuffer(offsets: number[]) {
        const engine = this._scene.getEngine();

        const offsetBuffer = new Buffer(engine, offsets, this._updatable, 3);
        this.setVerticesBuffer(offsetBuffer.createVertexBuffer("grl_offsets", 0, 3));
        this._offsetsBuffer = offsetBuffer;
    }
}
