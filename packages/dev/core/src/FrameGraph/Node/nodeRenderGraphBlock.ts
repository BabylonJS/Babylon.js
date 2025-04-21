import type {
    NodeRenderGraphBuildState,
    Nullable,
    NodeRenderGraphInputBlock,
    AbstractEngine,
    Scene,
    FrameGraphTask,
    FrameGraph,
    NodeRenderGraphResourceContainerBlock,
    FrameGraphTextureHandle,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";
import { GetClass } from "../../Misc/typeStore";
import { serialize } from "../../Misc/decorators";
import { UniqueIdGenerator } from "../../Misc/uniqueIdGenerator";
import { NodeRenderGraphBlockConnectionPointTypes, NodeRenderGraphConnectionPointDirection } from "./Types/nodeRenderGraphTypes";
import { Observable } from "../../Misc/observable";
import { Logger } from "../../Misc/logger";
import { NodeRenderGraphConnectionPoint } from "./nodeRenderGraphBlockConnectionPoint";

/**
 * Defines a block that can be used inside a node render graph
 */
export class NodeRenderGraphBlock {
    private _name = "";
    private _buildId: number;
    protected _isInput = false;
    protected _isTeleportOut = false;
    protected _isTeleportIn = false;
    protected _isDebug = false;
    protected _isUnique = false;
    protected _scene: Scene;
    protected _engine: AbstractEngine;
    protected _frameGraph: FrameGraph;
    protected _frameGraphTask?: FrameGraphTask;

    /**
     * Gets or sets the disable flag of the task associated with this block
     */
    public get disabled() {
        return !!this._frameGraphTask?.disabled;
    }

    public set disabled(value: boolean) {
        if (this._frameGraphTask) {
            this._frameGraphTask.disabled = value;
        }
    }

    /**
     * Gets the frame graph task associated with this block
     */
    public get task() {
        return this._frameGraphTask;
    }

    /**
     * Gets an observable raised when the block is built
     */
    public onBuildObservable = new Observable<NodeRenderGraphBlock>();

    /** @internal */
    public _inputs = new Array<NodeRenderGraphConnectionPoint>();

    /** @internal */
    public _outputs = new Array<NodeRenderGraphConnectionPoint>();

    /** @internal */
    public _codeVariableName = "";

    /** @internal */
    public _additionalConstructionParameters: Nullable<unknown[]> = null;

    /**
     * Gets the list of input points
     */
    public get inputs(): NodeRenderGraphConnectionPoint[] {
        return this._inputs;
    }

    /** Gets the list of output points */
    public get outputs(): NodeRenderGraphConnectionPoint[] {
        return this._outputs;
    }

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /**
     * Gets or set the name of the block
     */
    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    /**
     * Gets a boolean indicating if this block is an input
     */
    public get isInput(): boolean {
        return this._isInput;
    }

    /**
     * Gets a boolean indicating if this block is a teleport out
     */
    public get isTeleportOut(): boolean {
        return this._isTeleportOut;
    }

    /**
     * Gets a boolean indicating if this block is a teleport in
     */
    public get isTeleportIn(): boolean {
        return this._isTeleportIn;
    }

    /**
     * Gets a boolean indicating if this block is a debug block
     */
    public get isDebug(): boolean {
        return this._isDebug;
    }

    /**
     * Gets a boolean indicating that this block can only be used once per node render graph
     */
    public get isUnique() {
        return this._isUnique;
    }

    /**
     * A free comment about the block
     */
    @serialize("comment")
    public comments: string;

    /** Gets or sets a boolean indicating that this input can be edited from a collapsed frame */
    public visibleOnFrame = false;

    /**
     * Gets the current class name e.g. "NodeRenderGraphBlock"
     * @returns the class name
     */
    public getClassName() {
        return "NodeRenderGraphBlock";
    }

    protected _inputRename(name: string) {
        return name;
    }

    protected _outputRename(name: string) {
        return name;
    }

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOf(block: NodeRenderGraphBlock): boolean {
        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock === block) {
                    return true;
                }

                if (endpoint.ownerBlock.isAnAncestorOf(block)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Checks if the current block is an ancestor of a given type
     * @param type defines the potential type to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOfType(type: string): boolean {
        if (this.getClassName() === type) {
            return true;
        }

        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                if (endpoint.ownerBlock.isAnAncestorOfType(type)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get the first descendant using a predicate
     * @param predicate defines the predicate to check
     * @returns descendant or null if none found
     */
    public getDescendantOfPredicate(predicate: (block: NodeRenderGraphBlock) => boolean): Nullable<NodeRenderGraphBlock> {
        if (predicate(this)) {
            return this;
        }

        for (const output of this._outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                const descendant = endpoint.ownerBlock.getDescendantOfPredicate(predicate);
                if (descendant) {
                    return descendant;
                }
            }
        }

        return null;
    }

    /**
     * Creates a new NodeRenderGraphBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     * @param _additionalConstructionParameters defines additional parameters to pass to the block constructor
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene, ..._additionalConstructionParameters: unknown[]) {
        this._name = name;
        this._frameGraph = frameGraph;
        this._scene = scene;
        this._engine = scene.getEngine();
        this.uniqueId = UniqueIdGenerator.UniqueId;
    }

    /**
     * Register a new input. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param isOptional defines a boolean indicating that this input can be omitted
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    public registerInput(name: string, type: NodeRenderGraphBlockConnectionPointTypes, isOptional: boolean = false, point?: NodeRenderGraphConnectionPoint) {
        point = point ?? new NodeRenderGraphConnectionPoint(name, this, NodeRenderGraphConnectionPointDirection.Input);
        point.type = type;
        point.isOptional = isOptional;

        this._inputs.push(point);

        return this;
    }

    /**
     * Register a new output. Must be called inside a block constructor
     * @param name defines the connection point name
     * @param type defines the connection point type
     * @param point an already created connection point. If not provided, create a new one
     * @returns the current block
     */
    public registerOutput(name: string, type: NodeRenderGraphBlockConnectionPointTypes, point?: NodeRenderGraphConnectionPoint) {
        point = point ?? new NodeRenderGraphConnectionPoint(name, this, NodeRenderGraphConnectionPointDirection.Output);
        point.type = type;

        this._outputs.push(point);

        return this;
    }

    protected _addDependenciesInput(additionalAllowedTypes = 0) {
        this.registerInput("dependencies", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        const dependencies = this.getInputByName("dependencies")!;

        dependencies.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer |
                NodeRenderGraphBlockConnectionPointTypes.ResourceContainer |
                NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator |
                additionalAllowedTypes
        );

        return dependencies;
    }

    protected _buildBlock(_state: NodeRenderGraphBuildState) {
        // Empty. Must be defined by child nodes
    }

    protected _customBuildStep(_state: NodeRenderGraphBuildState): void {
        // Must be implemented by children
    }

    protected _propagateInputValueToOutput(inputConnectionPoint: NodeRenderGraphConnectionPoint, outputConnectionPoint: NodeRenderGraphConnectionPoint) {
        if (inputConnectionPoint.connectedPoint) {
            outputConnectionPoint.value = inputConnectionPoint.connectedPoint.value;
        }
    }

    /**
     * Build the current node and generate the vertex data
     * @param state defines the current generation state
     * @returns true if already built
     */
    public build(state: NodeRenderGraphBuildState): boolean {
        if (this._buildId === state.buildId) {
            return true;
        }

        this._buildId = state.buildId;

        // Check if "parent" blocks are compiled
        for (const input of this._inputs) {
            if (!input.connectedPoint) {
                if (!input.isOptional) {
                    // Emit a warning
                    state._notConnectedNonOptionalInputs.push(input);
                }
                continue;
            }

            const block = input.connectedPoint.ownerBlock;
            if (block && block !== this) {
                block.build(state);
            }
        }

        this._customBuildStep(state);

        // Logs
        if (state.verbose) {
            Logger.Log(`Building ${this.name} [${this.getClassName()}]`);
        }

        if (this._frameGraphTask) {
            this._frameGraphTask.name = this.name;
        }

        this._buildBlock(state);

        if (this._frameGraphTask) {
            this._frameGraphTask.dependencies = undefined;

            const dependenciesConnectedPoint = this.getInputByName("dependencies")?.connectedPoint;
            if (dependenciesConnectedPoint) {
                if (dependenciesConnectedPoint.type === NodeRenderGraphBlockConnectionPointTypes.ResourceContainer) {
                    const container = dependenciesConnectedPoint.ownerBlock as NodeRenderGraphResourceContainerBlock;
                    for (let i = 0; i < container.inputs.length; i++) {
                        const input = container.inputs[i];
                        if (input.connectedPoint && input.connectedPoint.value !== undefined && NodeRenderGraphConnectionPoint.IsTextureHandle(input.connectedPoint.value)) {
                            this._frameGraphTask.dependencies = this._frameGraphTask.dependencies || new Set();
                            this._frameGraphTask.dependencies.add(input.connectedPoint.value as FrameGraphTextureHandle);
                        }
                    }
                } else if (NodeRenderGraphConnectionPoint.IsTextureHandle(dependenciesConnectedPoint.value)) {
                    this._frameGraphTask.dependencies = this._frameGraphTask.dependencies || new Set();
                    this._frameGraphTask.dependencies.add(dependenciesConnectedPoint.value as FrameGraphTextureHandle);
                }
            }
            this._frameGraph.addTask(this._frameGraphTask);
        }

        this.onBuildObservable.notifyObservers(this);

        return false;
    }

    protected _linkConnectionTypes(inputIndex0: number, inputIndex1: number, looseCoupling = false) {
        if (looseCoupling) {
            this._inputs[inputIndex1]._acceptedConnectionPointType = this._inputs[inputIndex0];
        } else {
            this._inputs[inputIndex0]._linkedConnectionSource = this._inputs[inputIndex1];
            this._inputs[inputIndex0]._isMainLinkSource = true;
        }

        this._inputs[inputIndex1]._linkedConnectionSource = this._inputs[inputIndex0];
    }

    /**
     * Initialize the block and prepare the context for build
     */
    public initialize() {
        // Do nothing
    }

    /**
     * Lets the block try to connect some inputs automatically
     */
    public autoConfigure() {
        // Do nothing
    }

    /**
     * Find an input by its name
     * @param name defines the name of the input to look for
     * @returns the input or null if not found
     */
    public getInputByName(name: string) {
        const filter = this._inputs.filter((e) => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Find an output by its name
     * @param name defines the name of the output to look for
     * @returns the output or null if not found
     */
    public getOutputByName(name: string) {
        const filter = this._outputs.filter((e) => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject: any = {};

        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;
        serializationObject.visibleOnFrame = this.visibleOnFrame;
        serializationObject.disabled = this.disabled;
        if (this._additionalConstructionParameters) {
            serializationObject.additionalConstructionParameters = this._additionalConstructionParameters;
        }

        serializationObject.inputs = [];
        serializationObject.outputs = [];

        for (const input of this.inputs) {
            serializationObject.inputs.push(input.serialize());
        }

        for (const output of this.outputs) {
            serializationObject.outputs.push(output.serialize(false));
        }

        return serializationObject;
    }
    /**
     * @internal
     */
    public _deserialize(serializationObject: any) {
        this._name = serializationObject.name;
        this.comments = serializationObject.comments;
        this.visibleOnFrame = serializationObject.visibleOnFrame;
        this.disabled = serializationObject.disabled;

        this._deserializePortDisplayNamesAndExposedOnFrame(serializationObject);
    }

    private _deserializePortDisplayNamesAndExposedOnFrame(serializationObject: any) {
        const serializedInputs = serializationObject.inputs;
        const serializedOutputs = serializationObject.outputs;

        if (serializedInputs) {
            for (const port of serializedInputs) {
                const input = this.inputs.find((i) => i.name === port.name);
                if (!input) {
                    return;
                }
                if (port.displayName) {
                    input.displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    input.isExposedOnFrame = port.isExposedOnFrame;
                    input.exposedPortPosition = port.exposedPortPosition;
                }
            }
        }

        if (serializedOutputs) {
            for (let i = 0; i < serializedOutputs.length; i++) {
                const port = serializedOutputs[i];
                if (port.displayName) {
                    this.outputs[i].displayName = port.displayName;
                }
                if (port.isExposedOnFrame) {
                    this.outputs[i].isExposedOnFrame = port.isExposedOnFrame;
                    this.outputs[i].exposedPortPosition = port.exposedPortPosition;
                }
            }
        }
    }

    protected _dumpPropertiesCode() {
        const variableName = this._codeVariableName;
        return `${variableName}.visibleOnFrame = ${this.visibleOnFrame};\n${variableName}.disabled = ${this.disabled};\n`;
    }

    /**
     * @internal
     */
    public _dumpCodeForOutputConnections(alreadyDumped: NodeRenderGraphBlock[]) {
        let codeString = "";

        if (alreadyDumped.indexOf(this) !== -1) {
            return codeString;
        }

        alreadyDumped.push(this);

        for (const input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }

            const connectedOutput = input.connectedPoint!;
            const connectedBlock = connectedOutput.ownerBlock;

            codeString += connectedBlock._dumpCodeForOutputConnections(alreadyDumped);
            codeString += `${connectedBlock._codeVariableName}.${connectedBlock._outputRename(connectedOutput.name)}.connectTo(${this._codeVariableName}.${this._inputRename(
                input.name
            )});\n`;
        }

        return codeString;
    }

    /**
     * @internal
     */
    public _dumpCode(uniqueNames: string[], alreadyDumped: NodeRenderGraphBlock[]) {
        alreadyDumped.push(this);

        // Get unique name
        const nameAsVariableName = this.name.replace(/[^A-Za-z_]+/g, "");
        this._codeVariableName = nameAsVariableName || `${this.getClassName()}_${this.uniqueId}`;

        if (uniqueNames.indexOf(this._codeVariableName) !== -1) {
            let index = 0;
            do {
                index++;
                this._codeVariableName = nameAsVariableName + index;
            } while (uniqueNames.indexOf(this._codeVariableName) !== -1);
        }

        uniqueNames.push(this._codeVariableName);

        // Declaration
        let codeString = `\n// ${this.getClassName()}\n`;
        if (this.comments) {
            codeString += `// ${this.comments}\n`;
        }
        const className = this.getClassName();
        if (className === "NodeRenderGraphInputBlock") {
            const block = this as unknown as NodeRenderGraphInputBlock;
            const blockType = block.type;

            codeString += `var ${this._codeVariableName} = new BABYLON.NodeRenderGraphInputBlock("${this.name}", nodeRenderGraph.frameGraph, scene, BABYLON.NodeRenderGraphBlockConnectionPointTypes.${NodeRenderGraphBlockConnectionPointTypes[blockType]});\n`;
        } else {
            if (this._additionalConstructionParameters) {
                codeString += `var ${this._codeVariableName} = new BABYLON.${className}("${this.name}", nodeRenderGraph.frameGraph, scene, ...${JSON.stringify(this._additionalConstructionParameters)});\n`;
            } else {
                codeString += `var ${this._codeVariableName} = new BABYLON.${className}("${this.name}", nodeRenderGraph.frameGraph, scene);\n`;
            }
        }

        // Properties
        codeString += this._dumpPropertiesCode() + "\n";

        // Inputs
        for (const input of this.inputs) {
            if (!input.isConnected) {
                continue;
            }

            const connectedOutput = input.connectedPoint!;
            const connectedBlock = connectedOutput.ownerBlock;

            if (alreadyDumped.indexOf(connectedBlock) === -1) {
                codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
            }
        }

        // Outputs
        for (const output of this.outputs) {
            if (!output.hasEndpoints) {
                continue;
            }

            for (const endpoint of output.endpoints) {
                const connectedBlock = endpoint.ownerBlock;
                if (connectedBlock && alreadyDumped.indexOf(connectedBlock) === -1) {
                    codeString += connectedBlock._dumpCode(uniqueNames, alreadyDumped);
                }
            }
        }

        return codeString;
    }

    /**
     * Clone the current block to a new identical block
     * @returns a copy of the current block
     */
    public clone() {
        const serializationObject = this.serialize();
        const blockType: typeof NodeRenderGraphBlock = GetClass(serializationObject.customType);

        if (blockType) {
            const additionalConstructionParameters = serializationObject.additionalConstructionParameters;
            const block: NodeRenderGraphBlock = additionalConstructionParameters
                ? new blockType("", this._frameGraph, this._scene, ...additionalConstructionParameters)
                : new blockType("", this._frameGraph, this._scene);
            block._deserialize(serializationObject);
            return block;
        }

        return null;
    }

    /**
     * Release resources
     */
    public dispose() {
        for (const input of this.inputs) {
            input.dispose();
        }

        for (const output of this.outputs) {
            output.dispose();
        }

        this._frameGraphTask?.dispose();
        this._frameGraphTask = undefined as any;

        this.onBuildObservable.clear();
    }
}
