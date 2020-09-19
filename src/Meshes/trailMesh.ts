import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Nullable } from "../types";
import { Observer } from "../Misc/observable";
import { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { VertexBuffer } from "../Meshes/buffer";
import { VertexData } from "../Meshes/mesh.vertexData";
import { TransformNode } from "../Meshes/transformNode";

/**
 * Class used to create a trail following a mesh
 */
export class TrailMesh extends Mesh {
    private _generator: TransformNode;
    private _autoStart: boolean;
    private _running: boolean;
    private _diameter: number;
    private _length: number;
    private _sectionPolygonPointsCount: number = 4;
    private _sectionVectors: Array<Vector3>;
    private _sectionNormalVectors: Array<Vector3>;
    private _beforeRenderObserver: Nullable<Observer<Scene>>;

    /**
     * @constructor
     * @param name The value used by scene.getMeshByName() to do a lookup.
     * @param generator The mesh or transform node to generate a trail.
     * @param scene The scene to add this mesh to.
     * @param diameter Diameter of trailing mesh. Default is 1.
     * @param length Length of trailing mesh. Default is 60.
     * @param autoStart Automatically start trailing mesh. Default true.
     */
    constructor(name: string, generator: TransformNode, scene: Scene, diameter: number = 1, length: number = 60, autoStart: boolean = true) {
        super(name, scene);

        this._running = false;
        this._autoStart = autoStart;
        this._generator = generator;
        this._diameter = diameter;
        this._length = length;
        this._sectionVectors = [];
        this._sectionNormalVectors = [];
        for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
            this._sectionVectors[i] = Vector3.Zero();
            this._sectionNormalVectors[i] = Vector3.Zero();
        }
        this._createMesh();
    }

    /**
     * "TrailMesh"
     * @returns "TrailMesh"
     */
    public getClassName(): string {
        return "TrailMesh";
    }

    private _createMesh(): void {
        let data: VertexData = new VertexData();
        let positions: Array<number> = [];
        let normals: Array<number> = [];
        let indices: Array<number> = [];
        let meshCenter = Vector3.Zero();
        if (this._generator instanceof AbstractMesh && this._generator._boundingInfo) {
            meshCenter = this._generator._boundingInfo.boundingBox.centerWorld;
        } else {
            meshCenter = this._generator.position;
        }
        let alpha: number = 2 * Math.PI / this._sectionPolygonPointsCount;
        for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
            positions.push(
                meshCenter.x + Math.cos(i * alpha) * this._diameter,
                meshCenter.y + Math.sin(i * alpha) * this._diameter,
                meshCenter.z
            );
        }
        for (let i: number = 1; i <= this._length; i++) {
            for (let j: number = 0; j < this._sectionPolygonPointsCount; j++) {
                positions.push(
                    meshCenter.x + Math.cos(j * alpha) * this._diameter,
                    meshCenter.y + Math.sin(j * alpha) * this._diameter,
                    meshCenter.z
                );
            }
            let l: number = positions.length / 3 - 2 * this._sectionPolygonPointsCount;
            for (let j: number = 0; j < this._sectionPolygonPointsCount - 1; j++) {
                indices.push(
                    l + j,
                    l + j + this._sectionPolygonPointsCount,
                    l + j + this._sectionPolygonPointsCount + 1,
                );
                indices.push(
                    l + j,
                    l + j + this._sectionPolygonPointsCount + 1,
                    l + j + 1
                );
            }
            indices.push(
                l + this._sectionPolygonPointsCount - 1,
                l + this._sectionPolygonPointsCount - 1 + this._sectionPolygonPointsCount,
                l + this._sectionPolygonPointsCount,
            );
            indices.push(
                l + this._sectionPolygonPointsCount - 1,
                l + this._sectionPolygonPointsCount,
                l
            );
        }
        VertexData.ComputeNormals(positions, indices, normals);
        data.positions = positions;
        data.normals = normals;
        data.indices = indices;
        data.applyToMesh(this, true);
        if (this._autoStart) {
            this.start();
        }
    }

    /**
     * Start trailing mesh.
     */
    public start(): void {
        if (!this._running) {
            this._running = true;
            this._beforeRenderObserver = this.getScene().onBeforeRenderObservable.add(() => {
                this.update();
            });
        }
    }

    /**
     * Stop trailing mesh.
     */
    public stop(): void {
        if (this._beforeRenderObserver && this._running) {
            this._running = false;
            this.getScene().onBeforeRenderObservable.remove(this._beforeRenderObserver);
        }
    }

    /**
     * Update trailing mesh geometry.
     */
    public update(): void {
        let positions = this.getVerticesData(VertexBuffer.PositionKind);
        let normals = this.getVerticesData(VertexBuffer.NormalKind);
        let wm = this._generator.getWorldMatrix();
        if (positions && normals) {
            for (let i: number = 3 * this._sectionPolygonPointsCount; i < positions.length; i++) {
                positions[i - 3 * this._sectionPolygonPointsCount] = positions[i] - normals[i] / this._length * this._diameter;
            }
            for (let i: number = 3 * this._sectionPolygonPointsCount; i < normals.length; i++) {
                normals[i - 3 * this._sectionPolygonPointsCount] = normals[i];
            }
            let l: number = positions.length - 3 * this._sectionPolygonPointsCount;
            let alpha: number = 2 * Math.PI / this._sectionPolygonPointsCount;
            for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
                this._sectionVectors[i].copyFromFloats(
                    Math.cos(i * alpha) * this._diameter,
                    Math.sin(i * alpha) * this._diameter,
                    0
                );
                this._sectionNormalVectors[i].copyFromFloats(
                    Math.cos(i * alpha),
                    Math.sin(i * alpha),
                    0
                );
                Vector3.TransformCoordinatesToRef(this._sectionVectors[i], wm, this._sectionVectors[i]);
                Vector3.TransformNormalToRef(this._sectionNormalVectors[i], wm, this._sectionNormalVectors[i]);
            }
            for (let i: number = 0; i < this._sectionPolygonPointsCount; i++) {
                positions[l + 3 * i] = this._sectionVectors[i].x;
                positions[l + 3 * i + 1] = this._sectionVectors[i].y;
                positions[l + 3 * i + 2] = this._sectionVectors[i].z;
                normals[l + 3 * i] = this._sectionNormalVectors[i].x;
                normals[l + 3 * i + 1] = this._sectionNormalVectors[i].y;
                normals[l + 3 * i + 2] = this._sectionNormalVectors[i].z;
            }
            this.updateVerticesData(VertexBuffer.PositionKind, positions, true, false);
            this.updateVerticesData(VertexBuffer.NormalKind, normals, true, false);
        }
    }

    /**
     * Returns a new TrailMesh object.
     * @param name is a string, the name given to the new mesh
     * @param newGenerator use new generator object for cloned trail mesh
     * @returns a new mesh
     */
    public clone(name: string = "", newGenerator: TransformNode): TrailMesh {
        return new TrailMesh(name, (newGenerator === undefined ? this._generator : newGenerator), this.getScene(), this._diameter, this._length, this._autoStart);
    }

    /**
     * Serializes this trail mesh
     * @param serializationObject object to write serialization to
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);
    }

    /**
     * Parses a serialized trail mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the trail mesh in
     * @returns the created trail mesh
     */
    public static Parse(parsedMesh: any, scene: Scene): TrailMesh {
        return new TrailMesh(parsedMesh.name, parsedMesh._generator, scene, parsedMesh._diameter, parsedMesh._length, parsedMesh._autoStart);
    }
}