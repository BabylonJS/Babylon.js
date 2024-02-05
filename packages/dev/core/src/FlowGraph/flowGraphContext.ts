import { serialize } from "../Misc/decorators";
import { RandomGUID } from "../Misc/guid";
import type { Scene } from "../scene";
import type { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { FlowGraph } from "./flowGraph";
import type { ISerializedFlowGraphContext } from "./typeDefinitions";
import { defaultValueParseFunction, defaultValueSerializationFunction } from "./serialization";
import type { FlowGraphCoordinator } from "./flowGraphCoordinator";
import { Observable } from "../Misc/observable";

/**
 * Construction parameters for the context.
 * @experimental
 */
export interface IFlowGraphContextConfiguration {
    /**
     * The scene that the flow graph context belongs to.
     */
    readonly scene: Scene;
    /**
     * The event coordinator used by the flow graph context.
     */
    readonly coordinator: FlowGraphCoordinator;
}

/**
 * @experimental
 * Options for parsing a context.
 */
export interface IFlowGraphContextParseOptions {
    /**
     * A function that parses a value from a serialization object.
     * @param key the key of the value
     * @param serializationObject the object containing the value
     * @param scene the current scene
     * @returns
     */
    readonly valueParseFunction?: (key: string, serializationObject: any, scene: Scene) => any;
    /**
     * The graph that the context is being parsed in.
     */
    readonly graph: FlowGraph;
}
/**
 * @experimental
 * The context represents the current state and execution of the flow graph.
 * It contains both user-defined variables, which are derived from
 * a more general variable definition, and execution variables that
 * are set by the blocks.
 */
export class FlowGraphContext {
    /**
     * A randomly generated GUID for each context.
     */
    @serialize()
    public uniqueId = RandomGUID();
    /**
     * These are the variables defined by a user.
     */
    private _userVariables: { [key: string]: any } = {};
    /**
     * These are the variables set by the blocks.
     */
    private _executionVariables: { [key: string]: any } = {};
    /**
     * These are the values for the data connection points
     */
    private _connectionValues: { [key: string]: any } = {};
    /**
     * These are the variables set by the graph.
     */
    private readonly _configuration: IFlowGraphContextConfiguration;
    /**
     * These are blocks that have currently pending tasks/listeners that need to be cleaned up.
     */
    private _pendingBlocks: FlowGraphAsyncExecutionBlock[] = [];
    /**
     * A monotonically increasing ID for each execution.
     * Incremented for every block executed.
     */
    private _executionId = 0;
    /**
     * Observable that is triggered when a node is executed.
     */
    public onNodeExecutedObservable: Observable<FlowGraphBlock> = new Observable<FlowGraphBlock>();

    constructor(params: IFlowGraphContextConfiguration) {
        this._configuration = params;
    }

    /**
     * Check if a user-defined variable is defined.
     * @param name the name of the variable
     * @returns true if the variable is defined
     */
    public hasVariable(name: string) {
        return name in this._userVariables;
    }

    /**
     * Set a user-defined variable.
     * @param name the name of the variable
     * @param value the value of the variable
     */
    public setVariable(name: string, value: any) {
        this._userVariables[name] = value;
    }

    /**
     * Get a user-defined variable.
     * @param name the name of the variable
     * @returns the value of the variable
     */
    public getVariable(name: string): any {
        return this._userVariables[name];
    }

    /**
     * Gets all user variables map
     */
    public get userVariables() {
        return this._userVariables;
    }

    private _getUniqueIdPrefixedName(obj: FlowGraphBlock, name: string): string {
        return `${obj.uniqueId}_${name}`;
    }

    /**
     * Set an internal execution variable
     * @internal
     * @param name
     * @param value
     */
    public _setExecutionVariable(block: FlowGraphBlock, name: string, value: any) {
        this._executionVariables[this._getUniqueIdPrefixedName(block, name)] = value;
    }

    /**
     * Get an internal execution variable
     * @internal
     * @param name
     * @returns
     */
    public _getExecutionVariable(block: FlowGraphBlock, name: string, defaultValue?: any): any {
        if (this._hasExecutionVariable(block, name)) {
            return this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
        } else {
            return defaultValue;
        }
    }

    /**
     * Delete an internal execution variable
     * @internal
     * @param block
     * @param name
     */
    public _deleteExecutionVariable(block: FlowGraphBlock, name: string) {
        delete this._executionVariables[this._getUniqueIdPrefixedName(block, name)];
    }

    /**
     * Check if an internal execution variable is defined
     * @internal
     * @param block
     * @param name
     * @returns
     */
    public _hasExecutionVariable(block: FlowGraphBlock, name: string) {
        return this._getUniqueIdPrefixedName(block, name) in this._executionVariables;
    }

    /**
     * Check if a connection value is defined
     * @internal
     * @param connectionPoint
     * @returns
     */
    public _hasConnectionValue(connectionPoint: FlowGraphDataConnection<any>) {
        return connectionPoint.uniqueId in this._connectionValues;
    }

    /**
     * Set a connection value
     * @internal
     * @param connectionPoint
     * @param value
     */
    public _setConnectionValue<T>(connectionPoint: FlowGraphDataConnection<T>, value: T) {
        this._connectionValues[connectionPoint.uniqueId] = value;
    }

    /**
     * Get a connection value
     * @internal
     * @param connectionPoint
     * @returns
     */
    public _getConnectionValue<T>(connectionPoint: FlowGraphDataConnection<T>): T {
        return this._connectionValues[connectionPoint.uniqueId];
    }

    /**
     * Get the configuration
     * @internal
     * @param name
     * @param value
     */
    public get configuration() {
        return this._configuration;
    }

    /**
     * Add a block to the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    public _addPendingBlock(block: FlowGraphAsyncExecutionBlock) {
        this._pendingBlocks.push(block);
    }

    /**
     * Remove a block from the list of blocks that have pending tasks.
     * @internal
     * @param block
     */
    public _removePendingBlock(block: FlowGraphAsyncExecutionBlock) {
        const index = this._pendingBlocks.indexOf(block);
        if (index !== -1) {
            this._pendingBlocks.splice(index, 1);
        }
    }

    /**
     * Clear all pending blocks.
     * @internal
     */
    public _clearPendingBlocks() {
        for (const block of this._pendingBlocks) {
            block._cancelPendingTasks(this);
        }
        this._pendingBlocks.length = 0;
    }

    /**
     * @internal
     * Function that notifies the node executed observable
     * @param node
     */
    public _notifyExecuteNode(node: FlowGraphBlock) {
        this.onNodeExecutedObservable.notifyObservers(node);
    }

    /**
     * @internal
     */
    public _increaseExecutionId() {
        this._executionId++;
    }
    /**
     * A monotonically increasing ID for each execution.
     * Incremented for every block executed.
     */
    public get executionId() {
        return this._executionId;
    }

    /**
     * Serializes a context
     * @param serializationObject the object to write the values in
     * @param valueSerializationFunction a function to serialize complex values
     */
    public serialize(serializationObject: any = {}, valueSerializationFunction: (key: string, value: any, serializationObject: any) => void = defaultValueSerializationFunction) {
        serializationObject.uniqueId = this.uniqueId;
        serializationObject._userVariables = {};
        for (const key in this._userVariables) {
            valueSerializationFunction(key, this._userVariables[key], serializationObject._userVariables);
        }
        serializationObject._connectionValues = {};
        for (const key in this._connectionValues) {
            valueSerializationFunction(key, this._connectionValues[key], serializationObject._connectionValues);
        }
    }

    /**
     * @returns the class name of the object.
     */
    public getClassName() {
        return "FGContext";
    }

    /**
     * Parses a context
     * @param serializationObject the object containing the context serialization values
     * @param options the options for parsing the context
     * @returns
     */
    public static Parse(serializationObject: ISerializedFlowGraphContext, options: IFlowGraphContextParseOptions): FlowGraphContext {
        const result = options.graph.createContext();
        const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
        result.uniqueId = serializationObject.uniqueId;
        for (const key in serializationObject._userVariables) {
            const value = valueParseFunction(key, serializationObject._userVariables, result._configuration.scene);
            result._userVariables[key] = value;
        }
        for (const key in serializationObject._connectionValues) {
            const value = valueParseFunction(key, serializationObject._connectionValues, result._configuration.scene);
            result._connectionValues[key] = value;
        }

        return result;
    }
}
