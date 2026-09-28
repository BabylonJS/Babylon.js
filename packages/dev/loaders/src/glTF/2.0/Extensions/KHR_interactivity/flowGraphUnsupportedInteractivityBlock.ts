import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import { type FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection.pure";
import { getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes.pure";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger.pure";
import { FlowGraphMatrix2D, FlowGraphMatrix3D } from "core/FlowGraph/CustomTypes/flowGraphMatrix";
import { Matrix, Vector2, Vector3, Vector4 } from "core/Maths/math.vector.pure";

/**
 * Socket definition retained for an unsupported extension operation.
 */
export interface IFlowGraphUnsupportedInteractivitySocket {
    /** Socket name. */
    name: string;
    /** FlowGraph runtime type name. */
    type?: string;
    /** Exact KHR_interactivity type signature. */
    signature?: string;
}

function _GetDefaultValue(signature?: string): unknown {
    switch (signature) {
        case "bool":
            return false;
        case "int":
            return new FlowGraphInteger(0);
        case "float":
            return NaN;
        case "float2":
            return new Vector2(NaN, NaN);
        case "float3":
            return new Vector3(NaN, NaN, NaN);
        case "float4":
            return new Vector4(NaN, NaN, NaN, NaN);
        case "float2x2":
            return new FlowGraphMatrix2D([NaN, NaN, NaN, NaN]);
        case "float3x3":
            return new FlowGraphMatrix3D([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]);
        case "float4x4":
            return Matrix.FromArray([NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]);
        case "ref":
            return "";
        default:
            return undefined;
    }
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

        for (const socket of config.inputValueSockets ?? []) {
            this.registerDataInput(socket.name, getRichTypeByFlowGraphType(socket.type));
        }
        for (const socket of config.outputValueSockets ?? []) {
            this.registerDataOutput(socket.name, getRichTypeByFlowGraphType(socket.type), _GetDefaultValue(socket.signature));
        }
        for (const socket of config.inputFlowSockets ?? []) {
            this._registerSignalInput(socket);
        }
        for (const socket of config.outputFlowSockets ?? []) {
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
