import type { Scene } from "../scene";
import type { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphEventCoordinator } from "./flowGraphEventCoordinator";

/**
 * Construction parameters for the context.
 * @experimental
 */
export interface IFlowGraphGraphVariables {
    /**
     * The scene that the flow graph context belongs to.
     */
    readonly scene: Scene;
    /**
     * The event coordinator used by the flow graph context.
     */
    readonly eventCoordinator: FlowGraphEventCoordinator;
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
     * These are the variables defined by a user.
     */
    private _userVariables: Map<string, any> = new Map();
    /**
     * These are the variables set by the blocks.
     */
    private _executionVariables: Map<string, any> = new Map();
    /**
     * These are the variables set by the graph.
     */
    private readonly _graphVariables: IFlowGraphGraphVariables;
    /**
     * These are blocks that have currently pending tasks/listeners that need to be cleaned up.
     */
    private _pendingBlocks: FlowGraphAsyncExecutionBlock[] = [];

    constructor(params: IFlowGraphGraphVariables) {
        this._graphVariables = params;
    }

    /**
     * Check if a user-defined variable is defined.
     * @param name
     * @returns
     */
    public hasVariable(name: string) {
        return this._userVariables.has(name);
    }

    /**
     * Set a user-defined variable.
     * @param name
     * @param value
     */
    public setVariable(name: string, value: any) {
        this._userVariables.set(name, value);
    }

    /**
     * Get a user-defined variable.
     * @param name
     * @returns
     */
    public getVariable(name: string): any {
        return this._userVariables.get(name);
    }

    private _getBlockPrefixedName(block: FlowGraphBlock, name: string): string {
        return `${block.uniqueId}_${name}`;
    }

    /**
     * Set an internal execution variable
     * @internal
     * @param name
     * @param value
     */
    public _setExecutionVariable(block: FlowGraphBlock, name: string, value: any) {
        this._executionVariables.set(this._getBlockPrefixedName(block, name), value);
    }

    /**
     * Get an internal execution variable
     * @internal
     * @param name
     * @returns
     */
    public _getExecutionVariable(block: FlowGraphBlock, name: string): any {
        return this._executionVariables.get(this._getBlockPrefixedName(block, name));
    }

    public _deleteExecutionVariable(block: FlowGraphBlock, name: string) {
        this._executionVariables.delete(this._getBlockPrefixedName(block, name));
    }

    /**
     * Get the graph set variables
     * @internal
     * @param name
     * @param value
     */
    public get graphVariables() {
        return this._graphVariables;
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
}
