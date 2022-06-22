import { Nullable } from "core/types";
import { GraphNode } from "../graphNode";
import { INodeData } from "./nodeData";

export enum PortDataDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}


export interface IPortData {
    data: any;
    name: string;
    internalName: string;
    isExposedOnFrame: boolean;
    exposedPortPosition: number;
    isConnected: boolean;
    direction: PortDataDirection;
    ownerData: any;
    connectedPort: Nullable<IPortData>;
    needDualDirectionValidation: boolean;
    hasEndpoints: boolean;
    endpoints: Nullable<IPortData[]>;

    updateDisplayName: (newName: string) => void;
    connectTo: (port: IPortData) => void;
    disconnectFrom: (port: IPortData) => void;
    checkCompatibilityState(port: IPortData): number;
    getCompatibilityIssueMessage(issue: number, targetNode: GraphNode, targetPort: IPortData): string;

    createDefaultInputData(rootData: any): { data: INodeData, name: string};
}