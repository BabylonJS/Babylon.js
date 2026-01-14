import type {
    Observer,
    Nullable,
    NodeRenderGraphBlock,
    NodeRenderGraphTeleportOutBlock,
    NodeRenderGraphTeleportInBlock,
    AbstractEngine,
    INodeRenderGraphCreateOptions,
    INodeRenderGraphEditorOptions,
    Scene,
    WritableObject,
    IShadowLight,
    INodeRenderGraphCustomBlockDescription,
    Immutable,
} from "core/index";
import { Observable } from "../../Misc/observable";
import { NodeRenderGraphOutputBlock } from "./Blocks/outputBlock";
import { FrameGraph } from "../frameGraph";
import { GetClass } from "../../Misc/typeStore";
import { serialize } from "../../Misc/decorators";
import { SerializationHelper } from "../../Misc/decorators.serialization";
import { Constants } from "../../Engines/constants";
import { WebRequest } from "../../Misc/webRequest";
import { NodeRenderGraphInputBlock } from "./Blocks/inputBlock";
import { Tools } from "../../Misc/tools";
import { Engine } from "../../Engines/engine";
import { NodeRenderGraphBlockConnectionPointTypes } from "./Types/nodeRenderGraphTypes";
import { NodeRenderGraphClearBlock } from "./Blocks/Textures/clearBlock";
import { NodeRenderGraphBaseObjectRendererBlock } from "./Blocks/Rendering/baseObjectRendererBlock";
import { NodeRenderGraphObjectRendererBlock } from "./Blocks/Rendering/objectRendererBlock";
import { NodeRenderGraphBuildState } from "./nodeRenderGraphBuildState";
import { NodeRenderGraphCullObjectsBlock } from "./Blocks/cullObjectsBlock";

// declare NODERENDERGRAPHEDITOR namespace for compilation issue
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let NODERENDERGRAPHEDITOR: any;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let BABYLON: any;

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

    /** Description of custom blocks to use in the node render graph editor */
    public static CustomBlockDescriptions: INodeRenderGraphCustomBlockDescription[] = [];

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
     * @see https://nrge.babylonjs.com
     */
    public editorData: any = null;

    /**
     * Gets an array of blocks that needs to be serialized even if they are not yet connected
     */
    public attachedBlocks: NodeRenderGraphBlock[] = [];

    /**
     * Observable raised before the node render graph is built
     */
    public onBeforeBuildObservable = new Observable<FrameGraph>();

    /**
     * Observable raised after the node render graph is built
     * Note that this is the same observable as the one in the underlying FrameGraph!
     */
    public get onBuildObservable() {
        return this._frameGraph.onBuildObservable;
    }

    /**
     * Observable raised when an error is detected
     */
    public onBuildErrorObservable = new Observable<string>();

    /** Gets or sets the RenderGraphOutputBlock used to gather the final node render graph data */
    public outputBlock: Nullable<NodeRenderGraphOutputBlock> = null;

    /**
     * Snippet ID if the graph was created from the snippet server
     */
    public snippetId: string;

    /**
     * The name of the node render graph
     */
    @serialize()
    public name: string;

    /**
     * A free comment about the graph
     */
    @serialize("comment")
    public comment: string;

    private readonly _engine: AbstractEngine;
    private readonly _scene: Scene;
    private readonly _resizeObserver: Nullable<Observer<AbstractEngine>> = null;
    private readonly _frameGraph: FrameGraph;
    private readonly _options: INodeRenderGraphCreateOptions;

    /**
     * Gets the frame graph used by this node render graph
     */
    public get frameGraph() {
        return this._frameGraph;
    }

    /**
     * Gets the scene used by this node render graph
     * @returns the scene used by this node render graph
     */
    public getScene() {
        return this._scene;
    }

    /**
     * Gets the options used to create this node render graph
     */
    public get options(): Immutable<INodeRenderGraphCreateOptions> {
        return this._options;
    }

    /**
     * Creates a new node render graph
     * @param name defines the name of the node render graph
     * @param scene defines the scene to use to execute the graph
     * @param options defines the options to use when creating the graph
     */
    public constructor(name: string, scene: Scene, options?: INodeRenderGraphCreateOptions) {
        this.name = name;
        this._scene = scene;
        this._engine = scene.getEngine();

        options = {
            debugTextures: false,
            autoConfigure: false,
            verbose: false,
            rebuildGraphOnEngineResize: true,
            autoFillExternalInputs: true,
            ...options,
        };

        this._options = options;

        this._frameGraph = new FrameGraph(this._scene, options.debugTextures, this);
        this._frameGraph.name = name;

        if (options.rebuildGraphOnEngineResize) {
            this._resizeObserver = this._engine.onResizeObservable.add(async () => {
                await this.buildAsync(false, true, false);
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
    public getBlockByName<T extends NodeRenderGraphBlock>(name: string): Nullable<T> {
        let result: Nullable<T> = null;
        for (const block of this.attachedBlocks) {
            if (block.name === name) {
                if (!result) {
                    result = block as T;
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
    public getBlockByPredicate<T extends NodeRenderGraphBlock>(predicate: (block: NodeRenderGraphBlock) => boolean): Nullable<T> {
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                return block as T;
            }
        }

        return null;
    }

    /**
     * Get all blocks that match a predicate
     * @param predicate defines the predicate used to find the good candidate(s)
     * @returns the list of blocks found
     */
    public getBlocksByPredicate<T extends NodeRenderGraphBlock>(predicate: (block: NodeRenderGraphBlock) => boolean): T[] {
        const blocks: T[] = [];
        for (const block of this.attachedBlocks) {
            if (predicate(block)) {
                blocks.push(block as T);
            }
        }

        return blocks;
    }

    /**
     * Gets the list of input blocks attached to this material
     * @returns an array of InputBlocks
     */
    public getInputBlocks() {
        const blocks: NodeRenderGraphInputBlock[] = [];
        for (const block of this.attachedBlocks) {
            if (block.isInput) {
                blocks.push(block as NodeRenderGraphInputBlock);
            }
        }

        return blocks;
    }

    /**
     * Launch the node render graph editor
     * @param config Define the configuration of the editor
     * @returns a promise fulfilled when the node editor is visible
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public async edit(config?: INodeRenderGraphEditorOptions): Promise<void> {
        return await new Promise((resolve) => {
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
            nodeRenderGraph: this,
            customBlockDescriptions: NodeRenderGraph.CustomBlockDescriptions,
            ...additionalConfig,
        };
        this.BJSNODERENDERGRAPHEDITOR.NodeRenderGraphEditor.Show(nodeEditorConfig);
    }

    /**
     * Build the final list of blocks that will be executed by the "execute" method.
     * It also builds the underlying frame graph unless specified otherwise.
     * @param dontBuildFrameGraph If the underlying frame graph should not be built (default: false)
     * @param waitForReadiness If the method should wait for the frame graph to be ready before resolving (default: true). Note that this parameter has no effect if "dontBuildFrameGraph" is true.
     * @param setAsSceneFrameGraph If the built frame graph must be set as the scene's frame graph (default: true)
     */
    public async buildAsync(dontBuildFrameGraph = false, waitForReadiness = true, setAsSceneFrameGraph = true): Promise<void> {
        if (!this.outputBlock) {
            throw new Error("You must define the outputBlock property before building the node render graph");
        }

        if (setAsSceneFrameGraph) {
            this._scene.frameGraph = this._frameGraph;
        }

        this._initializeBlock(this.outputBlock);

        this._frameGraph.clear();

        const state = new NodeRenderGraphBuildState();

        state.buildId = this._buildId;
        state.verbose = this._options.verbose!;

        if (this._options.autoFillExternalInputs) {
            this._autoFillExternalInputs();
        }

        this.onBeforeBuildObservable.notifyObservers(this._frameGraph);

        // Make sure that one of the object renderer is flagged as the main object renderer
        const objectRendererBlocks = this.getBlocksByPredicate<NodeRenderGraphBaseObjectRendererBlock>((block) => block instanceof NodeRenderGraphBaseObjectRendererBlock);
        if (objectRendererBlocks.length > 0 && !objectRendererBlocks.find((block) => block.isMainObjectRenderer)) {
            objectRendererBlocks[0].isMainObjectRenderer = true;
        }

        try {
            this.outputBlock.build(state);

            if (!dontBuildFrameGraph) {
                await this._frameGraph.buildAsync(waitForReadiness);
            }
        } finally {
            this._buildId = NodeRenderGraph._BuildIdGenerator++;

            state.emitErrors(this.onBuildErrorObservable);
        }
    }

    private _autoFillExternalInputs() {
        const allInputs = this.getInputBlocks();

        const shadowLights: IShadowLight[] = [];
        for (const light of this._scene.lights) {
            if ((light as IShadowLight).setShadowProjectionMatrix !== undefined) {
                shadowLights.push(light as IShadowLight);
            }
        }

        let cameraIndex = 0;
        let lightIndex = 0;
        for (const input of allInputs) {
            if (!input.isExternal) {
                continue;
            }
            if (!input.isAnAncestorOfType("NodeRenderGraphOutputBlock")) {
                continue;
            }
            if ((input.type & NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer) !== 0) {
                // nothing to do
            } else if (input.isCamera()) {
                const camera = this._scene.cameras[cameraIndex++] || this._scene.cameras[0];
                if (!this._scene.cameraToUseForPointers) {
                    this._scene.cameraToUseForPointers = camera;
                }

                input.value = camera;
            } else if (input.isObjectList()) {
                input.value = { meshes: this._scene.meshes, particleSystems: this._scene.particleSystems };
            } else if (input.isShadowLight()) {
                if (lightIndex < shadowLights.length) {
                    input.value = shadowLights[lightIndex++];
                    lightIndex = lightIndex % shadowLights.length;
                }
            }
        }
    }

    /**
     * Returns a promise that resolves when the node render graph is ready to be executed
     * This method must be called after the graph has been built (NodeRenderGraph.build called)!
     * @param timeStep Time step in ms between retries (default is 16)
     * @param maxTimeout Maximum time in ms to wait for the graph to be ready (default is 10000)
     * @returns The promise that resolves when the graph is ready
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public async whenReadyAsync(timeStep = 16, maxTimeout = 10000): Promise<void> {
        this._frameGraph.pausedExecution = true;
        await this._frameGraph.whenReadyAsync(timeStep, maxTimeout);
        this._frameGraph.pausedExecution = false;
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
            const blockType: typeof NodeRenderGraphBlock = GetClass(parsedBlock.customType);
            if (blockType) {
                const additionalConstructionParameters = parsedBlock.additionalConstructionParameters;
                const block: NodeRenderGraphBlock = additionalConstructionParameters
                    ? new blockType("", this._frameGraph, this._scene, ...additionalConstructionParameters)
                    : new blockType("", this._frameGraph, this._scene);
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
            this.outputBlock = map[source.outputNodeId] as NodeRenderGraphOutputBlock;
        }

        // UI related info
        if (source.locations || (source.editorData && source.editorData.locations)) {
            const locations: {
                blockId: number;
                x: number;
                y: number;
                isCollapsed: boolean;
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

            const blockMap: { [key: number]: number } = {};

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
     * Generate a string containing the code declaration required to create an equivalent of this node render graph
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
        const options = JSON.stringify(this._options);
        let codeString = `let nodeRenderGraph = new BABYLON.NodeRenderGraph("${this.name || "render graph"}", scene, ${options});\n`;
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
            codeString += `nodeRenderGraph.outputBlock = ${this.outputBlock._codeVariableName};\n`;
            codeString += `nodeRenderGraph.build();\n`;
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

        // Source textures
        const colorTexture = new NodeRenderGraphInputBlock("Color Texture", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.Texture);
        colorTexture.creationOptions.options.samples = 4;

        const depthTexture = new NodeRenderGraphInputBlock("Depth Texture", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment);
        depthTexture.creationOptions.options.samples = 4;

        // Clear texture
        const clear = new NodeRenderGraphClearBlock("Clear", this._frameGraph, this._scene);
        clear.clearDepth = true;
        clear.clearStencil = true;

        colorTexture.output.connectTo(clear.target);
        depthTexture.output.connectTo(clear.depth);

        // Object list and culling
        const camera = new NodeRenderGraphInputBlock("Camera", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.Camera);
        const objectList = new NodeRenderGraphInputBlock("Object List", this._frameGraph, this._scene, NodeRenderGraphBlockConnectionPointTypes.ObjectList);
        const cull = new NodeRenderGraphCullObjectsBlock("Cull", this._frameGraph, this._scene);

        camera.output.connectTo(cull.camera);
        objectList.output.connectTo(cull.objects);

        // Render objects
        const mainRendering = new NodeRenderGraphObjectRendererBlock("Main Rendering", this._frameGraph, this._scene);

        camera.output.connectTo(mainRendering.camera);
        cull.output.connectTo(mainRendering.objects);
        clear.output.connectTo(mainRendering.target);
        clear.outputDepth.connectTo(mainRendering.depth);

        // Final output
        const output = new NodeRenderGraphOutputBlock("Output", this._frameGraph, this._scene);
        mainRendering.output.connectTo(output.texture);

        this.outputBlock = output;
    }

    /**
     * Makes a duplicate of the current node render graph.
     * Note that you should call buildAsync() on the returned graph to make it usable.
     * @param name defines the name to use for the new node render graph
     * @returns the new node render graph
     */
    public clone(name: string): NodeRenderGraph {
        const serializationObject = this.serialize();

        const clone = SerializationHelper.Clone(() => new NodeRenderGraph(name, this._scene), this);
        clone.name = name;

        clone.parseSerializedObject(serializationObject);
        clone._buildId = this._buildId;

        return clone;
    }

    /**
     * Serializes this node render graph in a JSON representation
     * @param selectedBlocks defines the list of blocks to save (if null the whole node render graph will be saved)
     * @returns the serialized node render graph object
     */
    public serialize(selectedBlocks?: NodeRenderGraphBlock[]): any {
        const serializationObject = selectedBlocks ? {} : SerializationHelper.Serialize(this);
        serializationObject.editorData = JSON.parse(JSON.stringify(this.editorData)); // Copy

        let blocks: NodeRenderGraphBlock[] = [];

        if (selectedBlocks) {
            blocks = selectedBlocks;
        } else {
            serializationObject.customType = "BABYLON.NodeRenderGraph";
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
     * Disposes the resources
     */
    public dispose(): void {
        for (const block of this.attachedBlocks) {
            block.dispose();
        }

        this._frameGraph.dispose();
        (this._frameGraph as WritableObject<FrameGraph>) = undefined as any;

        this._engine.onResizeObservable.remove(this._resizeObserver);
        (this._resizeObserver as WritableObject<Nullable<Observer<AbstractEngine>>>) = null;

        this.attachedBlocks.length = 0;
        this.onBuildErrorObservable.clear();
    }

    /**
     * Creates a new node render graph set to default basic configuration
     * @param name defines the name of the node render graph
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render graph
     * @returns a new NodeRenderGraph
     */
    public static async CreateDefaultAsync(name: string, scene: Scene, nodeRenderGraphOptions?: INodeRenderGraphCreateOptions): Promise<NodeRenderGraph> {
        const renderGraph = new NodeRenderGraph(name, scene, nodeRenderGraphOptions);

        renderGraph.setToDefault();
        await renderGraph.buildAsync(false, true, false);

        return renderGraph;
    }

    /**
     * Creates a node render graph from parsed graph data
     * @param source defines the JSON representation of the node render graph
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render
     * @param skipBuild defines whether to skip building the node render graph (default is true)
     * @returns a new node render graph
     */
    public static Parse(source: any, scene: Scene, nodeRenderGraphOptions?: INodeRenderGraphCreateOptions, skipBuild: boolean = true): NodeRenderGraph {
        const renderGraph = SerializationHelper.Parse(() => new NodeRenderGraph(source.name, scene, nodeRenderGraphOptions), source, null);

        renderGraph.parseSerializedObject(source);
        if (!skipBuild) {
            void renderGraph.buildAsync();
        }

        return renderGraph;
    }

    /**
     * Creates a node render graph from a snippet saved by the node render graph editor
     * @param snippetId defines the snippet to load
     * @param scene defines the scene to use
     * @param nodeRenderGraphOptions defines options to use when creating the node render graph
     * @param nodeRenderGraph defines a node render graph to update (instead of creating a new one)
     * @param skipBuild defines whether to skip building the node render graph (default is true)
     * @returns a promise that will resolve to the new node render graph
     */
    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public static ParseFromSnippetAsync(
        snippetId: string,
        scene: Scene,
        nodeRenderGraphOptions?: INodeRenderGraphCreateOptions,
        nodeRenderGraph?: NodeRenderGraph,
        skipBuild: boolean = true
    ): Promise<NodeRenderGraph> {
        if (snippetId === "_BLANK") {
            return NodeRenderGraph.CreateDefaultAsync("blank", scene, nodeRenderGraphOptions);
        }

        return new Promise((resolve, reject) => {
            const request = new WebRequest();
            request.addEventListener("readystatechange", async () => {
                if (request.readyState == 4) {
                    if (request.status == 200) {
                        const snippet = JSON.parse(JSON.parse(request.responseText).jsonPayload);
                        const serializationObject = JSON.parse(snippet.nodeRenderGraph);

                        if (!nodeRenderGraph) {
                            nodeRenderGraph = SerializationHelper.Parse(() => new NodeRenderGraph(snippetId, scene, nodeRenderGraphOptions), serializationObject, null);
                        }

                        nodeRenderGraph.parseSerializedObject(serializationObject);
                        nodeRenderGraph.snippetId = snippetId;

                        try {
                            if (!skipBuild) {
                                await nodeRenderGraph.buildAsync();
                            }
                            resolve(nodeRenderGraph);
                        } catch (err) {
                            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                            reject(err);
                        }
                    } else {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject("Unable to load the snippet " + snippetId);
                    }
                }
            });

            request.open("GET", this.SnippetUrl + "/" + snippetId.replace(/#/g, "/"));
            request.send();
        });
    }
}
