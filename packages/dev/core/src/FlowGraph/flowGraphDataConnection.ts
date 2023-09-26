import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphConnection, FlowGraphConnectionType } from "./flowGraphConnection";
import type { FlowGraphContext } from "./flowGraphContext";
import type { RichType } from "./flowGraphRichTypes";
/**
 * @experimental
 * Represents a connection point for data.
 * An unconnected input point can have a default value.
 * An output point will only have a value if it is connected to an input point. Furthermore,
 * if the point belongs to a "function" node, the node will run its function to update the value.
 */
export class FlowGraphDataConnection<T> extends FlowGraphConnection<FlowGraphBlock, FlowGraphDataConnection<T>> {
    /**
     * Create a new data connection point.
     * @param name
     * @param connectionType
     * @param ownerBlock
     * @param richType
     */
    public constructor(name: string, connectionType: FlowGraphConnectionType, ownerBlock: FlowGraphBlock, public richType: RichType<T>) {
        super(name, connectionType, ownerBlock);
    }

    /**
     * An output data block can connect to multiple input data blocks,
     * but an input data block can only connect to one output data block.
     */
    public _isSingularConnection(): boolean {
        return this.connectionType === FlowGraphConnectionType.Input;
    }

    /**
     * Set the value of the connection in a specific context.
     * @param value the value to set
     * @param context the context to which the value is set
     */
    public setValue(value: T, context: FlowGraphContext): void {
        context._setConnectionValue(this, value);
    }

    private _getValueOrDefault(context: FlowGraphContext): T {
        if (context._hasConnectionValue(this)) {
            return context._getConnectionValue(this);
        } else {
            return this.richType.defaultValueBuilder();
        }
    }

    /**
     * Gets the value of the connection in a specific context.
     * @param context the context from which the value is retrieved
     * @returns the value of the connection
     */
    public getValue(context: FlowGraphContext): T {
        if (this.connectionType === FlowGraphConnectionType.Output) {
            this._ownerBlock._updateOutputs(context);
            return this._getValueOrDefault(context);
        }

        if (!this.isConnected()) {
            return this._getValueOrDefault(context);
        } else {
            return this._connectedPoint[0].getValue(context);
        }
    }
}
