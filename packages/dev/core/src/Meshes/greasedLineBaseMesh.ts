import type { Scene } from "../scene";
import type { IGreasedLineMaterial } from "../Materials/greasedLinePluginMaterial";
import { GreasedLinePluginMaterial } from "../Materials/greasedLinePluginMaterial";
import { Mesh } from "./mesh";
import { Buffer } from "../Buffers/buffer";
import type { Vector3 } from "../Maths/math.vector";
import { VertexData } from "./mesh.vertexData";
import { DeepCopier } from "../Misc/deepCopier";
import { GreasedLineSimpleMaterial } from "../Materials/greasedLineSimpleMaterial";
import type { Engine } from "../Engines/engine";

export enum GreasedLineRibbonPointsMode {
    POINTS_MODE_POINTS = 0,
    POINTS_MODE_PATHS = 1,
}

export type GreasedLineRibbonOptions =
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
     * Each line segmment (from point to point) can have it's width multiplier. Final width = widths[segmentIdx] * width.
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
    uvs?: number[];
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
    protected _vertexPositions: number[];
    protected _indices: number[];
    protected _uvs: number[];
    protected _points: number[][];
    protected _offsets: number[];
    protected _colorPointers: number[];
    protected _widths: number[];
    protected _halfWidth: number;

    protected _offsetsBuffer?: Buffer;
    protected _widthsBuffer?: Buffer;
    protected _colorPointersBuffer?: Buffer;

    protected _lazy = false;
    protected _updatable = false;

    protected _engine: Engine;

    constructor(public readonly name: string, scene: Scene, protected _options: GreasedLineMeshOptions) {
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
        this._halfWidth = _options.ribbonOptions?.pointsMode === GreasedLineRibbonPointsMode.POINTS_MODE_POINTS ? (_options.ribbonOptions.width ?? 0.1) / 2 : 0.05;

    }

    /**
     * "GreasedLineMesh"
     * @returns "GreasedLineMesh"
     */
    public getClassName(): string {
        return "GreasedLineMesh";
    }

    protected abstract _setPoints(points: number[][]): void;
    protected abstract _updateWidths(): void;

    protected _updateColorPointers() {
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
     * Sets line points and rerenders the line.
     * @param points points table
     */
    public setPoints(points: number[][]) {
        this._points = points;
        this._updateWidths();
        this._updateColorPointers();
        this._setPoints(points);
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

    protected _createVertexBuffers() {
        const vertexData = new VertexData();
        vertexData.positions = this._vertexPositions;
        vertexData.indices = this._indices;
        vertexData.uvs = this._uvs;
        vertexData.applyToMesh(this, this._options.updatable);
    }

    protected _createOffsetsBuffer(offsets: number[]) {
        const engine = this._scene.getEngine();

        const offsetBuffer = new Buffer(engine, offsets, this._updatable, 3);
        this.setVerticesBuffer(offsetBuffer.createVertexBuffer("grl_offsets", 0, 3));
        this._offsetsBuffer = offsetBuffer;
    }
}
