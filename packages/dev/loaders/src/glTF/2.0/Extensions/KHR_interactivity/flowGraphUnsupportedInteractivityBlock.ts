import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection.pure";
import { getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes.pure";

/**
 * Socket definition retained for an unsupported extension operation.
 */
export interface IFlowGraphUnsupportedInteractivitySocket {
    /** Socket name. */
    name: string;
    /** FlowGraph runtime type name. */
    type?: string;
}

/**
 * Configuration for an unsupported KHR_interactivity extension operation.
 */
export interface IFlowGraphUnsupportedInteractivityBlockConfiguration extends IFlowGraphBlockConfiguration {
    /** Full extension operation name. */
    operation: string;
    /** Input value sockets declared by the extension. */
    inputValueSockets: IFlowGraphUnsupportedInteractivitySocket[];
    /** Output value sockets declared by the extension. */
    outputValueSockets: IFlowGraphUnsupportedInteractivitySocket[];
    /** Input flow sockets used by the source graph. */
    inputFlowSockets: string[];
    /** Output flow sockets used by the source graph. */
    outputFlowSockets: string[];
}

/**
 * Inspectable runtime no-op for an operation owned by an unsupported glTF extension.
 */
export class FlowGraphUnsupportedInteractivityBlock extends FlowGraphExecutionBlock {
    constructor(public override config: IFlowGraphUnsupportedInteractivityBlockConfiguration) {
        super(config);
        this._unregisterSignalInput("in");
        this._unregisterSignalOutput("error");

        for (const socket of config.inputValueSockets) {
            this.registerDataInput(socket.name, getRichTypeByFlowGraphType(socket.type));
        }
        for (const socket of config.outputValueSockets) {
            this.registerDataOutput(socket.name, getRichTypeByFlowGraphType(socket.type));
        }
        for (const socket of config.inputFlowSockets) {
            this._registerSignalInput(socket);
        }
        for (const socket of config.outputFlowSockets) {
            this._registerSignalOutput(socket);
        }
    }

    /** @internal */
    public override _execute(_context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        // Unsupported extension operations are required to behave as no-ops.
    }

    /** @returns the serialized class name */
    public override getClassName(): string {
        return "FlowGraphUnsupportedInteractivityBlock";
    }
}
