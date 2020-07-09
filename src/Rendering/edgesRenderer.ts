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

AbstractMesh.prototype.enableEdgesRendering = function(epsilon = 0.95, checkVerticesInsteadOfIndices = false, options?: IEdgesRendererOptions): AbstractMesh {
    this.disableEdgesRendering();
    this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices, true, options);
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
 * Defines the additional options of the edges renderer
 */
export interface IEdgesRendererOptions {
    /**
     * Gets or sets a boolean indicating that the alternate edge finder algorithm must be used
     */
    useAlternateEdgeFinder?: boolean;

    /**
     * Gets or sets a boolean indicating that the vertex merger fast processing must be used.
     * If not defined, the default value is true.
     * You should normally leave it undefined (or set it to true), except if you see some artifacts in the edges rendering (can happen with complex geometries)
     * This option is used only if useAlternateEdgeFinder = true
     */
    useFastVertexMerger?: boolean;

    /**
     * During edges processing, the vertices are merged if they are close enough: epsilonVertexMerge is the limit whithin which vertices are considered to be equal.
     * The default value is 1e-6
     * This option is used only if useAlternateEdgeFinder = true
     */
    epsilonVertexMerge?: number;

    /**
     * Gets or sets a boolean indicating that tessellation should be applied before finding the edges. You may need to activate this option if your geometry is a bit
     * unusual, like having a vertex of a triangle in-between two vertices of an edge of another triangle. It happens often when using CSG to construct meshes.
     * This option is used only if useAlternateEdgeFinder = true
     */
    applyTessellation?: boolean;

    /**
     * The limit under which 3 vertices are considered to be aligned. 3 vertices PQR are considered aligned if distance(PQ) + distance(QR) - distance(PR) < epsilonVertexAligned
     * The default value is 1e-6
     * This option is used only if useAlternateEdgeFinder = true
     */
    epsilonVertexAligned?: number;
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
    protected _options: Nullable<IEdgesRendererOptions>;

    private _meshRebuildObserver: Nullable<Observer<AbstractMesh>>;
    private _meshDisposeObserver: Nullable<Observer<Node>>;

    /** Gets or sets a boolean indicating if the edgesRenderer is active */
    public isEnabled = true;

    /**
     * List of instances to render in case the source mesh has instances
     */
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
     * @param  checkVerticesInsteadOfIndices bases the edges detection on vertices vs indices. Note that this parameter is not used if options.useAlternateEdgeFinder = true
     * @param  generateEdgesLines - should generate Lines or only prepare resources.
     * @param  options The options to apply when generating the edges
     */
    constructor(source: AbstractMesh, epsilon = 0.95, checkVerticesInsteadOfIndices = false, generateEdgesLines = true, options?: IEdgesRendererOptions) {
        this._source = source;
        this._checkVerticesInsteadOfIndices = checkVerticesInsteadOfIndices;
        this._options = options ?? null;

        this._epsilon = epsilon;

        this._prepareRessources();
        if (generateEdgesLines) {
            if (options?.useAlternateEdgeFinder) {
                this._generateEdgesLinesAlternate();
            } else {
                this._generateEdgesLines();
            }
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
        const eps = 1e-10;
        if (pa.equalsWithEpsilon(p0, eps) && pb.equalsWithEpsilon(p1, eps) || pa.equalsWithEpsilon(p1, eps) && pb.equalsWithEpsilon(p0, eps)) {
            return 0;
        }

        if (pa.equalsWithEpsilon(p1, eps) && pb.equalsWithEpsilon(p2, eps) || pa.equalsWithEpsilon(p2, eps) && pb.equalsWithEpsilon(p1, eps)) {
            return 1;
        }

        if (pa.equalsWithEpsilon(p2, eps) && pb.equalsWithEpsilon(p0, eps) || pa.equalsWithEpsilon(p0, eps) && pb.equalsWithEpsilon(p2, eps)) {
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
     * See https://playground.babylonjs.com/#R3JR6V#1 for a visual display of the algorithm
     */
    private _tessellateTriangle(edgePoints: Array<Array<[number, number]>>, indexTriangle: number, indices: Array<number>, remapVertexIndices: Array<number>): void {

        const makePointList = (edgePoints: Array<[number, number]>, pointIndices: Array<number>, firstIndex: number) => {
            if (firstIndex >= 0) {
                pointIndices.push(firstIndex);
            }

            for (let i = 0; i < edgePoints.length; ++i) {
                pointIndices.push(edgePoints[i][0]);
            }
        };

        let startEdge = 0;

        if (edgePoints[1].length >= edgePoints[0].length && edgePoints[1].length >= edgePoints[2].length) {
            startEdge = 1;
        } else if (edgePoints[2].length >= edgePoints[0].length && edgePoints[2].length >= edgePoints[1].length) {
            startEdge = 2;
        }

        for (let e = 0; e < 3; ++e) {
            if (e === startEdge) {
                edgePoints[e].sort((a, b) => a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
            } else {
                edgePoints[e].sort((a, b) => a[1] > b[1] ? -1 : a[1] < b[1] ? 1 : 0);
            }
        }

        const mainPointIndices: Array<number> = [], otherPointIndices: Array<number> = [];

        makePointList(edgePoints[startEdge], mainPointIndices, -1);

        let numMainPoints = mainPointIndices.length;

        for (let i = startEdge + 2; i >= startEdge + 1; --i) {
            makePointList(edgePoints[i % 3], otherPointIndices, i !== startEdge + 2 ? remapVertexIndices[indices[indexTriangle + ((i + 1) % 3)]] : -1);
        }

        const numOtherPoints = otherPointIndices.length;

        let idxMain = 0;
        let idxOther = 0;

        indices.push(remapVertexIndices[indices[indexTriangle + startEdge]], mainPointIndices[0], otherPointIndices[0]);
        indices.push(remapVertexIndices[indices[indexTriangle + ((startEdge + 1) % 3)]], otherPointIndices[numOtherPoints - 1], mainPointIndices[numMainPoints - 1]);

        const bucketIsMain = numMainPoints <= numOtherPoints;

        const bucketStep = bucketIsMain ? numMainPoints : numOtherPoints;
        const bucketLimit = bucketIsMain ? numOtherPoints : numMainPoints;
        const bucketIdxLimit = bucketIsMain ? numMainPoints - 1 : numOtherPoints - 1;
        const winding = bucketIsMain ? 0 : 1;

        let numTris = numMainPoints + numOtherPoints - 2;

        let bucketIdx = bucketIsMain ? idxMain : idxOther;
        let nbucketIdx = bucketIsMain ? idxOther : idxMain;
        let bucketPoints = bucketIsMain ? mainPointIndices : otherPointIndices;
        let nbucketPoints = bucketIsMain ? otherPointIndices : mainPointIndices;

        let bucket = 0;

        while (numTris-- > 0) {
            if (winding) {
                indices.push(bucketPoints[bucketIdx], nbucketPoints[nbucketIdx]);
            } else {
                indices.push(nbucketPoints[nbucketIdx], bucketPoints[bucketIdx]);
            }

            bucket += bucketStep;

            let lastIdx;

            if (bucket >= bucketLimit && bucketIdx < bucketIdxLimit) {
                lastIdx = bucketPoints[++bucketIdx];
                bucket -= bucketLimit;
            } else {
                lastIdx = nbucketPoints[++nbucketIdx];
            }

            indices.push(lastIdx);
        }

        indices[indexTriangle + 0] = indices[indices.length - 3];
        indices[indexTriangle + 1] = indices[indices.length - 2];
        indices[indexTriangle + 2] = indices[indices.length - 1];

        indices.length = indices.length - 3;
    }

    private _generateEdgesLinesAlternate(): void {
        var positions = this._source.getVerticesData(VertexBuffer.PositionKind);
        var indices = this._source.getIndices();

        if (!indices || !positions) {
            return;
        }

        if (!Array.isArray(indices)) {
            indices = Array.from(indices);
        }

        /**
         * Find all vertices that are at the same location (with an epsilon) and remapp them on the same vertex
         */
        const useFastVertexMerger = this._options?.useFastVertexMerger ?? true;
        const epsVertexMerge = useFastVertexMerger ? Math.round(-Math.log(this._options?.epsilonVertexMerge ?? 1e-6) / Math.log(10)) : this._options?.epsilonVertexMerge ?? 1e-6;
        const remapVertexIndices: Array<number> = [];
        const uniquePositions: Array<number> = []; // list of unique index of vertices - needed for tessellation

        if (useFastVertexMerger) {
            const mapVertices: { [key: string]: number} = {};
            for (let v1 = 0; v1 < positions.length; v1 += 3) {
                const x1 = positions[v1 + 0], y1 = positions[v1 + 1], z1 = positions[v1 + 2];

                const key = x1.toFixed(epsVertexMerge) + "|" + y1.toFixed(epsVertexMerge) + "|" + z1.toFixed(epsVertexMerge);

                if (mapVertices[key] !== undefined) {
                    remapVertexIndices.push(mapVertices[key]);
                } else {
                    const idx = v1 / 3;
                    mapVertices[key] = idx;
                    remapVertexIndices.push(idx);
                    uniquePositions.push(idx);
                }
            }
        } else {
            for (let v1 = 0; v1 < positions.length; v1 += 3) {
                const x1 = positions[v1 + 0], y1 = positions[v1 + 1], z1 = positions[v1 + 2];
                let found = false;
                for (let v2 = 0; v2 < v1 && !found; v2 += 3) {
                    const x2 = positions[v2 + 0], y2 = positions[v2 + 1], z2 = positions[v2 + 2];

                    if (Math.abs(x1 - x2) < epsVertexMerge && Math.abs(y1 - y2) < epsVertexMerge && Math.abs(z1 - z2) < epsVertexMerge) {
                        remapVertexIndices.push(v2 / 3);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    remapVertexIndices.push(v1 / 3);
                    uniquePositions.push(v1 / 3);
                }
            }
        }

        if (this._options?.applyTessellation) {
            /**
             * Tessellate triangles if necessary:
             *
             *               A
             *               +
             *               |\
             *               | \
             *               |  \
             *             E +   \
             *              /|    \
             *             / |     \
             *            /  |      \
             *           +---+-------+ B
             *           D   C
             *
             * For the edges to be rendered correctly, the ABC triangle has to be split into ABE and BCE, else AC is considered to be an edge, whereas only AE should be.
             *
             * The tessellation process looks for the vertices like E that are in-between two other vertices making of an edge and create new triangles as necessary
             */

            // First step: collect the triangles to tessellate
            const epsVertexAligned = this._options?.epsilonVertexAligned ?? 1e-6;
            const mustTesselate: Array<{ index: number, edgesPoints: Array<Array<[number, number]>> }> = []; // liste of triangles that must be tessellated

            for (let index = 0; index < indices.length; index += 3) { // loop over all triangles
                let triangleToTessellate: { index: number, edgesPoints: Array<Array<[number, number]>> } | undefined;

                for (let i = 0; i < 3; ++i) { // loop over the 3 edges of the triangle
                    let p0Index = remapVertexIndices[indices[index + i]];
                    let p1Index = remapVertexIndices[indices[index + (i + 1) % 3]];
                    let p2Index = remapVertexIndices[indices[index + (i + 2) % 3]];

                    if (p0Index === p1Index) { continue; } // degenerated triangle - don't process

                    const p0x = positions[p0Index * 3 + 0], p0y = positions[p0Index * 3 + 1], p0z = positions[p0Index * 3 + 2];
                    const p1x = positions[p1Index * 3 + 0], p1y = positions[p1Index * 3 + 1], p1z = positions[p1Index * 3 + 2];

                    const p0p1 = Math.sqrt((p1x - p0x) * (p1x - p0x) + (p1y - p0y) * (p1y - p0y) + (p1z - p0z) * (p1z - p0z));

                    for (let v = 0; v < uniquePositions.length - 1; v++) { // loop over all (unique) vertices and look for the ones that would be in-between p0 and p1
                        const vIndex = uniquePositions[v];

                        if (vIndex === p0Index || vIndex === p1Index || vIndex === p2Index) { continue; } // don't handle the vertex if it is a vertex of the current triangle

                        const x = positions[vIndex * 3 + 0], y = positions[vIndex * 3 + 1], z = positions[vIndex * 3 + 2];

                        const p0p = Math.sqrt((x - p0x) * (x - p0x) + (y - p0y) * (y - p0y) + (z - p0z) * (z - p0z));
                        const pp1 = Math.sqrt((x - p1x) * (x - p1x) + (y - p1y) * (y - p1y) + (z - p1z) * (z - p1z));

                        if (Math.abs(p0p + pp1 - p0p1) < epsVertexAligned) { // vertices are aligned and p in-between p0 and p1 if distance(p0, p) + distance (p, p1) ~ distance(p0, p1)
                            if (!triangleToTessellate) {
                                triangleToTessellate = {
                                    index: index,
                                    edgesPoints: [[], [], []],
                                };
                                mustTesselate.push(triangleToTessellate);
                            }
                            triangleToTessellate.edgesPoints[i].push([vIndex, p0p]);
                        }
                    }
                }
            }

            // Second step: tesselate the triangles
            for (let t = 0; t < mustTesselate.length; ++t) {
                const triangle = mustTesselate[t];

                this._tessellateTriangle(triangle.edgesPoints, triangle.index, indices, remapVertexIndices);
            }

            (mustTesselate as any) = null;
        }

        /**
         * Collect the edges to render
         */
        const edges: { [key: string] : { normal: Vector3, done: boolean, index: number, i: number } } = { };

        for (let index = 0; index < indices.length; index += 3) {
            let faceNormal;
            for (let i = 0; i < 3; ++i) {
                let p0Index = remapVertexIndices[indices[index + i]];
                let p1Index = remapVertexIndices[indices[index + (i + 1) % 3]];
                let p2Index = remapVertexIndices[indices[index + (i + 2) % 3]];

                if (p0Index === p1Index) { continue; }

                TmpVectors.Vector3[0].copyFromFloats(positions[p0Index * 3 + 0], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
                TmpVectors.Vector3[1].copyFromFloats(positions[p1Index * 3 + 0], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);
                TmpVectors.Vector3[2].copyFromFloats(positions[p2Index * 3 + 0], positions[p2Index * 3 + 1], positions[p2Index * 3 + 2]);

                if (!faceNormal) {
                    faceNormal = Vector3.Cross(TmpVectors.Vector3[1].subtract(TmpVectors.Vector3[0]), TmpVectors.Vector3[2].subtract(TmpVectors.Vector3[1]));
                    faceNormal.normalize();
                }

                if (p0Index > p1Index) {
                    const tmp = p0Index;
                    p0Index = p1Index;
                    p1Index = tmp;
                }

                const key = p0Index + "_" + p1Index;
                const ei = edges[key];

                if (ei) {
                    if (!ei.done) {
                        const dotProduct = Vector3.Dot(faceNormal, ei.normal);

                        if (dotProduct < this._epsilon) {
                            this.createLine(TmpVectors.Vector3[0], TmpVectors.Vector3[1], this._linesPositions.length / 3);
                        }

                        ei.done = true;
                    }
                } else {
                    edges[key] = { normal: faceNormal, done: false, index: index, i: i };
                }
            }
        }

        for (const key in edges) {
            const ei = edges[key];
            if (!ei.done) {
                // Orphaned edge - we must display it
                let p0Index = remapVertexIndices[indices[ei.index + ei.i]];
                let p1Index = remapVertexIndices[indices[ei.index + (ei.i + 1) % 3]];

                TmpVectors.Vector3[0].copyFromFloats(positions[p0Index * 3 + 0], positions[p0Index * 3 + 1], positions[p0Index * 3 + 2]);
                TmpVectors.Vector3[1].copyFromFloats(positions[p1Index * 3 + 0], positions[p1Index * 3 + 1], positions[p1Index * 3 + 2]);

                this.createLine(TmpVectors.Vector3[0], TmpVectors.Vector3[1], this._linesPositions.length / 3);
            }
        }

        /**
         * Merge into a single mesh
         */
        var engine = this._source.getScene().getEngine();

        this._buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, this._linesPositions, VertexBuffer.PositionKind, false);
        this._buffers[VertexBuffer.NormalKind] = new VertexBuffer(engine, this._linesNormals, VertexBuffer.NormalKind, false, false, 4);

        this._buffersForInstances[VertexBuffer.PositionKind] = this._buffers[VertexBuffer.PositionKind];
        this._buffersForInstances[VertexBuffer.NormalKind] = this._buffers[VertexBuffer.NormalKind];

        this._ib = engine.createIndexBuffer(this._linesIndices);

        this._indicesCount = this._linesIndices.length;
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
