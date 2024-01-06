import type { FlowGraphConnectionType } from "./flowGraphConnection";

/**
 * An accessor that allows modifying properties on some other object.
 */
export interface IObjectAccessor {
    /**
     * The type of the object that is converted
     */
    type: string;
    /**
     * Get a property value from the object.
     * @param args any necessary arguments to get the property value
     */
    get(...args: any[]): any;
    /**
     * Set a property value on the object.
     * @param value the value to set
     * @param args any necessary arguments to set the property value
     */
    set(value: any, ...args: any[]): void;
    /**
     * Get the original object
     * @param args any necessary arguments to get the original object
     */
    getObject(...args: any[]): any;
}

/**
 * A Serialized Flow Graph Context
 */
export interface ISerializedFlowGraphContext {
    /**
     * The unique id of the context
     */
    uniqueId: string;
    /**
     * User variables
     */
    _userVariables: { [key: string]: any };
    /**
     * Values of the connection points
     */
    _connectionValues: { [key: string]: any };
}

/**
 * A Serialized Flow Graph Connection
 */
export interface ISerializedFlowGraphConnection {
    /**
     * The unique id of the connection
     */
    uniqueId: string;
    /**
     * The name of the connection
     */
    name: string;
    /**
     * The type of the connection
     */
    _connectionType: FlowGraphConnectionType;
    /**
     * The id of the connection that this is connected to
     */
    connectedPointIds: string[];
}

/**
 * A Serialized Flow Graph Block
 */
export interface ISerializedFlowGraphBlock {
    /**
     * The class name of the block
     */
    className: string;
    /**
     * Configuration parameters for the block
     */
    config: any;
    /**
     * The unique id of the block
     */
    uniqueId: string;
    /**
     * Input connection data
     */
    dataInputs: ISerializedFlowGraphConnection[];
    /**
     * Output connection data
     */
    dataOutputs: ISerializedFlowGraphConnection[];
    /**
     * Metadata for the block
     */
    metadata: any;
    /**
     * Input connection signal
     */
    signalInputs: ISerializedFlowGraphConnection[];
    /**
     * Output connection signal
     */
    signalOutputs: ISerializedFlowGraphConnection[];
}

/**
 * A Serialized Flow Graph
 */
export interface ISerializedFlowGraph {
    /**
     * Contexts belonging to the flow graph
     */
    executionContexts: ISerializedFlowGraphContext[];
    /**
     * Blocks belonging to the flow graph
     */
    allBlocks: ISerializedFlowGraphBlock[];
}
