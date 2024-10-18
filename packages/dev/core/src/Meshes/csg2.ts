import { Tools } from "core/Misc/tools";
import { Mesh } from "./mesh";
import type { Scene } from "core/scene";
import { VertexData } from "./mesh.vertexData";
import { VertexBuffer } from "./buffer";

/**
 * Main manifold library
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let Manifold: any;

/**
 * Manifold mesh
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
let ManifoldMesh: any;

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
}

interface IManifoldMesh {
    numProp: number;
    vertProperties: Float32Array;
    triVerts: Uint32Array;
    runIndex: Uint32Array;
    runOriginalID: Uint32Array;
    numRun: number;
}

/**
 * Wrapper around the Manifold library
 * https://manifoldcad.org/
 * Use this class to perform fast boolean operations on meshes
 * #IW43EB#11
 */
export class CSG2 {
    private _manifold: any;
    private _numProp: number;

    /**
     * Return the size of a vertex (at least 3 for the position)
     */
    public get numProp() {
        return this._numProp;
    }

    private constructor(manifold: any, numProp: number) {
        this._manifold = manifold;
        this._numProp = numProp;
    }

    private _process(operation: "difference" | "intersection" | "union", csg: CSG2) {
        if (this.numProp !== csg.numProp) {
            throw new Error("CSG must have the same number of properties");
        }
        return new CSG2(Manifold[operation](this._manifold, csg._manifold), this.numProp);
    }

    /**
     * Run a difference operation between two CSG
     * @param csg defines the CSG to use to create the difference
     * @returns a new csg
     */
    public difference(csg: CSG2) {
        return this._process("difference", csg);
    }

    /**
     * Run an intersection operation between two CSG
     * @param csg defines the CSG to use to create the intersection
     * @returns a new csg
     */
    public intersection(csg: CSG2) {
        return this._process("intersection", csg);
    }

    /**
     * Run an union operation between two CSG
     * @param csg defines the CSG to use to create the union
     * @returns a new csg
     */
    public union(csg: CSG2) {
        return this._process("union", csg);
    }

    /**
     * Generate a mesh from the CSG
     * @param name defines the name of the mesh
     * @param scene defines the scene to use to create the mesh
     * @returns a new Mesh
     */
    public toMesh(name: string, scene?: Scene) {
        const vertexData = new VertexData();
        const manifoldMesh: IManifoldMesh = this._manifold.getMesh();

        vertexData.indices = manifoldMesh.triVerts;

        const vertexCount = manifoldMesh.vertProperties.length / manifoldMesh.numProp;
        const positions = new Float32Array(vertexCount * 3);
        let normals: Float32Array | undefined;

        for (let i = 0; i < vertexCount; i++) {
            positions[i * 3] = manifoldMesh.vertProperties[i * manifoldMesh.numProp];
            positions[i * 3 + 1] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + 1];
            positions[i * 3 + 2] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + 2];
        }

        if (manifoldMesh.numProp > 3) {
            normals = new Float32Array(vertexCount * 3);

            for (let i = 0; i < vertexCount; i++) {
                normals[i * 3] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + 3];
                normals[i * 3 + 1] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + 4];
                normals[i * 3 + 2] = manifoldMesh.vertProperties[i * manifoldMesh.numProp + 5];
            }
        }

        vertexData.positions = positions;
        if (normals) {
            vertexData.normals = normals;
        }

        const output = new Mesh(name, scene);
        vertexData.applyToMesh(output);

        return output;
    }

    /**
     * Create a new Constructive Solid Geometry from a mesh
     * @param mesh defines the mesh to use to create the CSG
     * @returns a new CSG2 class
     */
    public static FromMesh(mesh: Mesh): any {
        const sourceVertices = mesh.getVerticesData(VertexBuffer.PositionKind);
        const sourceIndices = mesh.getIndices();

        if (!sourceVertices || !sourceIndices) {
            throw new Error("The mesh must have positions and indices");
        }

        const sourceNormals = mesh.getVerticesData(VertexBuffer.NormalKind);

        // Create a triangle run for each group (material) - akin to a draw call.
        const starts = [...Array(mesh.subMeshes.length)].map((_, idx) => mesh.subMeshes[idx].verticesStart);

        // Map the materials to ID.
        const originalIDs = [...Array(mesh.subMeshes.length)].map((_, idx) => mesh.subMeshes[idx].materialIndex);

        // List the runs in sequence.
        const indices = Array.from(starts.keys());
        indices.sort((a, b) => starts[a] - starts[b]);
        const runIndex = new Uint32Array(indices.map((i) => starts[i]));
        const runOriginalID = new Uint32Array(indices.map((i) => originalIDs[i]));

        // Create the MeshGL for I/O with Manifold library.
        const triVerts = new Uint32Array(sourceIndices);

        const mergeData = [sourceVertices];
        let numProp = 3;

        if (sourceNormals) {
            mergeData.push(sourceNormals);
            numProp += 3;
        }

        const vertProperties = new Float32Array(mergeData.reduce((acc, cur) => acc + cur.length, 0));
        const vertexCount = sourceVertices.length / 3;

        for (let i = 0; i < vertexCount; i++) {
            let offset = 0;
            for (const source of mergeData) {
                vertProperties[i * numProp + offset] = source[i * 3];
                vertProperties[i * numProp + offset + 1] = source[i * 3 + 1];
                vertProperties[i * numProp + offset + 2] = source[i * 3 + 2];
                offset += 3;
            }
        }

        const manifoldMesh = new ManifoldMesh({ numProp: numProp, vertProperties, triVerts, runIndex, runOriginalID });
        // Automatically merge vertices with nearly identical positions to create a
        // Manifold. This only fills in the mergeFromVert and mergeToVert vectors -
        // these are automatically filled in for any mesh returned by Manifold. These
        // are necessary because GL drivers require duplicate verts when any
        // properties change, e.g. a UV boundary or sharp corner.
        manifoldMesh.merge();

        return new CSG2(new Manifold(manifoldMesh), numProp);
    }
}

/**
 * Initialize the Manifold library
 * @param options defines the options to use to initialize the library
 */
export async function InitializeCSG2Async(options: Partial<ICSG2Options>) {
    const localOptions = {
        manifoldUrl: "https://unpkg.com/manifold-3d@2.5.1",
        ...options,
    };

    if (localOptions.manifoldInstance) {
        Manifold = localOptions.manifoldInstance;
        return;
    }

    const result = await Tools.LoadScriptModuleAsync(
        `
            import Module from '${localOptions.manifoldUrl}/manifold.js';
            const wasm = await Module();
            wasm.setup();
            const {Manifold, Mesh} = wasm;
            const returnedValue =  {Manifold, Mesh};
        `
    );

    Manifold = result.Manifold;
    ManifoldMesh = result.Mesh;
}
