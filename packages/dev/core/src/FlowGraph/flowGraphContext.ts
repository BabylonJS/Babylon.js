import type { FlowGraphBlock } from "./flowGraphBlock";

/**
 * @experimental
 * The context represents the current state of the flow graph.
 * It contains both user-defined variables, which are derived from
 * a more general variable definition, and execution variables that
 * are set by the blocks.
 */
export class FlowGraphContext {
    private _userVariables: Map<string, any> = new Map();
    private _executionVariables: Map<string, any> = new Map();

    public setVariable(name: string, value: any) {
        this._userVariables.set(name, value);
    }

    public getVariable(name: string): any {
        return this._userVariables.get(name);
    }

    private _getBlockPrefixedName(block: FlowGraphBlock, name: string): string {
        return block.uniqueId + "_" + name;
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
}
