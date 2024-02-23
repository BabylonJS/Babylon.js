import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import type { Nullable } from "../types";
import type { Observer } from "../Misc/observable";
import type { Scene } from "../scene";
import { Vector3 } from "../Maths/math.vector";
import { VertexBuffer } from "../Buffers/buffer";
import { VertexData } from "../Meshes/mesh.vertexData";
import type { TransformNode } from "../Meshes/transformNode";

Mesh._TrailMeshParser = (parsedMesh: any, scene: Scene) => {
    return TrailMesh.Parse(parsedMesh, scene);
};

/**
 * Class used to create a trail following a mesh
 */
export class TrailMesh extends Mesh {
    /**
     * The diameter of the trail, i.e. the width of the ribbon.
     */
    public diameter: number;

    private _generator: TransformNode;
    private _autoStart: boolean;
    private _running: boolean;
    private _length: number;
    private _sectionPolygonPointsCount: number = 4;
    private _sectionVectors: Array<Vector3>;
    private _sectionNormalVectors: Array<Vector3>;
    private _beforeRenderObserver: Nullable<Observer<Scene>>;

    /**
     * Creates a new TrailMesh.
     * @param name The value used by scene.getMeshByName() to do a lookup.
     * @param generator The mesh or transform node to generate a trail.
     * @param scene The scene to add this mesh to.
     * @param diameter Diameter of trailing mesh. Default is 1.
     * @param length Length of trailing mesh. Default is 60.
     * @param autoStart Automatically start trailing mesh. Default true.
     */
    constructor(name: string, generator: TransformNode, scene?: Scene, diameter: number = 1, length: number = 60, autoStart: boolean = true) {
        super(name, scene);

        this._running = false;
        this._autoStart = autoStart;
        this._generator = generator;
        this.diameter = diameter;
        this._length = length;
        this._sectionVectors = [];
        this._sectionNormalVectors = [];
        for (let i: number = 0; i <= this._sectionPolygonPointsCount; i++) {
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
        const data: VertexData = new VertexData();
        const positions: Array<number> = [];
        const normals: Array<number> = [];
        const indices: Array<number> = [];
        const uvs: Array<number> = [];
        let meshCenter = Vector3.Zero();
        if (this._generator instanceof AbstractMesh && this._generator.hasBoundingInfo) {
            meshCenter = this._generator.getBoundingInfo().boundingBox.centerWorld;
        } else {
            meshCenter = this._generator.position;
        }
        const alpha: number = (2 * Math.PI) / this._sectionPolygonPointsCount;
        for (let i: number = 0; i <= this._sectionPolygonPointsCount; i++) {
            const angle = i !== this._sectionPolygonPointsCount ? i * alpha : 0;
            positions.push(meshCenter.x + Math.cos(angle) * this.diameter, meshCenter.y + Math.sin(angle) * this.diameter, meshCenter.z);
            uvs.push(i / this._sectionPolygonPointsCount, 0);
        }
        for (let i: number = 1; i <= this._length; i++) {
            for (let j: number = 0; j <= this._sectionPolygonPointsCount; j++) {
                const angle = j !== this._sectionPolygonPointsCount ? j * alpha : 0;
                positions.push(meshCenter.x + Math.cos(angle) * this.diameter, meshCenter.y + Math.sin(angle) * this.diameter, meshCenter.z);
                uvs.push(j / this._sectionPolygonPointsCount, i / this._length);
            }
            const l: number = positions.length / 3 - 2 * (this._sectionPolygonPointsCount + 1);
            for (let j: number = 0; j <= this._sectionPolygonPointsCount; j++) {
                indices.push(l + j, l + j + this._sectionPolygonPointsCount, l + j + this._sectionPolygonPointsCount + 1);
                indices.push(l + j, l + j + this._sectionPolygonPointsCount + 1, l + j + 1);
            }
        }
        VertexData.ComputeNormals(positions, indices, normals);
        data.positions = positions;
        data.normals = normals;
        data.indices = indices;
        data.uvs = uvs;
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
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const normals = this.getVerticesData(VertexBuffer.NormalKind);
        const wm = this._generator.getWorldMatrix();
        if (positions && normals) {
            for (let i: number = 3 * (this._sectionPolygonPointsCount + 1); i < positions.length; i++) {
                positions[i - 3 * (this._sectionPolygonPointsCount + 1)] = positions[i] - (normals[i] / this._length) * this.diameter;
            }
            for (let i: number = 3 * (this._sectionPolygonPointsCount + 1); i < normals.length; i++) {
                normals[i - 3 * (this._sectionPolygonPointsCount + 1)] = normals[i];
            }
            const l: number = positions.length - 3 * (this._sectionPolygonPointsCount + 1);
            const alpha: number = (2 * Math.PI) / this._sectionPolygonPointsCount;
            for (let i: number = 0; i <= this._sectionPolygonPointsCount; i++) {
                const angle = i !== this._sectionPolygonPointsCount ? i * alpha : 0;
                this._sectionVectors[i].copyFromFloats(Math.cos(angle) * this.diameter, Math.sin(angle) * this.diameter, 0);
                this._sectionNormalVectors[i].copyFromFloats(Math.cos(angle), Math.sin(angle), 0);
                Vector3.TransformCoordinatesToRef(this._sectionVectors[i], wm, this._sectionVectors[i]);
                Vector3.TransformNormalToRef(this._sectionNormalVectors[i], wm, this._sectionNormalVectors[i]);
            }
            for (let i: number = 0; i <= this._sectionPolygonPointsCount; i++) {
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
        return new TrailMesh(name, newGenerator ?? this._generator, this.getScene(), this.diameter, this._length, this._autoStart);
    }

    /**
     * Serializes this trail mesh
     * @param serializationObject object to write serialization to
     */
    public serialize(serializationObject: any): void {
        super.serialize(serializationObject);

        serializationObject.generatorId = this._generator.id;
    }

    /**
     * Parses a serialized trail mesh
     * @param parsedMesh the serialized mesh
     * @param scene the scene to create the trail mesh in
     * @returns the created trail mesh
     */
    public static Parse(parsedMesh: any, scene: Scene): TrailMesh {
        const generator = scene.getLastMeshById(parsedMesh.generatorId) ?? scene.getLastTransformNodeById(parsedMesh.generatorId);

        if (!generator) {
            throw new Error("TrailMesh: generator not found with ID " + parsedMesh.generatorId);
        }

        return new TrailMesh(parsedMesh.name, generator, scene, parsedMesh.diameter ?? parsedMesh._diameter, parsedMesh._length, parsedMesh._autoStart);
    }
}
