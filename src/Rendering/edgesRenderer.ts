import { Nullable } from "../types";
import { VertexBuffer } from "../Meshes/buffer";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { LinesMesh, InstancedLinesMesh } from "../Meshes/linesMesh";
import { Vector3, TmpVectors, Matrix } from "../Maths/math.vector";
import { IDisposable, Scene } from "../scene";
import { Observer } from "../Misc/observable";
import { Effect } from "../Materials/effect";
import { Material } from "../Materials/material";
import { ShaderMaterial } from "../Materials/shaderMaterial";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";
import { Node } from "../node";

import "../Shaders/line.fragment";
import "../Shaders/line.vertex";
import { DataBuffer } from '../Meshes/dataBuffer';
import { SmartArray } from '../Misc/smartArray';

declare module "../scene" {
    export interface Scene {
        /** @hidden */
        _edgeRenderLineShader: Nullable<ShaderMaterial>;
    }
}

declare module "../Meshes/abstractMesh" {
    export interface AbstractMesh {
        /**
         * Gets the edgesRenderer associated with the mesh
         */
        edgesRenderer: Nullable<EdgesRenderer>;
    }
}
AbstractMesh.prototype.disableEdgesRendering = function(): AbstractMesh {
    if (this._edgesRenderer) {
        this._edgesRenderer.dispose();
        this._edgesRenderer = null;
    }
    return this;
};

AbstractMesh.prototype.enableEdgesRendering = function(epsilon = 0.95, checkVerticesInsteadOfIndices = false): AbstractMesh {
    this.disableEdgesRendering();
    this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
    return this;
};

Object.defineProperty(AbstractMesh.prototype, "edgesRenderer", {
    get: function(this: AbstractMesh) {
        return this._edgesRenderer;
    },
    enumerable: true,
    configurable: true
});

declare module "../Meshes/linesMesh" {
    export interface LinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the currentAbstractMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): AbstractMesh;
    }
}
LinesMesh.prototype.enableEdgesRendering = function(epsilon = 0.95, checkVerticesInsteadOfIndices = false): AbstractMesh {
    this.disableEdgesRendering();
    this._edgesRenderer = new LineEdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
    return this;
};

declare module "../Meshes/linesMesh" {
    export interface InstancedLinesMesh {
        /**
         * Enables the edge rendering mode on the mesh.
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the current InstancedLinesMesh
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean): InstancedLinesMesh;
    }
}

InstancedLinesMesh.prototype.enableEdgesRendering = function(epsilon = 0.95, checkVerticesInsteadOfIndices = false): InstancedLinesMesh {
    LinesMesh.prototype.enableEdgesRendering.apply(this, arguments);
    return this;
};

/**
 * FaceAdjacencies Helper class to generate edges
 */
class FaceAdjacencies {
    public edges = new Array<number>();
    public p0: Vector3;
    public p1: Vector3;
    public p2: Vector3;
    public edgesConnectedCount = 0;
}

/**
 * Defines the minimum contract an Edges renderer should follow.
 */
export interface IEdgesRenderer extends IDisposable {
    /**
     * Gets or sets a boolean indicating if the edgesRenderer is active
     */
    isEnabled: boolean;

    /**
     * Renders the edges of the attached mesh,
     */
    render(): void;

    /**
     * Checks wether or not the edges renderer is ready to render.
     * @return true if ready, otherwise false.
     */
    isReady(): boolean;

    /**
     * List of instances to render in case the source mesh has instances
     */
    customInstances: SmartArray<Matrix>;
}

/**
 * This class is used to generate edges of the mesh that could then easily be rendered in a scene.
 */
export class EdgesRenderer implements IEdgesRenderer {

    /**
     * Define the size of the edges with an orthographic camera
     */
    public edgesWidthScalerForOrthographic = 1000.0;

    /**
     * Define the size of the edges with a perspective camera
     */
    public edgesWidthScalerForPerspective = 50.0;

    protected _source: AbstractMesh;
    protected _linesPositions = new Array<number>();
    protected _linesNormals = new Array<number>();
    protected _linesIndices = new Array<number>();
    protected _epsilon: number;
    protected _indicesCount: number;

    protected _lineShader: ShaderMaterial;
    protected _ib: DataBuffer;
    protected _buffers: { [key: string]: Nullable<VertexBuffer> } = {};
    protected _buffersForInstances: { [key: string]: Nullable<VertexBuffer> } = {};
    protected _checkVerticesInsteadOfIndices = false;

    private _meshRebuildObserver: Nullable<Observer<AbstractMesh>>;
    private _meshDisposeObserver: Nullable<Observer<Node>>;

    /** Gets or sets a boolean indicating if the edgesRenderer is active */
    public isEnabled = true;

    public customInstances = new SmartArray<Matrix>(32);

    private static GetShader(scene: Scene): ShaderMaterial {
        if (!scene._edgeRenderLineShader) {
            const shader = new ShaderMaterial("lineShader", scene, "line",
                {
                    attributes: ["position", "normal"],
                    uniforms: ["world", "viewProjection", "color", "width", "aspectRatio"]
                });

            shader.disableDepthWrite = true;
            shader.backFaceCulling = false;

            scene._edgeRenderLineShader = shader;
        }

        return scene._edgeRenderLineShader;
    }

    /**
     * Creates an instance of the EdgesRenderer. It is primarily use to display edges of a mesh.
     * Beware when you use this class with complex objects as the adjacencies computation can be really long
     * @param  source Mesh used to create edges
     * @param  epsilon sum of angles in adjacency to check for edge
     * @param  checkVerticesInsteadOfIndices bases the edges detection on vertices vs indices
     * @param  generateEdgesLines - should generate Lines or only prepare resources.
     */
    constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false, generateEdgesLines = true) {
        this._source = source;
        this._checkVerticesInsteadOfIndices = checkVerticesInsteadOfIndices;

        this._epsilon = epsilon;

        this._prepareRessources();
        if (generateEdgesLines) {
            this._generateEdgesLines();
        }

        this._meshRebuildObserver = this._source.onRebuildObservable.add(() => {
            this._rebuild();
        });

        this._meshDisposeObserver = this._source.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    protected _prepareRessources(): void {
        if (this._lineShader) {
            return;
        }

        this._lineShader = EdgesRenderer.GetShader(this._source.getScene());
    }

    /** @hidden */
    public _rebuild(): void {
        var buffer = this._buffers[VertexBuffer.PositionKind];
        if (buffer) {
            buffer._rebuild();
        }

        buffer = this._buffers[VertexBuffer.NormalKind];
        if (buffer) {
            buffer._rebuild();
        }

        var scene = this._source.getScene();
        var engine = scene.getEngine();
        this._ib = engine.createIndexBuffer(this._linesIndices);
    }

    /**
     * Releases the required resources for the edges renderer
     */
    public dispose(): void {
        this._source.onRebuildObservable.remove(this._meshRebuildObserver);
        this._source.onDisposeObservable.remove(this._meshDisposeObserver);

        var buffer = this._buffers[VertexBuffer.PositionKind];
        if (buffer) {
            buffer.dispose();
            this._buffers[VertexBuffer.PositionKind] = null;
        }
        buffer = this._buffers[VertexBuffer.NormalKind];
        if (buffer) {
            buffer.dispose();
            this._buffers[VertexBuffer.NormalKind] = null;
        }

        if (this._ib) {
            this._source.getScene().getEngine()._releaseBuffer(this._ib);
        }
        this._lineShader.dispose();
    }

    protected _processEdgeForAdjacencies(pa: number, pb: number, p0: number, p1: number, p2: number): number {
        if (pa === p0 && pb === p1 || pa === p1 && pb === p0) {
            return 0;
        }

        if (pa === p1 && pb === p2 || pa === p2 && pb === p1) {
            return 1;
        }

        if (pa === p2 && pb === p0 || pa === p0 && pb === p2) {
            return 2;
        }

        return -1;
    }

    protected _processEdgeForAdjacenciesWithVertices(pa: Vector3, pb: Vector3, p0: Vector3, p1: Vector3, p2: Vector3): number {
        if (pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p1) || pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p0)) {
            return 0;
        }

        if (pa.equalsWithEpsilon(p1) && pb.equalsWithEpsilon(p2) || pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p1)) {
            return 1;
        }

        if (pa.equalsWithEpsilon(p2) && pb.equalsWithEpsilon(p0) || pa.equalsWithEpsilon(p0) && pb.equalsWithEpsilon(p2)) {
            return 2;
        }

        return -1;
    }

    /**
     * Checks if the pair of p0 and p1 is en edge
     * @param faceIndex
     * @param edge
     * @param faceNormals
     * @param  p0
     * @param  p1
     * @private
     */
    protected _checkEdge(faceIndex: number, edge: number, faceNormals: Array<Vector3>, p0: Vector3, p1: Vector3): void {
        var needToCreateLine;

        if (edge === undefined) {
            needToCreateLine = true;
        } else {
            var dotProduct = Vector3.Dot(faceNormals[faceIndex], faceNormals[edge]);

            needToCreateLine = dotProduct < this._epsilon;
        }

        if (needToCreateLine) {
            this.createLine(p0, p1, this._linesPositions.length / 3);
        }
    }

    /**
     * push line into the position, normal and index buffer
     * @protected
     */
    protected createLine(p0: Vector3, p1: Vector3, offset: number) {
        // Positions
        this._linesPositions.push(
            p0.x, p0.y, p0.z,
            p0.x, p0.y, p0.z,
            p1.x, p1.y, p1.z,
            p1.x, p1.y, p1.z
        );

        // Normals
        this._linesNormals.push(
            p1.x, p1.y, p1.z, -1,
            p1.x, p1.y, p1.z, 1,
            p0.x, p0.y, p0.z, -1,
            p0.x, p0.y, p0.z, 1
        );

        // Indices
        this._linesIndices.push(
            offset, offset + 1, offset + 2,
            offset, offset + 2, offset + 3
        );
    }

    /**
     * Generates lines edges from adjacencjes
     * @private
     */
    _generateEdgesLines(): void {
        var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
        var indices = this._source.getIndices();

        if (!indices || !positions) {
            return;
        }

        // First let's find adjacencies
        var adjacencies = new Array<FaceAdjacencies>();
        var faceNormals = new Array<Vector3>();
        var index: number;
        var faceAdjacencies: FaceAdjacencies;

        // Prepare faces
        for (index = 0; index < indices.length; index += 3) {
            faceAdjacencies = new FaceAdjacencies();
            var p0Index = indices[index];
            var p1Index = indices[index + 1];
            var p2Index = indices[index + 2];

            faceAdjacencies.p0 = new Vector3(positions[p0Index * 3], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
            faceAdjacencies.p1 = new Vector3(positions[p1Index * 3], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);
            faceAdjacencies.p2 = new Vector3(positions[p2Index * 3], positions[p2Index * 3 + 1], positions[p2Index * 3 + 2]);
            var faceNormal = Vector3.Cross(faceAdjacencies.p1.subtract(faceAdjacencies.p0), faceAdjacencies.p2.subtract(faceAdjacencies.p1));

            faceNormal.normalize();

            faceNormals.push(faceNormal);
            adjacencies.push(faceAdjacencies);
        }

        // Scan
        for (index = 0; index < adjacencies.length; index++) {
            faceAdjacencies = adjacencies[index];

            for (var otherIndex = index + 1; otherIndex < adjacencies.length; otherIndex++) {
                var otherFaceAdjacencies = adjacencies[otherIndex];

                if (faceAdjacencies.edgesConnectedCount === 3) { // Full
                    break;
                }

                if (otherFaceAdjacencies.edgesConnectedCount === 3) { // Full
                    continue;
                }

                var otherP0 = indices[otherIndex * 3];
                var otherP1 = indices[otherIndex * 3 + 1];
                var otherP2 = indices[otherIndex * 3 + 2];

                for (var edgeIndex = 0; edgeIndex < 3; edgeIndex++) {
                    var otherEdgeIndex: number = 0;

                    if (faceAdjacencies.edges[edgeIndex] !== undefined) {
                        continue;
                    }

                    switch (edgeIndex) {
                        case 0:
                            if (this._checkVerticesInsteadOfIndices) {
                                otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p0, faceAdjacencies.p1, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                            } else {
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3], indices[index * 3 + 1], otherP0, otherP1, otherP2);
                            }
                            break;
                        case 1:
                            if (this._checkVerticesInsteadOfIndices) {
                                otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p1, faceAdjacencies.p2, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                            } else {
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 1], indices[index * 3 + 2], otherP0, otherP1, otherP2);
                            }
                            break;
                        case 2:
                            if (this._checkVerticesInsteadOfIndices) {
                                otherEdgeIndex = this._processEdgeForAdjacenciesWithVertices(faceAdjacencies.p2, faceAdjacencies.p0, otherFaceAdjacencies.p0, otherFaceAdjacencies.p1, otherFaceAdjacencies.p2);
                            } else {
                                otherEdgeIndex = this._processEdgeForAdjacencies(indices[index * 3 + 2], indices[index * 3], otherP0, otherP1, otherP2);
                            }
                            break;
                    }

                    if (otherEdgeIndex === -1) {
                        continue;
                    }

                    faceAdjacencies.edges[edgeIndex] = otherIndex;
                    otherFaceAdjacencies.edges[otherEdgeIndex] = index;

                    faceAdjacencies.edgesConnectedCount++;
                    otherFaceAdjacencies.edgesConnectedCount++;

                    if (faceAdjacencies.edgesConnectedCount === 3) {
                        break;
                    }
                }
            }
        }

        // Create lines
        for (index = 0; index < adjacencies.length; index++) {
            // We need a line when a face has no adjacency on a specific edge or if all the adjacencies has an angle greater than epsilon
            var current = adjacencies[index];

            this._checkEdge(index, current.edges[0], faceNormals, current.p0, current.p1);
            this._checkEdge(index, current.edges[1], faceNormals, current.p1, current.p2);
            this._checkEdge(index, current.edges[2], faceNormals, current.p2, current.p0);
        }

        // Merge into a single mesh
        var engine = this._source.getScene().getEngine();

        this._buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, this._linesPositions, VertexBuffer.PositionKind, false);
        this._buffers[VertexBuffer.NormalKind] = new VertexBuffer(engine, this._linesNormals, VertexBuffer.NormalKind, false, false, 4);

        this._buffersForInstances[VertexBuffer.PositionKind] = this._buffers[VertexBuffer.PositionKind];
        this._buffersForInstances[VertexBuffer.NormalKind] = this._buffers[VertexBuffer.NormalKind];

        this._ib = engine.createIndexBuffer(this._linesIndices);

        this._indicesCount = this._linesIndices.length;
    }

    /**
     * Checks wether or not the edges renderer is ready to render.
     * @return true if ready, otherwise false.
     */
    public isReady(): boolean {
        return this._lineShader.isReady(this._source, (this._source.hasInstances && this.customInstances.length > 0) || this._source.hasThinInstances);
    }

    /**
     * Renders the edges of the attached mesh,
     */
    public render(): void {
        var scene = this._source.getScene();

        if (!this.isReady() || !scene.activeCamera) {
            return;
        }

        var engine = scene.getEngine();
        this._lineShader._preBind();

        if (this._source.edgesColor.a !== 1) {
            engine.setAlphaMode(Constants.ALPHA_COMBINE);
        } else {
            engine.setAlphaMode(Constants.ALPHA_DISABLE);
        }

        const hasInstances = this._source.hasInstances && this.customInstances.length > 0;
        const useBuffersWithInstances = hasInstances || this._source.hasThinInstances;

        let instanceCount = 0;

        if (useBuffersWithInstances) {
            this._buffersForInstances["world0"] = (this._source as Mesh).getVertexBuffer("world0");
            this._buffersForInstances["world1"] = (this._source as Mesh).getVertexBuffer("world1");
            this._buffersForInstances["world2"] = (this._source as Mesh).getVertexBuffer("world2");
            this._buffersForInstances["world3"] = (this._source as Mesh).getVertexBuffer("world3");

            if (hasInstances) {
                let instanceStorage = (this._source as Mesh)._instanceDataStorage;

                instanceCount = this.customInstances.length;

                if (!instanceStorage.isFrozen) {
                    let offset = 0;

                    for (let i = 0; i < instanceCount; ++i) {
                        this.customInstances.data[i].copyToArray(instanceStorage.instancesData, offset);
                        offset += 16;
                    }

                    instanceStorage.instancesBuffer!.updateDirectly(instanceStorage.instancesData, 0, instanceCount);
                }
            } else {
                instanceCount = (this._source as Mesh).thinInstanceCount;
            }
        }

        // VBOs
        engine.bindBuffers(useBuffersWithInstances ? this._buffersForInstances : this._buffers, this._ib, <Effect>this._lineShader.getEffect());

        scene.resetCachedMaterial();
        this._lineShader.setColor4("color", this._source.edgesColor);

        if (scene.activeCamera.mode === Camera.ORTHOGRAPHIC_CAMERA) {
            this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForOrthographic);
        } else {
            this._lineShader.setFloat("width", this._source.edgesWidth / this.edgesWidthScalerForPerspective);
        }

        this._lineShader.setFloat("aspectRatio", engine.getAspectRatio(scene.activeCamera));
        this._lineShader.bind(this._source.getWorldMatrix());

        // Draw order
        engine.drawElementsType(Material.TriangleFillMode, 0, this._indicesCount, instanceCount);
        this._lineShader.unbind();

        this.customInstances.reset();
    }
}

/**
 * LineEdgesRenderer for LineMeshes to remove unnecessary triangulation
 */
export class LineEdgesRenderer extends EdgesRenderer {

    /**
     * This constructor turns off auto generating edges line in Edges Renderer to make it here.
     * @param  source LineMesh used to generate edges
     * @param  epsilon not important (specified angle for edge detection)
     * @param  checkVerticesInsteadOfIndices not important for LineMesh
     */
    constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false) {
        super(source, epsilon, checkVerticesInsteadOfIndices, false);
        this._generateEdgesLines();
    }

    /**
     * Generate edges for each line in LinesMesh. Every Line should be rendered as edge.
     */
    _generateEdgesLines(): void {
        var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
        var indices = this._source.getIndices();

        if (!indices || !positions) {
            return;
        }

        const p0 = TmpVectors.Vector3[0];
        const p1 = TmpVectors.Vector3[1];
        const len = indices.length - 1;
        for (let i = 0, offset = 0; i < len; i += 2, offset += 4) {
            Vector3.FromArrayToRef(positions, 3 * indices[i], p0);
            Vector3.FromArrayToRef(positions, 3 * indices[i + 1], p1);
            this.createLine(p0, p1, offset);
        }

        // Merge into a single mesh
        var engine = this._source.getScene().getEngine();

        this._buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, this._linesPositions, VertexBuffer.PositionKind, false);
        this._buffers[VertexBuffer.NormalKind] = new VertexBuffer(engine, this._linesNormals, VertexBuffer.NormalKind, false, false, 4);

        this._ib = engine.createIndexBuffer(this._linesIndices);

        this._indicesCount = this._linesIndices.length;
    }
}
