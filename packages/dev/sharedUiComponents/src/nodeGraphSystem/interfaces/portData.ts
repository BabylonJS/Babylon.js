import { Nullable } from "core/types";
import { INodeData } from "./nodeData";

export enum PortDataDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

/**
 * Enum used to define the compatibility state between two connection points
 */
 export enum PortCompatibilityStates {
    /** Points are compatibles */
    Compatible,
    /** Points are incompatible because of their types */
    TypeIncompatible,
    /** Points are incompatible because of their targets (vertex vs fragment) */
    TargetIncompatible,
    /** Points are incompatible because they are in the same hierarchy **/
    HierarchyIssue,
}

export interface IPortData {
    data: any;
    name: string;
    isExposedOnFrame: boolean;
    exposedPortPosition: number;
    isConnected: boolean;
    direction: PortDataDirection;
    ownerData: any;
    connectedPort: Nullable<IPortData>;
    needDualDirectionValidation: boolean;
    hasEndpoints: boolean;

    updateDisplayName: (newName: string) => void;
    connectTo: (port: IPortData) => void;
    disconnectFrom: (port: IPortData) => void;
    checkCompatibilityState(port: IPortData): PortCompatibilityStates;

    createDefaultInputData(rootData: any): { data: INodeData, name: string};
}