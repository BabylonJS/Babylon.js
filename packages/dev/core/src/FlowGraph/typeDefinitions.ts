import type { FlowGraphConnectionType } from "./flowGraphConnection";

/**
 * Definitions for the serialization of graphs
 */
export interface ISerializedFlowGraphContext {
    uniqueId: string;
    _userVariables: { [key: string]: any };
    _connectionValues: { [key: string]: any };
}

export interface ISerializedFlowGraphConnection {
    uniqueId: string;
    name: string;
    _connectionType: FlowGraphConnectionType;
    connectedPointIds: string[];
}

export interface ISerializedFlowGraphBlock {
    className: string;
    config: any;
    uniqueId: string;
    dataInputs: ISerializedFlowGraphConnection[];
    dataOutputs: ISerializedFlowGraphConnection[];
    metadata: any;
    signalInputs: ISerializedFlowGraphConnection[];
    signalOutputs: ISerializedFlowGraphConnection[];
}

export interface ISerializedFlowGraph {
    executionContexts: ISerializedFlowGraphContext[];
    allBlocks: ISerializedFlowGraphBlock[];
}
