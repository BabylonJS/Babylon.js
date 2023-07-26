import { Observable } from "../../Misc/observable";
import type { Nullable} from "../../types";
import { Mesh } from "../mesh";
import type { VertexData } from "../mesh.vertexData";
import type { Scene } from "../../scene";
import { GeometryOutputBlock } from "./Blocks/geometryOutputBlock";
import type { NodeGeometryBlock } from "./nodeGeometryBlock";
import { NodeGeometryBuildState } from "./nodeGeometryBuildState";
import { GetClass } from "../../Misc/typeStore";
import { SerializationHelper, serialize } from "../../Misc/decorators";
import { Constants } from "../../Engines/constants";
import { WebRequest } from "../../Misc/webRequest";
import { BoxBlock } from "./Blocks/Sources/boxBlock";
import type { GeometryInputBlock } from "./Blocks/geometryInputBlock";

/**
 * Defines a node based geometry
 */
export class NodeGeometry {
    private static _BuildIdGenerator: number = 0;
    private _buildId: number = NodeGeometry._BuildIdGenerator++;
    private _buildWasSuccessful = false;
    private _vertexData: Nullable<VertexData> = null;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;    

    /**
     * Gets or sets data used by visual editor
     * @see https://nge.babylonjs.com
     */
    public editorData: any = null;    

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks = new Array<NodeGeometryBlock>();
    
    /**
     * Observable raised when the geometry is built
     */
    public onBuildObservable = new Observable<NodeGeometry>();

    /** Gets or sets the GeometryOutputBlock used to gather the final geometry data */
    public outputBlock: Nullable<GeometryOutputBlock> = null;

    /**
     * Snippet ID if the material was created from the snippet server
     */
    public snippetId: string;    

    /**
     * The name of the geometry
     */
    @serialize()
    public name: string;    

    /**
     * A free comment about the geometry
     */
    @serialize("comment")
    public comment: string;    

    /**
     * Creates a new geometry
     * @param name defines the name of the geometry
     */
    public constructor(name: string) {
        this.name = name;
    }

    /**
     * Gets the current class name of the geometry e.g. "NodeGeometry"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeGeometry";
    }    

    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    public getInputBlocks() {
        const blocks: GeometryInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as GeometryInputBlock);
            }
        }

        return blocks;
    }    

    /**
     * Build the material and generates the inner effect
     * @param verbose defines if the build should log activity
     * @param updateBuildId defines if the internal build Id should be updated (default is true)
     * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is true)
     */    
    public build(verbose: boolean = false, updateBuildId = true, autoConfigure = true) {
        this._buildWasSuccessful = false;

        if (!this.outputBlock) {
            throw "You must define the outputBlock property before building the geometry";
        }

        // Initialize blocks
        this.attachedBlocks = [];
        this._initializeBlock(this.outputBlock, autoConfigure);

        // Build
        const state = new NodeGeometryBuildState();

        state.buildId = this._buildId;
        state.verbose = verbose;

        this.outputBlock.build(state);

        if (updateBuildId) {
            this._buildId = NodeGeometry._BuildIdGenerator++;
        }

        // Errors
        state.emitErrors();

        this._buildWasSuccessful = true;
        this._vertexData = state.vertexData;
        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Creates a mesh from the geometry blocks
     * @param name defines the name of the mesh
     * @param scene The scene the mesh is scoped to
     * @returns The new mesh
     */
    public createMesh(name: string, scene: Nullable<Scene> = null): Nullable<Mesh> {
        if (!this._buildWasSuccessful) {
            this.build();
        }

        if (!this._vertexData) {
            return null;
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

    /**
     * Clear the current geometry
     */
    public clear() {
        this.outputBlock = null;
        this.attachedBlocks.length = 0;
    }    

    /**
     * Remove a block from the current geometry
     * @param block defines the block to remove
     */
    public removeBlock(block: NodeGeometryBlock) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }

        if (block === this.outputBlock) {
            this.outputBlock = null;
        }
    }    
    
    /**
     * Clear the current graph and load a new one from a serialization object
     * @param source defines the JSON representation of the geometry
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public parseSerializedObject(source: any, rootUrl: string = "", merge = false) {
        if (!merge) {
            this.clear();
        }

        const map: { [key: number]: NodeGeometryBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const block: NodeGeometryBlock = new blockType();
                block._deserialize(parsedBlock, rootUrl);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);
            }
        }

        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (let blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            const parsedBlock = source.blocks[blockIndex];
            const block = map[parsedBlock.id];

            if (!block) {
                continue;
            }

            if (block.inputs.length && !merge) {
                continue;
            }
            this._restoreConnections(block, source, map);
        }

        // Outputs
        if (source.outputNodeId) {
            this.outputBlock = map[source.outputNodeId] as GeometryOutputBlock;
        }

        // UI related info
        if (source.locations || (source.editorData && source.editorData.locations)) {
            const locations: {
                blockId: number;
                x: number;
                y: number;
            }[] = source.locations || source.editorData.locations;

            for (const location of locations) {
                if (map[location.blockId]) {
                    location.blockId = map[location.blockId].uniqueId;
                }
            }

            if (merge && this.editorData && this.editorData.locations) {
                locations.concat(this.editorData.locations);
            }

            if (source.locations) {
                this.editorData = {
                    locations: locations,
                };
            } else {
                this.editorData = source.editorData;
                this.editorData.locations = locations;
            }

            const blockMap: number[] = [];

            for (const key in map) {
                blockMap[key] = map[key].uniqueId;
            }

            this.editorData.map = blockMap;
        }

        this.comment = source.comment;
    }

    private _restoreConnections(block: NodeGeometryBlock, source: any, map: { [key: number]: NodeGeometryBlock }) {
        for (const outputPoint of block.outputs) {
            for (const candidate of source.blocks) {
                const target = map[candidate.id];

                if (!target) {
                    continue;
                }

                for (const input of candidate.inputs) {
                    if (map[input.targetBlockId] === block && input.targetConnectionName === outputPoint.name) {
                        const inputPoint = target.getInputByName(input.inputName);
                        if (!inputPoint || inputPoint.isConnected) {
                            continue;
                        }

                        outputPoint.connectTo(inputPoint, true);
                        this._restoreConnections(target, source, map);
                        continue;
                    }
                }
            }
        }
    }  
    
    /**
     * Generate a string containing the code declaration required to create an equivalent of this geometry
     * @returns a string
     */
    public generateCode() {
        let alreadyDumped: NodeGeometryBlock[] = [];
        const blocks: NodeGeometryBlock[] = [];
        const uniqueNames: string[] = ["const", "var", "let"];
        // Gets active blocks
        if (this.outputBlock) {
            this._gatherBlocks(this.outputBlock, blocks);
        }


        // Generate
        let codeString = `var nodeGeometry = new BABYLON.NodeGeometry("${this.name || "node geometry"}");\r\n`;
        for (const node of blocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        if (this.outputBlock) {
            // Connections
            alreadyDumped = [];
            codeString += "\r\n// Connections\r\n";
            codeString += this.outputBlock._dumpCodeForOutputConnections(alreadyDumped);

            // Output nodes
            codeString += "\r\n// Output nodes\r\n";
            codeString += `nodeGeometry.outputBlock = ${this.outputBlock._codeVariableName};\r\n`;
            codeString += `nodeGeometry.build();\r\n`;
        }

        return codeString;
    }    

    private _gatherBlocks(rootNode: NodeGeometryBlock, list: NodeGeometryBlock[]) {
        if (list.indexOf(rootNode) !== -1) {
            return;
        }
        list.push(rootNode);

        for (const input of rootNode.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== rootNode) {
                    this._gatherBlocks(block, list);
                }
            }
        }
    }    

    /**
     * Clear the current geometry and set it to a default state
     */
    public setToDefault() {
        this.clear();

        this.editorData = null;

        // Source
        const dataBlock = new BoxBlock("Box");

        // Final output
        const output = new GeometryOutputBlock("Geometry Output");
        dataBlock.geometry.connectTo(output.geometry);

        this.outputBlock = output;
    }    

    /**
     * Makes a duplicate of the current geometry.
     * @param name defines the name to use for the new geometry
     */
    public clone(name: string): NodeGeometry {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new NodeGeometry(name), this);
        clone.name = name;

        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;
        clone.build(false);

        return clone;
    }    

    /**
     * Serializes this geometry in a JSON representation
     * @param selectedBlocks
     * @returns the serialized geometry object
     */
    public serialize(selectedBlocks?: NodeGeometryBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeGeometryBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.NodeGeometry";
            if (this.outputBlock) {
                serializationObject.outputNodeId = this.outputBlock.uniqueId;
            }
        }

        // Blocks
        serializationObject.blocks = [];

        for (const block of blocks) {
            serializationObject.blocks.push(block.serialize());
        }

        if (!selectedBlocks) {
            if (!this.attachedBlocks.length) {
                this,this.build();
            }
            for (const block of this.attachedBlocks) {
                if (blocks.indexOf(block) !== -1) {
                    continue;
                }
                serializationObject.blocks.push(block.serialize());
            }
        }

        return serializationObject;
    }      

    /**
     * Disposes the ressources
     */
    public dispose(): void {
        for (const block of this.attachedBlocks) {
            block.dispose();
        }

        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
    }    

    /**
     * Creates a new node geometry set to default basic configuration
     * @param name defines the name of the geometry
     * @returns a new NodeGeometry
     */
    public static CreateDefault(name: string) {
        const nodeGeometry = new NodeGeometry(name);

        nodeGeometry.setToDefault();
        nodeGeometry.build();

        return nodeGeometry;
    }    

    /**
     * Creates a node geometry from parsed geometry data
     * @param source defines the JSON representation of the geometry
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new node geometry
     */
    public static Parse(source: any, rootUrl: string = ""): NodeGeometry {
        const nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(source.name), source, null, rootUrl);

        nodeGeometry.parseSerializedObject(source, rootUrl);
        nodeGeometry.build();

        return nodeGeometry;
    }    

    /**
     * Creates a node geometry from a snippet saved by the node geometry editor
     * @param snippetId defines the snippet to load
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @param nodeGeometry defines a node geometry to update (instead of creating a new one)
     * @param skipBuild defines whether to build the node geometry
     * @returns a promise that will resolve to the new node geometry
     */
    public static ParseFromSnippetAsync(
        snippetId: string,
        rootUrl: string = "",
        nodeGeometry?: NodeGeometry,
        skipBuild: boolean = false
    ): Promise<NodeGeometry> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeGeometry.CreateDefault("blank"));
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeGeometry);

                        if (!nodeGeometry) {
                            nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(snippetId), serializationObject, null, rootUrl);
                        }

                        nodeGeometry.parseSerializedObject(serializationObject);
                        nodeGeometry.snippetId = snippetId;

                        try {
                            if (!skipBuild) {
                                nodeGeometry.build();
                            }
                            resolve(nodeGeometry);
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }    
}
