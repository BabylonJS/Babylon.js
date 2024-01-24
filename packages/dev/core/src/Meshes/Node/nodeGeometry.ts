import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
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
import { PrecisionDate } from "../../Misc/precisionDate";
import type { TeleportOutBlock } from "./Blocks/Teleport/teleportOutBlock";
import type { TeleportInBlock } from "./Blocks/Teleport/teleportInBlock";
import { Tools } from "../../Misc/tools";
import type { Color4 } from "../../Maths/math.color";
import { Engine } from "../../Engines/engine";

// declare NODEGEOMETRYEDITOR namespace for compilation issue
declare let NODEGEOMETRYEDITOR: any;
declare let BABYLON: any;

/**
 * Interface used to configure the node geometry editor
 */
export interface INodeGeometryEditorOptions {
    /** Define the URL to load node editor script from */
    editorURL?: string;
    /** Additional configuration for the NGE */
    nodeGeometryEditorConfig?: {
        backgroundColor?: Color4;
        hostScene?: Scene;
        hostMesh?: Mesh;
    };
}

/**
 * Defines a node based geometry
 * @see demo at https://playground.babylonjs.com#PYY6XE#69
 */
export class NodeGeometry {
    private static _BuildIdGenerator: number = 0;
    private _buildId: number = NodeGeometry._BuildIdGenerator++;
    private _buildWasSuccessful = false;
    private _vertexData: Nullable<VertexData> = null;
    private _buildExecutionTime: number = 0;

    /** Define the Url to load node editor script */
    public static EditorURL = `${Tools._DefaultCdnUrl}/v${Engine.Version}/nodeGeometryEditor/babylon.nodeGeometryEditor.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private BJSNODEGEOMETRYEDITOR = this._getGlobalNodeGeometryEditor();

    /** @returns the inspector from bundle or global */
    private _getGlobalNodeGeometryEditor(): any {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODEGEOMETRYEDITOR !== "undefined") {
            return NODEGEOMETRYEDITOR;
        }

        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeGeometryEditor !== "undefined") {
            return BABYLON;
        }

        return undefined;
    }

    /**
     * Gets the time spent to build this block (in ms)
     */
    public get buildExecutionTime() {
        return this._buildExecutionTime;
    }

    /**
     * Gets or sets data used by visual editor
     * @see https://nge.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks: NodeGeometryBlock[] = [];

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
     * Get a block by its name
     * @param name defines the name of the block to retrieve
     * @returns the required block or null if not found
     */
    public getBlockByName(name: string) {
        let result = null;
        for (const block of this.attachedBlocks) {
            if (block.name === name) {
                if (!result) {
                    result = block;
                } else {
                    Tools.Warn("More than one block was found with the name `" + name + "`");
                    return result;
                }
            }
        }

        return result;
    }

    /**
     * Get a block using a predicate
     * @param predicate defines the predicate used to find the good candidate
     * @returns the required block or null if not found
     */
    public getBlockByPredicate(predicate: (block: NodeGeometryBlock) => boolean) {
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                return block;
            }
        }

        return null;
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
     * Launch the node geometry editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    public edit(config?: INodeGeometryEditorOptions): Promise<void> {
        return new Promise((resolve) => {
            this.BJSNODEGEOMETRYEDITOR = this.BJSNODEGEOMETRYEDITOR || this._getGlobalNodeGeometryEditor();
            if (typeof this.BJSNODEGEOMETRYEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeGeometry.EditorURL;

                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODEGEOMETRYEDITOR = this.BJSNODEGEOMETRYEDITOR || this._getGlobalNodeGeometryEditor();
                    this._createNodeEditor(config?.nodeGeometryEditorConfig);
                    resolve();
                });
            } else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.nodeGeometryEditorConfig);
                resolve();
            }
        });
    }

    /**
     * Creates the node editor window.
     * @param additionalConfig Additional configuration for the NGE
     */
    private _createNodeEditor(additionalConfig?: any) {
        const nodeEditorConfig: any = {
            nodeGeometry: this,
            ...additionalConfig,
        };
        this.BJSNODEGEOMETRYEDITOR.NodeGeometryEditor.Show(nodeEditorConfig);
    }

    /**
     * Build the final geometry
     * @param verbose defines if the build should log activity
     * @param updateBuildId defines if the internal build Id should be updated (default is true)
     * @param autoConfigure defines if the autoConfigure method should be called when initializing blocks (default is false)
     */
    public build(verbose: boolean = false, updateBuildId = true, autoConfigure = false) {
        this._buildWasSuccessful = false;

        if (!this.outputBlock) {
            // eslint-disable-next-line no-throw-literal
            throw "You must define the outputBlock property before building the geometry";
        }
        const now = PrecisionDate.Now;
        // Initialize blocks
        this._initializeBlock(this.outputBlock, autoConfigure);

        // Build
        const state = new NodeGeometryBuildState();

        state.buildId = this._buildId;
        state.verbose = verbose;

        this.outputBlock.build(state);

        if (updateBuildId) {
            this._buildId = NodeGeometry._BuildIdGenerator++;
        }

        this._buildExecutionTime = PrecisionDate.Now - now;

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

        mesh._internalMetadata = mesh._internalMetadata || {};
        mesh._internalMetadata.nodeGeometry = this;

        return mesh;
    }

    /**
     * Creates a mesh from the geometry blocks
     * @param mesh the mesh to update
     * @returns True if successfully updated
     */
    public updateMesh(mesh: Mesh) {
        if (!this._buildWasSuccessful) {
            this.build();
        }

        if (!this._vertexData) {
            return false;
        }

        this._vertexData.applyToMesh(mesh);

        mesh._internalMetadata = mesh._internalMetadata || {};
        mesh._internalMetadata.nodeGeometry = this;

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
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public parseSerializedObject(source: any, merge = false) {
        if (!merge) {
            this.clear();
        }

        const map: { [key: number]: NodeGeometryBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const block: NodeGeometryBlock = new blockType();
                block._deserialize(parsedBlock);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);
            }
        }

        // Reconnect teleportation
        for (const block of this.attachedBlocks) {
            if (block.isTeleportOut) {
                const teleportOut = block as TeleportOutBlock;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id] as TeleportInBlock;
                    if (source) {
                        source.attachToEndpoint(teleportOut);
                    }
                }
            }
        }

        // Connections - Starts with input blocks only (except if in "merge" mode where we scan all blocks)
        for (let blockIndex = 0; blockIndex < source.blocks.length; blockIndex++) {
            const parsedBlock = source.blocks[blockIndex];
            const block = map[parsedBlock.id];

            if (!block) {
                continue;
            }

            if (block.inputs.length && parsedBlock.inputs.some((i: any) => i.targetConnectionName) && !merge) {
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
        let codeString = `let nodeGeometry = new BABYLON.NodeGeometry("${this.name || "node geometry"}");\n`;
        for (const node of blocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        if (this.outputBlock) {
            // Connections
            alreadyDumped = [];
            codeString += "// Connections\n";
            codeString += this.outputBlock._dumpCodeForOutputConnections(alreadyDumped);

            // Output nodes
            codeString += "// Output nodes\n";
            codeString += `nodeGeometry.outputBlock = ${this.outputBlock._codeVariableName};\n`;
            codeString += `nodeGeometry.build();\n`;
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

        // Teleportation
        if (rootNode.isTeleportOut) {
            const block = rootNode as TeleportOutBlock;
            if (block.entryPoint) {
                this._gatherBlocks(block.entryPoint, list);
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
        dataBlock.autoConfigure();

        // Final output
        const output = new GeometryOutputBlock("Geometry Output");
        dataBlock.geometry.connectTo(output.geometry);

        this.outputBlock = output;
    }

    /**
     * Makes a duplicate of the current geometry.
     * @param name defines the name to use for the new geometry
     * @returns the new geometry
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
     * @param selectedBlocks defines the list of blocks to save (if null the whole geometry will be saved)
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
     * @returns a new node geometry
     */
    public static Parse(source: any): NodeGeometry {
        const nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(source.name), source, null);

        nodeGeometry.parseSerializedObject(source);
        nodeGeometry.build();

        return nodeGeometry;
    }

    /**
     * Creates a node geometry from a snippet saved by the node geometry editor
     * @param snippetId defines the snippet to load
     * @param nodeGeometry defines a node geometry to update (instead of creating a new one)
     * @param skipBuild defines whether to build the node geometry
     * @returns a promise that will resolve to the new node geometry
     */
    public static ParseFromSnippetAsync(snippetId: string, nodeGeometry?: NodeGeometry, skipBuild: boolean = false): Promise<NodeGeometry> {
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
                            nodeGeometry = SerializationHelper.Parse(() => new NodeGeometry(snippetId), serializationObject, null);
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
