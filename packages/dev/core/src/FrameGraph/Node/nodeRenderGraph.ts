import { Observable } from "../../Misc/observable";
import type { Observer } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { RenderGraphOutputBlock } from "./Blocks/outputBlock";
import type { NodeRenderGraphBlock } from "./nodeRenderGraphBlock";
import { FrameGraph } from "../frameGraph";
import { GetClass } from "../../Misc/typeStore";
import { serialize } from "../../Misc/decorators";
import { SerializationHelper } from "../../Misc/decorators.serialization";
import { Constants } from "../../Engines/constants";
import { WebRequest } from "../../Misc/webRequest";
import { RenderGraphInputBlock } from "./Blocks/inputBlock";
import type { NodeRenderGraphTeleportOutBlock } from "./Blocks/Teleport/teleportOutBlock";
import type { NodeRenderGraphTeleportInBlock } from "./Blocks/Teleport/teleportInBlock";
import { Tools } from "../../Misc/tools";
import type { Color4 } from "../../Maths/math.color";
import { Engine } from "../../Engines/engine";
import { NodeRenderGraphBlockConnectionPointTypes } from "./Enums/nodeRenderGraphBlockConnectionPointTypes";
import { RenderGraphClearBlock } from "./Blocks/clearBlock";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import { NodeRenderGraphBuildState } from "./nodeRenderGraphBuildState";

// declare NODERENDERGRAPHEDITOR namespace for compilation issue
declare let NODERENDERGRAPHEDITOR: any;
declare let BABYLON: any;

/**
 * Interface used to configure the frame graph editor
 */
export interface INodeRenderGraphEditorOptions {
    /** Define the URL to load node editor script from */
    editorURL?: string;
    /** Additional configuration for the FGE */
    nodeRenderGraphEditorConfig?: {
        backgroundColor?: Color4;
        hostScene?: Scene;
    };
}

/**
 * Options that can be passed to the frame graph build method
 */
export interface INodeRenderGraphCreateOptions {
    /** if true, textures created by the frame graph will be visible in the inspector, for easier debugging (default: false) */
    debugTextures?: boolean;
    /** Scene in which debugging textures are to be created */
    scene?: Scene;
    /** Rebuild the frame graph when the screen is resized (default: true) */
    rebuildGraphOnEngineResize?: boolean;
    /** defines if the build should log activity (default: false) */
    verbose?: boolean;
    /** defines if the autoConfigure method should be called when initializing blocks (default: false) */
    autoConfigure?: boolean;
}

/**
 * Defines a node render graph
 */
export class NodeRenderGraph {
    private static _BuildIdGenerator: number = 0;

    private _buildId: number = NodeRenderGraph._BuildIdGenerator++;

    /** Define the Url to load node editor script */
    public static EditorURL = `${Tools._DefaultCdnUrl}/v${Engine.Version}/NodeRenderGraph/babylon.nodeRenderGraph.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private BJSNODERENDERGRAPHEDITOR = this._getGlobalNodeRenderGraphEditor();

    /** @returns the inspector from bundle or global */
    private _getGlobalNodeRenderGraphEditor(): any {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof NODERENDERGRAPHEDITOR !== "undefined") {
            return NODERENDERGRAPHEDITOR;
        }

        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.NodeRenderGraphEditor !== "undefined") {
            return BABYLON;
        }

        return undefined;
    }

    /**
     * Gets or sets data used by visual editor
     * @see https://fge.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks: NodeRenderGraphBlock[] = [];

    /**
     * Observable raised when the frame graph is built
     */
    public onBuildObservable = new Observable<NodeRenderGraph>();

    /** Gets or sets the FrameGraphOutputBlock used to gather the final frame graph data */
    public outputBlock: Nullable<RenderGraphOutputBlock> = null;

    /**
     * Snippet ID if the graph was created from the snippet server
     */
    public snippetId: string;

    /**
     * The name of the frame graph
     */
    @serialize()
    public name: string;

    /**
     * A free comment about the graph
     */
    @serialize("comment")
    public comment: string;

    private _engine: AbstractEngine;
    private _resizeObserver: Nullable<Observer<AbstractEngine>> = null;
    private _frameGraph: FrameGraph;
    private _options: INodeRenderGraphCreateOptions;

    /**
     * Creates a new frame graph
     * @param name defines the name of the frame graph
     * @param engine defines the engine to use to execute the graph
     * @param options defines the options to use when creating the graph
     */
    public constructor(name: string, engine: AbstractEngine, options?: INodeRenderGraphCreateOptions) {
        this.name = name;
        this._engine = engine;

        options = {
            debugTextures: false,
            scene: undefined,
            autoConfigure: false,
            verbose: false,
            ...options,
        };

        this._options = options;

        this._frameGraph = new FrameGraph(engine, options.debugTextures, options.scene);

        if (options.rebuildGraphOnEngineResize) {
            this._resizeObserver = this._engine.onResizeObservable.add(() => {
                this.build();
            });
        }
    }

    /**
     * Gets the current class name ("NodeRenderGraph")
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeRenderGraph";
    }

    /**
     * Gets a block by its name
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
    public getBlockByPredicate(predicate: (block: NodeRenderGraphBlock) => boolean) {
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
        const blocks: RenderGraphInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as RenderGraphInputBlock);
            }
        }

        return blocks;
    }

    /**
     * Launch the frame graph editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    public edit(config?: INodeRenderGraphEditorOptions): Promise<void> {
        return new Promise((resolve) => {
            this.BJSNODERENDERGRAPHEDITOR = this.BJSNODERENDERGRAPHEDITOR || this._getGlobalNodeRenderGraphEditor();
            if (typeof this.BJSNODERENDERGRAPHEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : NodeRenderGraph.EditorURL;

                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSNODERENDERGRAPHEDITOR = this.BJSNODERENDERGRAPHEDITOR || this._getGlobalNodeRenderGraphEditor();
                    this._createNodeEditor(config?.nodeRenderGraphEditorConfig);
                    resolve();
                });
            } else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.nodeRenderGraphEditorConfig);
                resolve();
            }
        });
    }

    /**
     * Creates the node editor window.
     * @param additionalConfig Additional configuration for the FGE
     */
    private _createNodeEditor(additionalConfig?: any) {
        const nodeEditorConfig: any = {
            frameGraph: this,
            ...additionalConfig,
        };
        this.BJSNODERENDERGRAPHEDITOR.FrameGraphEditor.Show(nodeEditorConfig);
    }

    /**
     * Build the final list of blocks that will be executed by the "execute" method
     */
    public build() {
        if (!this.outputBlock) {
            throw new Error("You must define the outputBlock property before building the frame graph");
        }

        this._initializeBlock(this.outputBlock);

        this._frameGraph.clear();

        const state = new NodeRenderGraphBuildState();

        state.buildId = this._buildId;
        state.verbose = this._options.verbose!;
        state.frameGraph = this._frameGraph;

        this.outputBlock.build(state);

        this._frameGraph.build();

        this._buildId = NodeRenderGraph._BuildIdGenerator++;

        state.emitErrors();

        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Returns a promise that resolves when the frame graph is ready to be executed
     * This method must be called after the graph has been built (FrameGraph.build called)!
     * @param timeout Timeout in ms between retries (default is 16)
     * @returns The promise that resolves when the graph is ready
     */
    public whenReadyAsync(timeout = 16): Promise<void> {
        return this._frameGraph.whenReadyAsync(timeout);
    }

    /**
     * Execute the graph (the graph must have been built before!)
     */
    public execute() {
        this._frameGraph.execute();
    }

    private _initializeBlock(node: NodeRenderGraphBlock) {
        node.initialize();
        if (this._options.autoConfigure) {
            node.autoConfigure();
        }

        if (this.attachedBlocks.indexOf(node) === -1) {
            this.attachedBlocks.push(node);
        }

        for (const input of node.inputs) {
            const connectedPoint = input.connectedPoint;
            if (connectedPoint) {
                const block = connectedPoint.ownerBlock;
                if (block !== node) {
                    this._initializeBlock(block);
                }
            }
        }
    }

    /**
     * Clear the current graph
     */
    public clear() {
        this.outputBlock = null;
        this.attachedBlocks.length = 0;
    }

    /**
     * Remove a block from the current graph
     * @param block defines the block to remove
     */
    public removeBlock(block: NodeRenderGraphBlock) {
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
     * @param source defines the JSON representation of the graph
     * @param merge defines whether or not the source must be merged or replace the current content
     */
    public parseSerializedObject(source: any, merge = false) {
        if (!merge) {
            this.clear();
        }

        const map: { [key: number]: NodeRenderGraphBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const additionalConstructionParameters = parsedBlock.additionalConstructionParameters;
                const block: NodeRenderGraphBlock = additionalConstructionParameters
                    ? new blockType("", this._engine, ...additionalConstructionParameters)
                    : new blockType("", this._engine);
                block._deserialize(parsedBlock);
                map[parsedBlock.id] = block;

                this.attachedBlocks.push(block);
            }
        }

        // Reconnect teleportation
        for (const block of this.attachedBlocks) {
            if (block.isTeleportOut) {
                const teleportOut = block as NodeRenderGraphTeleportOutBlock;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id] as NodeRenderGraphTeleportInBlock;
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
            this.outputBlock = map[source.outputNodeId] as RenderGraphOutputBlock;
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

    private _restoreConnections(block: NodeRenderGraphBlock, source: any, map: { [key: number]: NodeRenderGraphBlock }) {
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
     * Generate a string containing the code declaration required to create an equivalent of this frame graph
     * @returns a string
     */
    public generateCode() {
        let alreadyDumped: NodeRenderGraphBlock[] = [];
        const blocks: NodeRenderGraphBlock[] = [];
        const uniqueNames: string[] = ["const", "var", "let"];
        // Gets active blocks
        if (this.outputBlock) {
            this._gatherBlocks(this.outputBlock, blocks);
        }

        // Generate
        const options = JSON.stringify(this._options, (key, value) => {
            if (key === "scene") {
                return "#scene#";
            }
            return value;
        });
        let codeString = `let frameGraph = new BABYLON.FrameGraph("${this.name || "frame graph"}", engine, ${options.replace('"#scene#"', "scene")});\n`;
        for (const node of blocks) {
            if (node.isInput && alreadyDumped.indexOf(node) === -1) {
                codeString += node._dumpCode(uniqueNames, alreadyDumped) + "\n";
            }
        }

        if (this.outputBlock) {
            // Connections
            alreadyDumped = [];
            codeString += "// Connections\n";
            codeString += this.outputBlock._dumpCodeForOutputConnections(alreadyDumped);

            // Output nodes
            codeString += "// Output nodes\n";
            codeString += `frameGraph.outputBlock = ${this.outputBlock._codeVariableName};\n`;
            codeString += `frameGraph.build();\n`;
        }

        return codeString;
    }

    private _gatherBlocks(rootNode: NodeRenderGraphBlock, list: NodeRenderGraphBlock[]) {
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
            const block = rootNode as NodeRenderGraphTeleportOutBlock;
            if (block.entryPoint) {
                this._gatherBlocks(block.entryPoint, list);
            }
        }
    }

    /**
     * Clear the current graph and set it to a default state
     */
    public setToDefault() {
        this.clear();

        this.editorData = null;

        // Source
        const backBuffer = new RenderGraphInputBlock("BackBuffer", this._engine, NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer);

        // Clear texture
        const clear = new RenderGraphClearBlock("Clear", this._engine);

        backBuffer.output.connectTo(clear.texture);

        // Final output
        const output = new RenderGraphOutputBlock("Frame graph Output", this._engine);
        clear.output.connectTo(output.texture);

        this.outputBlock = output;
    }

    /**
     * Makes a duplicate of the current frame graph.
     * @param name defines the name to use for the new frame graph
     * @returns the new frame graph
     */
    public clone(name: string): NodeRenderGraph {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new NodeRenderGraph(name, this._engine), this);
        clone.name = name;

        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;
        clone.build();

        return clone;
    }

    /**
     * Serializes this frame graph in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole frame graph will be saved)
     * @returns the serialized frame graph object
     */
    public serialize(selectedBlocks?: NodeRenderGraphBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeRenderGraphBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.FrameGraph";
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

        this._frameGraph.dispose();
        this._frameGraph = undefined as any;

        this._engine.onResizeObservable.remove(this._resizeObserver);
        this._resizeObserver = null;

        this.attachedBlocks.length = 0;
        this.onBuildObservable.clear();
    }

    /**
     * Creates a new frame graph set to default basic configuration
     * @param name defines the name of the frame graph
     * @param engine defines the engine to use
     * @param frameGraphOptions defines options to use when creating the frame graph
     * @returns a new FrameGraph
     */
    public static CreateDefault(name: string, engine: AbstractEngine, frameGraphOptions?: INodeRenderGraphCreateOptions): NodeRenderGraph {
        const frameGraph = new NodeRenderGraph(name, engine, frameGraphOptions);

        frameGraph.setToDefault();
        frameGraph.build();

        return frameGraph;
    }

    /**
     * Creates a frame graph from parsed graph data
     * @param source defines the JSON representation of the frame graph
     * @param engine defines the engine to use
     * @param frameGraphOptions defines options to use when creating the frame graph
     * @param skipBuild defines whether to skip building the frame graph (default is true)
     * @returns a new frame graph
     */
    public static Parse(source: any, engine: AbstractEngine, frameGraphOptions?: INodeRenderGraphCreateOptions, skipBuild: boolean = true): NodeRenderGraph {
        const frameGraph = SerializationHelper.Parse(() => new NodeRenderGraph(source.name, engine, frameGraphOptions), source, null);

        frameGraph.parseSerializedObject(source);
        if (!skipBuild) {
            frameGraph.build();
        }

        return frameGraph;
    }

    /**
     * Creates a frame graph from a snippet saved by the frame graph editor
     * @param snippetId defines the snippet to load
     * @param engine defines the engine to use
     * @param frameGraphOptions defines options to use when creating the frame graph
     * @param frameGraph defines a frame graph to update (instead of creating a new one)
     * @param skipBuild defines whether to skip building the frame graph (default is true)
     * @returns a promise that will resolve to the new frame graph
     */
    public static ParseFromSnippetAsync(
        snippetId: string,
        engine: AbstractEngine,
        frameGraphOptions?: INodeRenderGraphCreateOptions,
        frameGraph?: NodeRenderGraph,
        skipBuild: boolean = true
    ): Promise<NodeRenderGraph> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(NodeRenderGraph.CreateDefault("blank", engine, frameGraphOptions));
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.FrameGraph);

                        if (!frameGraph) {
                            frameGraph = SerializationHelper.Parse(() => new NodeRenderGraph(snippetId, engine, frameGraphOptions), serializationObject, null);
                        }

                        frameGraph.parseSerializedObject(serializationObject);
                        frameGraph.snippetId = snippetId;

                        try {
                            if (!skipBuild) {
                                frameGraph.build();
                            }
                            resolve(frameGraph);
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
