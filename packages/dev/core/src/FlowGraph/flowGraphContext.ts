import type { FlowGraphAsyncExecutionBlock } from "./flowGraphAsyncExecutionBlock";
import type { FlowGraphBlock } from "./flowGraphBlock";

/**
 * @experimental
 * The context represents the current state of the flow graph.
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
    private _graphVariables: Map<string, any> = new Map();
    /**
     * These are blocks that have currently pending tasks/listeners that need to be cleaned up.
     */
    private _pendingBlocks: FlowGraphAsyncExecutionBlock[] = [];

    public hasVariable(name: string) {
        return this._userVariables.has(name);
    }

    public setVariable(name: string, value: any) {
        this._userVariables.set(name, value);
    }

    public getVariable(name: string): any {
        return this._userVariables.get(name);
    }

    private _getBlockPrefixedName(block: FlowGraphBlock, name: string): string {
        return `${block.uniqueId}_${name}`;
    }

    /**
     * @internal
     * @param name
     * @param value
     */
    public _setExecutionVariable(block: FlowGraphBlock, name: string, value: any) {
        this._executionVariables.set(this._getBlockPrefixedName(block, name), value);
    }

    /**
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
     * @internal
     * @param name
     * @param value
     */
    public _setGraphVariable(name: string, value: any) {
        this._graphVariables.set(name, value);
    }

    /**
     * @internal
     * @param name
     * @returns
     */
    public _getGraphVariable(name: string): any {
        return this._graphVariables.get(name);
    }

    /**
     * @internal
     * @param block
     */
    public _addPendingBlock(block: FlowGraphAsyncExecutionBlock) {
        this._pendingBlocks.push(block);
    }

    /**
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
     * @internal
     */
    public _clearPendingBlocks() {
        for (const block of this._pendingBlocks) {
            block._cancelPendingTasks(this);
        }
        this._pendingBlocks.length = 0;
    }
}
