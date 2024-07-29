import { Observable } from "../Misc/observable";
import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { FrameGraphOutputBlock } from "./Blocks/frameGraphOutputBlock";
import type { FrameGraphBlock } from "./frameGraphBlock";
import { FrameGraphBuilder } from "./frameGraphBuilder";
import { GetClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { Constants } from "../Engines/constants";
import { WebRequest } from "../Misc/webRequest";
import { FrameGraphInputBlock } from "./Blocks/frameGraphInputBlock";
import type { FrameGraphTeleportOutBlock } from "./Blocks/Teleport/frameGraphTeleportOutBlock";
import type { FrameGraphTeleportInBlock } from "./Blocks/Teleport/frameGraphTeleportInBlock";
import { Tools } from "../Misc/tools";
import type { Color4 } from "../Maths/math.color";
import { Engine } from "../Engines/engine";
import { FrameGraphBlockConnectionPointTypes } from "./Enums/frameGraphBlockConnectionPointTypes";
import { FrameGraphClearBlock } from "./Blocks/frameGraphClearBlock";
import type { AbstractEngine } from "../Engines/abstractEngine";

// declare FRAMEGRAPHEDITOR namespace for compilation issue
declare let FRAMEGRAPHEDITOR: any;
declare let BABYLON: any;

/**
 * Interface used to configure the frame graph editor
 */
export interface IFrameGraphEditorOptions {
    /** Define the URL to load node editor script from */
    editorURL?: string;
    /** Additional configuration for the FGE */
    frameGraphEditorConfig?: {
        backgroundColor?: Color4;
        hostScene?: Scene;
    };
}

/**
 * Options that can be passed to the frame graph build method
 */
export interface IFrameGraphCreateOptions {
    /** if true, textures created by the frame graph will be visible in the inspector, for easier debugging (default: false) */
    debugTextures?: boolean;
    /** Scene in which debugging textures are to be created */
    scene?: Scene;
    /** Rebuild the frame graph when the screen is resized (default: true) */
    rebuildGraphOnEngineResize?: boolean;
    /** defines if the build should log activity (default: false) */
    verbose?: boolean;
    /** defines if the internal build Id should be updated (default: true) */
    updateBuildId?: boolean;
    /** defines if the autoConfigure method should be called when initializing blocks (default: false) */
    autoConfigure?: boolean;
}

/**
 * Defines a frame graph
 */
export class FrameGraph {
    private static _BuildIdGenerator: number = 0;

    private _buildId: number = FrameGraph._BuildIdGenerator++;

    /** Define the Url to load node editor script */
    public static EditorURL = `${Tools._DefaultCdnUrl}/v${Engine.Version}/FrameGraphEditor/babylon.FrameGraphEditor.js`;

    /** Define the Url to load snippets */
    public static SnippetUrl = Constants.SnippetUrl;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private BJSFRAMEGRAPHEDITOR = this._getGlobalFrameGraphEditor();

    /** @returns the inspector from bundle or global */
    private _getGlobalFrameGraphEditor(): any {
        // UMD Global name detection from Webpack Bundle UMD Name.
        if (typeof FRAMEGRAPHEDITOR !== "undefined") {
            return FRAMEGRAPHEDITOR;
        }

        // In case of module let's check the global emitted from the editor entry point.
        if (typeof BABYLON !== "undefined" && typeof BABYLON.FrameGraphEditor !== "undefined") {
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
    public attachedBlocks: FrameGraphBlock[] = [];

    /**
     * Observable raised when the frame graph is built
     */
    public onBuildObservable = new Observable<FrameGraph>();

    /** Gets or sets the FrameGraphOutputBlock used to gather the final frame graph data */
    public outputBlock: Nullable<FrameGraphOutputBlock> = null;

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

    private _executedBlocks: FrameGraphBlock[] = [];
    private _engine: AbstractEngine;
    private _resizeObserver: Nullable<Observer<AbstractEngine>> = null;
    private _frameGraphBuilder: FrameGraphBuilder;
    private _options: IFrameGraphCreateOptions;

    /**
     * Creates a new frame graph
     * @param name defines the name of the frame graph
     * @param engine defines the engine to use to execute the graph
     * @param options defines the options to use when creating the graph
     */
    public constructor(name: string, engine: AbstractEngine, options?: IFrameGraphCreateOptions) {
        this.name = name;
        this._engine = engine;

        options = {
            debugTextures: false,
            scene: undefined,
            autoConfigure: false,
            verbose: false,
            updateBuildId: true,
            ...options,
        };

        this._options = options;

        this._frameGraphBuilder = new FrameGraphBuilder(engine, options.debugTextures, options.scene, options.verbose);

        if (options.rebuildGraphOnEngineResize) {
            this._resizeObserver = this._engine.onResizeObservable.add(() => {
                this.build();
            });
        }
    }

    /**
     * Gets the current class name ("FrameGraph")
     * @returns the class name
     */
    public getClassName(): string {
        return "FrameGraph";
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
    public getBlockByPredicate(predicate: (block: FrameGraphBlock) => boolean) {
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
        const blocks: FrameGraphInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as FrameGraphInputBlock);
            }
        }

        return blocks;
    }

    /**
     * Launch the frame graph editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    public edit(config?: IFrameGraphEditorOptions): Promise<void> {
        return new Promise((resolve) => {
            this.BJSFRAMEGRAPHEDITOR = this.BJSFRAMEGRAPHEDITOR || this._getGlobalFrameGraphEditor();
            if (typeof this.BJSFRAMEGRAPHEDITOR == "undefined") {
                const editorUrl = config && config.editorURL ? config.editorURL : FrameGraph.EditorURL;

                // Load editor and add it to the DOM
                Tools.LoadBabylonScript(editorUrl, () => {
                    this.BJSFRAMEGRAPHEDITOR = this.BJSFRAMEGRAPHEDITOR || this._getGlobalFrameGraphEditor();
                    this._createNodeEditor(config?.frameGraphEditorConfig);
                    resolve();
                });
            } else {
                // Otherwise creates the editor
                this._createNodeEditor(config?.frameGraphEditorConfig);
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
        this.BJSFRAMEGRAPHEDITOR.FrameGraphEditor.Show(nodeEditorConfig);
    }

    /**
     * Build the final list of blocks that will be executed by the "execute" method
     * @param removeFalseBlocks if true, the blocks whose executeCondition evaluates to false at build time will be removed from the execution list (default: false)
     */
    public build(removeFalseBlocks = false) {
        if (!this.outputBlock) {
            throw new Error("You must define the outputBlock property before building the frame graph");
        }

        this._initializeBlock(this.outputBlock, removeFalseBlocks);

        this._frameGraphBuilder.buildId = this._buildId;

        this._frameGraphBuilder._startBuild();
        this.outputBlock.build(this._frameGraphBuilder, removeFalseBlocks);
        this._frameGraphBuilder._endBuild();

        if (this._options.updateBuildId) {
            this._buildId = FrameGraph._BuildIdGenerator++;
        }

        this.onBuildObservable.notifyObservers(this);
    }

    /**
     * Returns a promise that resolves when the frame graph is ready to be executed
     * This method must be called after the graph has been built (FrameGraph.build called)!
     * @param timeout Timeout in ms between retries (default is 16)
     * @returns The promise that resolves when the graph is ready
     */
    public whenReadyAsync(timeout = 16): Promise<void> {
        return new Promise((resolve) => {
            const checkReady = () => {
                let ready = true;
                for (const block of this._executedBlocks) {
                    ready &&= block.isReady();
                }
                if (ready) {
                    resolve();
                }
                return ready;
            };

            if (!checkReady()) {
                setTimeout(checkReady, timeout);
            }
        });
    }

    /**
     * Execute the graph (the graph must have been built before!)
     */
    public execute() {
        this._frameGraphBuilder._execute();
    }

    private _initializeBlock(node: FrameGraphBlock, removeFalseBlocks: boolean) {
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
                    this._initializeBlock(block, removeFalseBlocks);
                }
            }
        }

        if (!removeFalseBlocks || (this._executedBlocks.indexOf(node) === -1 && removeFalseBlocks && (!node.executeCondition || node.executeCondition()))) {
            this._executedBlocks.push(node);
        }
    }

    /**
     * Clear the current graph
     */
    public clear() {
        this.outputBlock = null;
        this.attachedBlocks.length = 0;
        this._executedBlocks.length = 0;
    }

    /**
     * Remove a block from the current graph
     * @param block defines the block to remove
     */
    public removeBlock(block: FrameGraphBlock) {
        const attachedBlockIndex = this.attachedBlocks.indexOf(block);
        if (attachedBlockIndex > -1) {
            this.attachedBlocks.splice(attachedBlockIndex, 1);
        }

        const executedBlockIndex = this._executedBlocks.indexOf(block);
        if (executedBlockIndex > -1) {
            this._executedBlocks.splice(executedBlockIndex, 1);
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

        const map: { [key: number]: FrameGraphBlock } = {};

        // Create blocks
        for (const parsedBlock of source.blocks) {
            const blockType = GetClass(parsedBlock.customType);
            if (blockType) {
                const additionalConstructionParameters = parsedBlock.additionalConstructionParameters;
                const block: FrameGraphBlock = additionalConstructionParameters
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
                const teleportOut = block as FrameGraphTeleportOutBlock;
                const id = teleportOut._tempEntryPointUniqueId;
                if (id) {
                    const source = map[id] as FrameGraphTeleportInBlock;
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
            this.outputBlock = map[source.outputNodeId] as FrameGraphOutputBlock;
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

    private _restoreConnections(block: FrameGraphBlock, source: any, map: { [key: number]: FrameGraphBlock }) {
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
        let alreadyDumped: FrameGraphBlock[] = [];
        const blocks: FrameGraphBlock[] = [];
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

    private _gatherBlocks(rootNode: FrameGraphBlock, list: FrameGraphBlock[]) {
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
            const block = rootNode as FrameGraphTeleportOutBlock;
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
        const backBuffer = new FrameGraphInputBlock("BackBuffer", this._engine, FrameGraphBlockConnectionPointTypes.TextureBackBuffer);

        // Clear texture
        const clear = new FrameGraphClearBlock("Clear", this._engine);

        backBuffer.output.connectTo(clear.texture);

        // Final output
        const output = new FrameGraphOutputBlock("Frame graph Output", this._engine);
        clear.output.connectTo(output.texture);

        this.outputBlock = output;
    }

    /**
     * Makes a duplicate of the current frame graph.
     * @param name defines the name to use for the new frame graph
     * @returns the new frame graph
     */
    public clone(name: string): FrameGraph {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new FrameGraph(name, this._engine), this);
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
    public serialize(selectedBlocks?: FrameGraphBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: FrameGraphBlock[] = [];

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

        this._frameGraphBuilder._dispose();
        this._frameGraphBuilder = undefined as any;

        this._engine.onResizeObservable.remove(this._resizeObserver);
        this._resizeObserver = null;

        this.attachedBlocks.length = 0;
        this._executedBlocks.length = 0;
        this.onBuildObservable.clear();
    }

    /**
     * Creates a new frame graph set to default basic configuration
     * @param name defines the name of the frame graph
     * @param engine defines the engine to use
     * @param frameGraphOptions defines options to use when creating the frame graph
     * @returns a new FrameGraph
     */
    public static CreateDefault(name: string, engine: AbstractEngine, frameGraphOptions?: IFrameGraphCreateOptions): FrameGraph {
        const frameGraph = new FrameGraph(name, engine, frameGraphOptions);

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
    public static Parse(source: any, engine: AbstractEngine, frameGraphOptions?: IFrameGraphCreateOptions, skipBuild: boolean = true): FrameGraph {
        const frameGraph = SerializationHelper.Parse(() => new FrameGraph(source.name, engine, frameGraphOptions), source, null);

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
        frameGraphOptions?: IFrameGraphCreateOptions,
        frameGraph?: FrameGraph,
        skipBuild: boolean = true
    ): Promise<FrameGraph> {
        if (snippetId === "_BLANK") {
            return Promise.resolve(FrameGraph.CreateDefault("blank", engine, frameGraphOptions));
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.FrameGraph);

                        if (!frameGraph) {
                            frameGraph = SerializationHelper.Parse(() => new FrameGraph(snippetId, engine, frameGraphOptions), serializationObject, null);
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
