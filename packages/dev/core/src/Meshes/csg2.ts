import { Mesh } from "./mesh";
import type { IDisposable, Scene } from "core/scene";
import type { IVertexDataLike } from "./mesh.vertexData";
import { VertexData } from "./mesh.vertexData";
import { VertexBuffer } from "../Buffers/buffer";
import { Logger } from "core/Misc/logger";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { SubMesh } from "./subMesh";
import type { Material } from "core/Materials/material";
import { _LoadScriptModuleAsync } from "core/Misc/tools.internals";
import type { FloatArray, Nullable } from "core/types";
import type { Matrix } from "core/Maths/math.vector";
import { Vector3 } from "core/Maths/math.vector";

/**
 * Main manifold library
 */
let Manifold: any;

/**
 * Promise to wait for the manifold library to be ready
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let ManifoldPromise: Promise<{ Manifold: any; Mesh: any }>;

/**
 * Manifold mesh
 */
let ManifoldMesh: any;

/**
 * First ID to use for materials indexing
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let FirstID: number;

/**
 * Interface to customize the Manifold library import
 */
export interface ICSG2Options {
    /**
     * Custom manifold URL
     */
    manifoldUrl?: string;
    /**
     * Custom manifold instance
     */
    manifoldInstance: any;
    /**
     * Custom manifold mesh instance
     */
    manifoldMeshInstance: any;
}

/**
 * Interface to customize the mesh rebuild options
 */
export interface IMeshRebuildOptions {
    /**
     * Rebuild normals
     */
    rebuildNormals?: boolean;
    /**
     * True to center the mesh on 0,0,0
     */
    centerMesh?: boolean;
    /**
     * Defines a material to use for that mesh. When not defined the system will either reuse the one from the source or create a multimaterial if several materials were involved
     */
    materialToUse?: Material;
}

/**
 * Interface to customize the vertex data rebuild options
 */
export interface IVertexDataRebuildOptions {
    /**
     * Rebuild normals
     */
    rebuildNormals?: boolean;
}

interface IManifoldMesh {
    numProp: number;
    vertProperties: Float32Array;
    triVerts: Uint32Array;
    runIndex: Uint32Array;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    runOriginalID: Uint32Array;
    numRun: number;
}

interface IManifoldVertexComponent {
    stride: number;
    kind: string;
    data?: FloatArray;
}

/**
 * Wrapper around the Manifold library
 * https://manifoldcad.org/
 * Use this class to perform fast boolean operations on meshes
 * @see [basic operations](https://playground.babylonjs.com/#IW43EB#15)
 * @see [skull vs box](https://playground.babylonjs.com/#JUKXQD#6218)
 * @see [skull vs vertex data](https://playground.babylonjs.com/#JUKXQD#6219)
 */
export class CSG2 implements IDisposable {
    private _manifold: any;
    private _numProp: number;
    private _vertexStructure: IManifoldVertexComponent[];

    /**
     * Return the size of a vertex (at least 3 for the position)
     */
    public get numProp() {
        return this._numProp;
    }

    private constructor(manifold: any, numProp: number, vertexStructure: IManifoldVertexComponent[]) {
        this._manifold = manifold;
        this._numProp = numProp;
        this._vertexStructure = vertexStructure;
    }

    private _process(operation: "difference" | "intersection" | "union", csg: CSG2) {
        if (this.numProp !== csg.numProp) {
            throw new Error("CSG must be used with geometries having the same number of properties");
        }
        return new CSG2(Manifold[operation](this._manifold, csg._manifold), this.numProp, this._vertexStructure);
    }

    /**
     * Run a difference operation between two CSG
     * @param csg defines the CSG to use to create the difference
     * @returns a new csg
     */
    public subtract(csg: CSG2) {
        return this._process("difference", csg);
    }

    /**
     * Run an intersection operation between two CSG
     * @param csg defines the CSG to use to create the intersection
     * @returns a new csg
     */
    public intersect(csg: CSG2) {
        return this._process("intersection", csg);
    }

    /**
     * Run an union operation between two CSG
     * @param csg defines the CSG to use to create the union
     * @returns a new csg
     */
    public add(csg: CSG2) {
        return this._process("union", csg);
    }

    /**
     * Print debug information about the CSG
     */
    public printDebug() {
        Logger.Log("Genus:" + this._manifold.genus());
        Logger.Log("Volume:" + this._manifold.volume());
        Logger.Log("surface area:" + this._manifold.surfaceArea());
    }

    /**
     * Generate a vertex data from the CSG
     * @param options defines the options to use to rebuild the vertex data
     * @returns a new vertex data
     */
    public toVertexData(options?: Partial<IVertexDataRebuildOptions>): VertexData {
        const localOptions = {
            rebuildNormals: false,
            ...options,
        };
        const vertexData = new VertexData();
        const normalComponent = this._vertexStructure.find((c) => c.kind === VertexBuffer.NormalKind);
        const manifoldMesh: IManifoldMesh = this._manifold.getMesh(localOptions.rebuildNormals && normalComponent ? [3, 4, 5] : undefined);

        vertexData.indices = manifoldMesh.triVerts.length > 65535 ? new Uint32Array(manifoldMesh.triVerts) : new Uint16Array(manifoldMesh.triVerts);

        for (let i = 0; i < manifoldMesh.triVerts.length; i += 3) {
            vertexData.indices[i] = manifoldMesh.triVerts[i + 2];
            vertexData.indices[i + 1] = manifoldMesh.triVerts[i + 1];
            vertexData.indices[i + 2] = manifoldMesh.triVerts[i];
        }

        const vertexCount = manifoldMesh.vertProperties.length / manifoldMesh.numProp;

        // Attributes
        let offset = 0;
        for (let componentIndex = 0; componentIndex < this._vertexStructure.length; componentIndex++) {
            const component = this._vertexStructure[componentIndex];

            const data = new Float32Array(vertexCount * component.stride);
            for (let i = 0; i < vertexCount; i++) {
                for (let strideIndex = 0; strideIndex < component.stride; strideIndex++) {
                    data[i * component.stride + strideIndex] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + offset + strideIndex];
                }
            }
            vertexData.set(data, component.kind);
            offset += component.stride;
        }

        // Rebuild mesh from vertex data
        return vertexData;
    }

    /**
     * Generate a mesh from the CSG
     * @param name defines the name of the mesh
     * @param scene defines the scene to use to create the mesh
     * @param options defines the options to use to rebuild the mesh
     * @returns a new Mesh
     */
    public toMesh(name: string, scene?: Scene, options?: Partial<IMeshRebuildOptions>): Mesh {
        const localOptions = {
            rebuildNormals: false,
            centerMesh: true,
            ...options,
        };
        const vertexData = this.toVertexData({ rebuildNormals: localOptions.rebuildNormals });
        const normalComponent = this._vertexStructure.find((c) => c.kind === VertexBuffer.NormalKind);
        const manifoldMesh: IManifoldMesh = this._manifold.getMesh(localOptions.rebuildNormals && normalComponent ? [3, 4, 5] : undefined);
        const vertexCount = manifoldMesh.vertProperties.length / manifoldMesh.numProp;

        // Rebuild mesh from vertex data
        const output = new Mesh(name, scene);
        vertexData.applyToMesh(output);

        if (!vertexCount) {
            throw new Error("Unable to build a mesh. Manifold has 0 vertex");
        }

        // Center mesh
        if (localOptions.centerMesh) {
            const extents = output.getBoundingInfo().boundingSphere.center;
            output.position.set(-extents.x, -extents.y, -extents.z);
            output.bakeCurrentTransformIntoVertices();
        }

        // Submeshes
        let id = manifoldMesh.runOriginalID[0];
        let start = manifoldMesh.runIndex[0];
        let materialIndex = 0;
        const materials: Material[] = [];
        scene = output.getScene();
        for (let run = 0; run < manifoldMesh.numRun; ++run) {
            const nextID = manifoldMesh.runOriginalID[run + 1];
            if (nextID !== id) {
                const end = manifoldMesh.runIndex[run + 1];
                new SubMesh(materialIndex, 0, vertexCount, start, end - start, output);
                materials.push(scene.getMaterialByUniqueID(id - FirstID) || scene.defaultMaterial);
                id = nextID;
                start = end;
                materialIndex++;
            }
        }

        if (localOptions.materialToUse) {
            output.material = localOptions.materialToUse;
        } else {
            if (materials.length > 1) {
                const multiMaterial = new MultiMaterial(name, scene);
                multiMaterial.subMaterials = materials;
                output.material = multiMaterial;
            } else {
                if (output.subMeshes.length > 1) {
                    // Remove the submeshes as they are not needed
                    output._createGlobalSubMesh(true);
                }
                output.material = materials[0];
            }
        }

        return output;
    }

    /**
     * Dispose the CSG resources
     */
    public dispose() {
        if (this._manifold) {
            this._manifold.delete();
            this._manifold = null;
        }
    }

    private static _ProcessData(
        vertexCount: number,
        triVerts: Uint32Array,
        structure: IManifoldVertexComponent[],
        numProp: number,
        runIndex?: Uint32Array,
        runOriginalID?: Uint32Array
    ) {
        const vertProperties = new Float32Array(vertexCount * structure.reduce((acc, cur) => acc + cur.stride, 0));

        for (let i = 0; i < vertexCount; i++) {
            let offset = 0;
            for (let idx = 0; idx < structure.length; idx++) {
                const component = structure[idx];

                for (let strideIndex = 0; strideIndex < component.stride; strideIndex++) {
                    vertProperties[i * numProp + offset + strideIndex] = component.data![i * component.stride + strideIndex];
                }
                offset += component.stride;
            }
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const manifoldMesh = new ManifoldMesh({ numProp: numProp, vertProperties, triVerts, runIndex, runOriginalID });
        manifoldMesh.merge();

        let returnValue: CSG2;
        try {
            returnValue = new CSG2(new Manifold(manifoldMesh), numProp, structure);
        } catch (e) {
            throw new Error("Error while creating the CSG: " + e.message);
        }

        return returnValue;
    }

    private static _Construct(data: IVertexDataLike, worldMatrix: Nullable<Matrix>, runIndex?: Uint32Array, runOriginalID?: Uint32Array) {
        // Create the MeshGL for I/O with Manifold library.
        const triVerts = new Uint32Array(data.indices!.length);

        // Revert order
        for (let i = 0; i < data.indices!.length; i += 3) {
            triVerts[i] = data.indices![i + 2];
            triVerts[i + 1] = data.indices![i + 1];
            triVerts[i + 2] = data.indices![i];
        }

        const tempVector3 = new Vector3();
        let numProp = 3;
        const structure: IManifoldVertexComponent[] = [{ stride: 3, kind: VertexBuffer.PositionKind }];

        if (!worldMatrix) {
            structure[0].data = data.positions!;
        } else {
            const positions = new Float32Array(data.positions!.length);
            for (let i = 0; i < data.positions!.length; i += 3) {
                Vector3.TransformCoordinatesFromFloatsToRef(data.positions![i], data.positions![i + 1], data.positions![i + 2], worldMatrix, tempVector3);
                tempVector3.toArray(positions, i);
            }
            structure[0].data = positions;
        }

        // Normals
        const sourceNormals = data.normals!;
        if (sourceNormals) {
            numProp += 3;
            structure.push({ stride: 3, kind: VertexBuffer.NormalKind });
            if (!worldMatrix) {
                structure[1].data = sourceNormals;
            } else {
                const normals = new Float32Array(sourceNormals.length);
                for (let i = 0; i < sourceNormals.length; i += 3) {
                    Vector3.TransformNormalFromFloatsToRef(sourceNormals[i], sourceNormals[i + 1], sourceNormals[i + 2], worldMatrix, tempVector3);
                    tempVector3.toArray(normals, i);
                }
                structure[1].data = normals;
            }
        }

        // UVs
        const uvKindToPropertyName: { [key: string]: string } = {
            [VertexBuffer.UVKind]: "uvs",
            [VertexBuffer.UV2Kind]: "uvs2",
            [VertexBuffer.UV3Kind]: "uvs3",
            [VertexBuffer.UV4Kind]: "uvs4",
            [VertexBuffer.UV5Kind]: "uvs5",
            [VertexBuffer.UV6Kind]: "uvs6",
        };
        for (const kind of [VertexBuffer.UVKind, VertexBuffer.UV2Kind, VertexBuffer.UV3Kind, VertexBuffer.UV4Kind, VertexBuffer.UV5Kind, VertexBuffer.UV6Kind]) {
            const sourceUV = (data as any)[uvKindToPropertyName[kind]];
            if (sourceUV) {
                numProp += 2;
                structure.push({ stride: 2, kind: kind, data: sourceUV });
            }
        }

        // Colors
        const sourceColors = data.colors;
        if (sourceColors) {
            numProp += 4;
            structure.push({ stride: 4, kind: VertexBuffer.ColorKind, data: sourceColors });
        }

        return this._ProcessData(data.positions!.length / 3, triVerts, structure, numProp, runIndex, runOriginalID);
    }

    /**
     * Create a new Constructive Solid Geometry from a vertexData
     * @param vertexData defines the vertexData to use to create the CSG
     * @returns a new CSG2 class
     */
    public static FromVertexData(vertexData: VertexData): CSG2 {
        const sourceVertices = vertexData.positions;
        const sourceIndices = vertexData.indices;

        if (!sourceVertices || !sourceIndices) {
            throw new Error("The vertexData must at least have positions and indices");
        }

        return this._Construct(vertexData, null);
    }

    /**
     * Create a new Constructive Solid Geometry from a mesh
     * @param mesh defines the mesh to use to create the CSG
     * @param ignoreWorldMatrix defines if the world matrix should be ignored
     * @returns a new CSG2 class
     */
    public static FromMesh(mesh: Mesh, ignoreWorldMatrix = false): CSG2 {
        const sourceVertices = mesh.getVerticesData(VertexBuffer.PositionKind);
        const sourceIndices = mesh.getIndices();
        const worldMatrix = mesh.computeWorldMatrix(true);

        if (!sourceVertices || !sourceIndices) {
            throw new Error("The mesh must at least have positions and indices");
        }

        // Create a triangle run for each submesh (material)
        const starts = [...Array(mesh.subMeshes.length)].map((_, idx) => mesh.subMeshes[idx].indexStart);

        // Map the materials to ID.
        const sourceMaterial = mesh.material || mesh.getScene().defaultMaterial;
        const isMultiMaterial = sourceMaterial.getClassName() === "MultiMaterial";
        const originalIDs = [...Array(mesh.subMeshes.length)].map((_, idx) => {
            if (isMultiMaterial) {
                return FirstID + (sourceMaterial as MultiMaterial).subMaterials[mesh.subMeshes[idx].materialIndex]!.uniqueId;
            }

            return FirstID + sourceMaterial.uniqueId;
        });

        // List the runs in sequence.
        const indices = Array.from(starts.keys());
        indices.sort((a, b) => starts[a] - starts[b]);
        const runIndex = new Uint32Array(indices.map((i) => starts[i]));
        const runOriginalID = new Uint32Array(indices.map((i) => originalIDs[i]));

        // Process
        const data = {
            positions: sourceVertices,
            indices: sourceIndices,
            normals: mesh.getVerticesData(VertexBuffer.NormalKind),
            colors: mesh.getVerticesData(VertexBuffer.ColorKind),
            uvs: mesh.getVerticesData(VertexBuffer.UVKind),
            uvs2: mesh.getVerticesData(VertexBuffer.UV2Kind),
            uvs3: mesh.getVerticesData(VertexBuffer.UV3Kind),
            uvs4: mesh.getVerticesData(VertexBuffer.UV4Kind),
            uvs5: mesh.getVerticesData(VertexBuffer.UV5Kind),
            uvs6: mesh.getVerticesData(VertexBuffer.UV6Kind),
        };
        return this._Construct(data, ignoreWorldMatrix ? null : worldMatrix, runIndex, runOriginalID);
    }
}

/**
 * Checks if the Manifold library is ready
 * @returns true if the Manifold library is ready
 */
export function IsCSG2Ready() {
    return Manifold !== undefined;
}

/**
 * Initialize the Manifold library
 * @param options defines the options to use to initialize the library
 */
export async function InitializeCSG2Async(options?: Partial<ICSG2Options>) {
    const localOptions = {
        manifoldUrl: "https://unpkg.com/manifold-3d@3.3.0",
        ...options,
    };

    if (Manifold) {
        return; // Already initialized
    }

    if (ManifoldPromise) {
        await ManifoldPromise;
        return;
    }

    if (localOptions.manifoldInstance) {
        Manifold = localOptions.manifoldInstance;
        ManifoldMesh = localOptions.manifoldMeshInstance;
    } else {
        ManifoldPromise = _LoadScriptModuleAsync(
            `
            import Module from '${localOptions.manifoldUrl}/manifold.js';
            const wasm = await Module();
            wasm.setup();
            const {Manifold, Mesh} = wasm;
            const returnedValue =  {Manifold, Mesh};
        `
        );

        const result = await ManifoldPromise;
        // eslint-disable-next-line require-atomic-updates
        Manifold = result.Manifold;
        ManifoldMesh = result.Mesh;
    }

    // Reserve IDs for materials (we consider that there will be no more than 65536 materials)
    FirstID = Manifold.reserveIDs(65536);
}
