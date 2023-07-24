import { UniqueIdGenerator } from "../../Misc/uniqueIdGenerator";
import type{ NodeGeometryBlockConnectionPointTypes } from "./Enums/nodeMaterialGeometryConnectionPointTypes";
import { NodeGeometryConnectionPoint, NodeGeometryConnectionPointDirection } from "./nodeGeometryBlockConnectionPoint";
import type { NodeGeometryBuildState } from "./nodeGeometryBuildState";

/**
 * Defines a block that can be used inside a node based geometry
 */
export class NodeGeometryBlock {
    private _name = "";

    /** @internal */
    public _inputs = new Array<NodeGeometryConnectionPoint>();
    /** @internal */
    public _outputs = new Array<NodeGeometryConnectionPoint>();
    /** @internal */
    public _preparationId: number;    

    /**
     * Gets the list of input points
     */
    public get inputs(): NodeGeometryConnectionPoint[] {
        return this._inputs;
    }

    /** Gets the list of output points */
    public get outputs(): NodeGeometryConnectionPoint[] {
        return this._outputs;
    }

    /**
     * Gets or sets the unique id of the node
     */
    public uniqueId: number;

    /**
     * Gets the name of the block
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Gets the current class name e.g. "NodeGeometryBlock"
     * @returns the class name
     */
    public getClassName() {
        return "NodeGeometryBlock";
    }    

    /**
     * Checks if the current block is an ancestor of a given block
     * @param block defines the potential descendant block to check
     * @returns true if block is a descendant
     */
    public isAnAncestorOf(block: NodeGeometryBlock): boolean {
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
     * Creates a new NodeMaterialBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        this._name = name;
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
    public registerInput(
        name: string,
        type: NodeGeometryBlockConnectionPointTypes,
        isOptional: boolean = false,
        point?: NodeGeometryConnectionPoint
    ) {
        point = point ?? new NodeGeometryConnectionPoint(name, this, NodeGeometryConnectionPointDirection.Input);
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
    public registerOutput(name: string, type: NodeGeometryBlockConnectionPointTypes, point?: NodeGeometryConnectionPoint) {
        point = point ?? new NodeGeometryConnectionPoint(name, this, NodeGeometryConnectionPointDirection.Output);

        this._outputs.push(point);

        return this;
    }    

    /**
     * Compile the current node and generate the shader code
     * @param state defines the current generation state
     * @param activeBlocks defines the list of active blocks (i.e. blocks to compile)
     * @returns true if already built
     */
    public build(state: NodeGeometryBuildState, activeBlocks: NodeGeometryBlock[]): boolean {
        return true;
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
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject: any = {};
        serializationObject.customType = "BABYLON." + this.getClassName();
        serializationObject.id = this.uniqueId;
        serializationObject.name = this.name;

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
}
