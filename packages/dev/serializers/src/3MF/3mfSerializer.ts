// Babylonjs
import type { SubMesh } from "core/Meshes";
import { Mesh } from "core/Meshes/mesh";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { Matrix } from "core/Maths/math";
import { Tools } from "core/Misc/tools";

// 3MF
import { ThreeMfMeshBuilder, type ThreeMfModelBuilder } from "./core/model/3mf.builder";
import { Matrix3d } from "./core/model/3mf";

import { ST_Unit, type I3mfModel, type I3mfObject } from "./core/model/3mf.interfaces";
import type { I3mfVertexData } from "./core/model/3mf.types";
import { AbstractThreeMfSerializer, type IThreeMfSerializerOptions } from "./core/model/3mf.serializer";
import { ThreeMfSerializerGlobalConfiguration } from "./3mfSerializer.configuration";

/**
 *
 */
class IncrementalIdFactory {
    /** */
    _from: number;
    /** */
    _to: number;
    /** */
    _step: number;
    /** */
    _i: number;

    /**
     *
     * @param from
     * @param to
     * @param step
     */
    public constructor(from: number = 0, to: number = Number.MIN_SAFE_INTEGER, step: number = 1) {
        this._from = from;
        this._to = to;
        this._step = step;
        this._i = from;
    }

    /**
     *
     * @returns
     */
    public next(): number {
        if (this._i < this._to) {
            throw new Error("ST_ResourceID out of bound");
        }
        const v = this._i;
        this._i += this._step;
        return v;
    }

    /**
     *
     * @returns
     */
    public reset(): IncrementalIdFactory {
        this._i = this._from;
        return this;
    }
}

/**
 * Options controlling how meshes are exported into the 3MF model.
 *
 * Notes:
 * - These flags are kept generic here and are expected to be interpreted by the concrete serializer/model builder.
 * - Defaults are set in AbstractThreeMfSerializer.DEFAULT_3MF_EXPORTER_OPTIONS.
 */
export interface IBjsThreeMfSerializerOptions extends IThreeMfSerializerOptions {
    /**
     * If true, export mesh instances (multiple references to the same geometry) when supported.
     * If false, geometry may be duplicated depending on the concrete implementation.
     */
    exportInstances?: boolean;
}

/**
 * Babylon.js to 3MF serializer.
 *
 * This serializer converts Babylon meshes into a 3MF model, then relies on the base class
 * (AbstractThreeMfSerializer) to package the OPC parts into a zip stream.
 *
 * Design notes:
 * - First pass: export "source" meshes (non-instances) and build an index to map Babylon mesh/submesh to 3MF object id.
 * - Second pass (optional): export instances as additional build items referencing the original object ids.
 * - Submesh export is handled by extracting per-submesh vertex/index buffers so materials/colors can be preserved
 *   by downstream steps that attach per-object properties.
 */
export class BjsThreeMfSerializer extends AbstractThreeMfSerializer<Mesh | InstancedMesh, IBjsThreeMfSerializerOptions> {
    /**
     *
     */
    static DefaultOptions: IBjsThreeMfSerializerOptions = { unit: ST_Unit.meter, exportInstances: false };

    /**
     * Babylon's vertex buffer semantic for positions.
     * Babylon uses string-based "kind" keys for vertex buffers.
     */
    private static _PositionKind = "position";

    /**
     * Cached promise so we only attempt to load fflate once.
     * This prevents multiple concurrent LoadScriptAsync calls.
     */
    private _fflateReadyPromise?: Promise<any>;

    /**
     * @param opts serializer options (merged with defaults in base class).
     */
    public constructor(opts: Partial<IBjsThreeMfSerializerOptions> = {}) {
        super({ ...BjsThreeMfSerializer.DefaultOptions, ...opts });
    }

    /**
     * Build a 3MF model from Babylon meshes.
     *
     * Important: this method should not allocate huge intermediate data unless needed.
     * Submesh extraction does allocate new position/index arrays for each exported submesh.
     * @param builder
     * @param meshes
     * @returns
     */
    public override toModel(builder: ThreeMfModelBuilder, ...meshes: Array<Mesh | InstancedMesh>): I3mfModel {
        // avoid parasits..
        meshes = meshes.filter((m) => m instanceof Mesh || m instanceof InstancedMesh);

        const idFactory = new IncrementalIdFactory();

        const modelBuilder = builder;

        /**
         * Index mapping Babylon elements to the created 3MF object.
         *
         * Why:
         * - Instances need to reference the base object id.
         * - When exporting submeshes, instances should reference per-submesh objects rather than the whole mesh.
         *
         * Key type:
         * - When exportSubmeshes is true: we store entries for each SubMesh.
         * - Otherwise: we store entries for each Mesh.
         */
        const index = new Map<Mesh | SubMesh, I3mfObject>();

        /**
         * If exportInstances is enabled, we collect instanced meshes during the first pass and process them later.
         * If exportInstances is disabled, instances are ignored (they will not appear in the output).
         */
        const instances: Array<InstancedMesh> | null = this.options.exportInstances ? [] : null;

        // First pass: export base meshes (non-instances).
        // This creates the "resource objects" referenced by build items.
        for (let j = 0; j < meshes.length; j++) {
            const babylonMesh = meshes[j];
            if (babylonMesh instanceof InstancedMesh) {
                // Defer instance handling to the second pass.
                instances?.push(babylonMesh);
                continue;
            }

            const objectName = babylonMesh.name || `mesh${j}`;

            // Convert Babylon world matrix to 3MF build transform (3x4).
            // This transform will be attached to the build item referencing the created object.
            const worldTransform = babylonMesh.getWorldMatrix();
            const buildTransform = this._handleBjsTo3mfMatrixTransformToRef(worldTransform, Matrix3d.Zero());

            // Submeshes can carry material/color boundaries in Babylon.
            // When exportSubmeshes is enabled, we export each submesh as its own 3MF object so
            // consumers can attach per-object properties (e.g. colors) later.
            const subMeshes = babylonMesh.subMeshes;
            if (subMeshes === undefined) {
                // very unlikely...
                continue;
            }

            // Babylon.js automatically creates one SubMesh covering the whole mesh if you don’t define any.
            const isStandalone = subMeshes.length == 1;
            for (let k = 0; k < subMeshes.length; k++) {
                const subMesh = subMeshes[k];

                const data = this._extractSubMesh(babylonMesh, subMesh);

                if (data) {
                    const submeshName = isStandalone ? `${objectName}` : `${objectName}_${k}`;

                    const object = new ThreeMfMeshBuilder(idFactory.next()).withData(data).withName(submeshName).build();

                    // Add object to resources.
                    modelBuilder.withMesh(object);

                    // Add a build item referencing the object at the mesh world transform.
                    modelBuilder.withBuild(object.id, buildTransform);

                    // Cache mapping for instances (instances will reference this object id).
                    index.set(subMesh, object);
                }
            }
        }

        // Second pass: export instances as additional build items.
        //
        // In 3MF terms:
        // - We do not duplicate geometry for each instance.
        // - We emit multiple build items referencing the same object id, each with its own transform.
        if (instances && instances.length) {
            // Group instances by their source mesh to keep related builds close in the XML.
            const grouped = this._groupBy(instances, (i) => i.sourceMesh);

            for (const [_babylonMesh, _instances] of Array.from(grouped.entries())) {
                if (!_instances || !_instances.length) {
                    continue;
                }

                for (let j = 0; j < _instances.length; j++) {
                    const mesh = _instances[j];
                    const worldTransform = mesh.getWorldMatrix();

                    // If we exported submeshes, the base "resource objects" are per-submesh.
                    // For an instance we emit a build item per submesh object.
                    const subMeshes = _babylonMesh.subMeshes;

                    for (let k = 0; k < subMeshes.length; k++) {
                        const subMesh = subMeshes[k];

                        // Look up the 3MF object created for this submesh in the first pass.
                        const objectRef = index.get(subMesh);

                        if (objectRef) {
                            modelBuilder.withBuild(objectRef.id, this._handleBjsTo3mfMatrixTransformToRef(worldTransform, Matrix3d.Zero()));
                            continue;
                        }
                    }
                }
            }
        }

        return modelBuilder.build();
    }

    /**
     * Ensure the zip library (fflate) is available in the current runtime.
     *
     * Host assumptions:
     * - This implementation relies on fflate being exposed on globalThis.fflate.
     * - If it is not present, it loads a script from ThreeMfSerializerGlobalConfiguration.FFLATEUrl using Babylon Tools.LoadScriptAsync.
     * @returns
     */
    public override async ensureZipLibReadyAsync(): Promise<any> {
        if (this._fflateReadyPromise) {
            return await this._fflateReadyPromise;
        }

        this._fflateReadyPromise = (async () => {
            // globalThis is the global object in all modern JS runtimes (browser, workers, Node, etc.).
            const g = globalThis as any;

            // If fflate is not already present, load it dynamically.
            // This assumes the loaded script sets globalThis.fflate.
            if (!g.fflate) {
                await Tools.LoadScriptAsync(ThreeMfSerializerGlobalConfiguration.FFLATEUrl);
            }

            return g.fflate;
        })();

        return await this._fflateReadyPromise;
    }

    /**
     * Extract a single SubMesh into a standalone vertex/index buffer pair.
     *
     * Why:
     * - 3MF mesh objects typically reference a contiguous vertex array and triangle indices.
     * - Babylon SubMesh references a slice of the global index buffer, but shares the vertex buffer.
     * - To serialize each submesh independently, we build a compacted vertex buffer containing only the used vertices
     *   and remap indices accordingly.
     *
     * Complexity:
     * - O(indexCount) time, O(uniqueVerticesInSubmesh) additional memory.
     * @param mesh
     * @param sm
     * @returns
     */
    private _extractSubMesh(mesh: Mesh, sm: SubMesh): I3mfVertexData | undefined {
        const allInd = mesh.getIndices();
        if (!allInd) {
            return undefined;
        }

        const allPos = mesh.getVerticesData(BjsThreeMfSerializer._PositionKind);
        if (!allPos) {
            return undefined;
        }

        // Fast path: the submesh covers the full index buffer, so reuse the original arrays.
        // Note: This returns Babylon-owned arrays; if callers mutate, they will affect source mesh data.
        // Kept as-is to avoid extra allocations.
        if (sm.indexStart == 0 && sm.indexCount == allInd.length) {
            return {
                positions: allPos,
                indices: allInd,
            };
        }

        const indStart = sm.indexStart;

        // Map old vertex index -> new compacted vertex index.
        const map = new Map<number, number>();

        // Compacted positions (x,y,z repeated). We assemble into number[] then convert to Float32Array at the end.
        const newPositions: number[] = [];

        // Indices for the compacted vertex buffer.
        // Uint32Array is used to support large meshes; ensure downstream 3MF writer supports 32-bit indices if needed.
        const newIndices = new Uint32Array(sm.indexCount);

        for (let i = 0; i < sm.indexCount; i++) {
            const oldVi = allInd[indStart + i];

            let newVi = map.get(oldVi);
            if (newVi === undefined) {
                newVi = map.size;
                map.set(oldVi, newVi);

                // Copy the corresponding position (assumes positions are 3-floats per vertex).
                // If the source mesh uses a different stride or includes morph targets, this ignores them.
                const p = oldVi * 3;
                newPositions.push(allPos[p], allPos[p + 1], allPos[p + 2]);
            }

            newIndices[i] = newVi;
        }

        return {
            positions: new Float32Array(newPositions),
            indices: newIndices,
        };
    }

    /**
     * Group items by a computed key.
     * Used to group instances by sourceMesh so the resulting XML is easier to read and debug.
     * @param items
     * @param key
     * @returns
     */
    private _groupBy<T, K>(items: readonly T[], key: (v: T) => K): Map<K, T[]> {
        const m = new Map<K, T[]>();
        for (const it of items) {
            const k = key(it);
            const arr = m.get(k);
            if (arr) {
                arr.push(it);
            } else {
                m.set(k, [it]);
            }
        }
        return m;
    }

    /**
     * Basis conversion from Babylon coordinate system to the expected 3MF coordinate system.
     *
     * Here we rotate +90 degrees around X:
     * - This is commonly used to convert between Y-up and Z-up conventions.
     * - Verify this matches your pipeline (Babylon is typically left-handed Y-up).
     */
    private static readonly _R_BJS_TO_3MF = Matrix.RotationX(Math.PI / 2).multiply(Matrix.Scaling(1, -1, 1));

    /**
     * Converts a Babylon.js 4x4 matrix into a 3MF 3x4 transform matrix and writes the result into ref.
     *
     * Babylon.js conventions:
     * - Babylon exposes matrices with logical row/column indexing (M(row, column)).
     * - It stores the 16 coefficients in a contiguous array in row-major order:
     *   [ M00, M01, M02, M03,
     *     M10, M11, M12, M13,
     *     M20, M21, M22, M23,
     *     M30, M31, M32, M33 ]
     *
     * 3MF expectation:
     * - 3MF uses an affine transform represented as a 3x4 matrix (12 values).
     * - The values are taken from the first 3 columns of the 4x4 matrix, across the 4 rows:
     *   m00 m01 m02  m10 m11 m12  m20 m21 m22  m30 m31 m32
     *
     * Steps:
     * 1) Compose Babylon transform with the basis change:
     *    tmp = tBjs * _R_BJS_TO_3MF
     * 2) Extract the 12 coefficients in 3MF order from tmp.m.
     *
     * Interop note:
     * - Do not transpose here. We only reorder values to match the 3MF 3x4 serialization order.
     * - Transposition is only relevant when interfacing with code that assumes column-major storage.
     *
     * @param tBjs Babylon.js 4x4 matrix.
     * @param ref Output 3MF 3x4 matrix container (ref.values assigned).
     * @returns ref, for chaining.
     */
    private _handleBjsTo3mfMatrixTransformToRef(tBjs: Matrix, ref: Matrix3d): Matrix3d {
        const tmp = tBjs.multiplyToRef(BjsThreeMfSerializer._R_BJS_TO_3MF, Matrix.Zero());
        const a = tmp.m;

        // a is Babylon row-major storage. Extract rows 0..3, cols 0..2 in 3MF order.
        // 3MF order: m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32
        ref.values = [a[0], a[1], a[2], a[4], a[5], a[6], a[8], a[9], a[10], a[12], a[13], a[14]];
        return ref;
    }
}
