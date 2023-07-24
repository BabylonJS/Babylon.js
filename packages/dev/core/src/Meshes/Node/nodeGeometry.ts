import { Observable } from "../../Misc/observable";
import type { Nullable} from "../../types";
import { Mesh } from "../mesh";
import type { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import type { MeshOutputBlock } from "./Blocks/meshOutputBlock";
import type { NodeGeometryBlock } from "./nodeGeometryBlock";
import { NodeGeometryBuildState } from "./nodeGeometryBuildState";

/**
 * Defines a node based geometry
 */
export class NodeGeometry {
    private static _BuildIdGenerator: number = 0;
    private _buildId: number = NodeGeometry._BuildIdGenerator++;
    private _buildWasSuccessful = false;
    private _meshOutputBlock: Nullable<MeshOutputBlock> = null;
    private _vertexData: VertexData;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks = new Array<NodeGeometryBlock>();
    
    /**
     * Observable raised when the geometry is built
     */
    public onBuildObservable = new Observable<NodeGeometry>();

    /**
     * Build the material and generates the inner effect
     * @param verbose defines if the build should log activity
     * @param updateBuildId defines if the internal build Id should be updated (default is true)
     * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is true)
     */    
    public build(verbose: boolean = false, updateBuildId = true, autoConfigure = true) {
        this._buildWasSuccessful = false;

        if (!this._meshOutputBlock) {
            throw "You must define a meshOutputNode";
        }

        // Initialize blocks
        this._initializeBlock(this._meshOutputBlock, autoConfigure);

        // Build
        const blocks: NodeGeometryBlock[] = [];
        const state = new NodeGeometryBuildState();

        state.buildId = this._buildId;
        state.verbose = verbose;

        this._meshOutputBlock.build(state, blocks);

        if (updateBuildId) {
            this._buildId = NodeGeometry._BuildIdGenerator++;
        }

        // Errors
        state.emitErrors();

        this._buildWasSuccessful = true;
        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Creates a mesh from the geometry blocks
     * @param name defines the name of the mesh
     * @param scene The scene the mesh is scoped to
     * @returns The new mesh
     */
    public createMesh(name: string, scene: Scene): Mesh {
        if (!this._buildWasSuccessful) {
            throw "You must call build() first";
        }

        const mesh = new Mesh(name, scene);
        this._vertexData.applyToMesh(mesh);
        return mesh;
    }

    private _initializeBlock(node: NodeGeometryBlock, autoConfigure = true) {
        node.initialize();
        if (autoConfigure) {
            node.autoConfigure();
        }
        node._preparationId = this._buildId;

        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }

        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block, autoConfigure);
                }
            }
        }
    }    
}
