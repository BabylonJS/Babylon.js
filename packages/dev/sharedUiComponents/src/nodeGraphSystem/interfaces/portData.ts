import type { Nullable } from "core/types";
import type { GraphNode } from "../graphNode";

export enum PortDataDirection {
    /** Input */
    Input,
    /** Output */
    Output,
}

export enum PortDirectValueTypes {
    Float,
    Int,
}

export interface IPortDirectValueDefinition {
    /**
     * Gets the source object
     */
    source: any;
    /**
     * Gets the property name used to store the value
     */
    propertyName: string;

    /**
     * Gets or sets the min value accepted for this point if nothing is connected
     */
    valueMin: Nullable<any>;

    /**
     * Gets or sets the max value accepted for this point if nothing is connected
     */
    valueMax: Nullable<any>;

    /**
     * Gets or sets the type of the value
     */
    valueType: PortDirectValueTypes;
}

export interface IPortData {
    data: any;
    name: string;
    internalName: string;
    isExposedOnFrame: boolean;
    exposedPortPosition: number;
    isConnected: boolean;
    isInactive: boolean;
    direction: PortDataDirection;
    ownerData: any;
    connectedPort: Nullable<IPortData>;
    needDualDirectionValidation: boolean;
    hasEndpoints: boolean;
    endpoints: Nullable<IPortData[]>;
    directValueDefinition?: IPortDirectValueDefinition;

    updateDisplayName: (newName: string) => void;
    canConnectTo: (port: IPortData) => boolean;
    connectTo: (port: IPortData) => void;
    disconnectFrom: (port: IPortData) => void;
    checkCompatibilityState(port: IPortData): number;
    getCompatibilityIssueMessage(issue: number, targetNode: GraphNode, targetPort: IPortData): string;
}
