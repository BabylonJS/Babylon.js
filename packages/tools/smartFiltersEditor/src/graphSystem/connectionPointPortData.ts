import type { Nullable } from "@babylonjs/core/types";
import type { GraphNode } from "@babylonjs/shared-ui-components/nodeGraphSystem/graphNode";
import type { INodeContainer } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/portData";
import { PortDataDirection } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/portData.js";
import { TypeLedger } from "@babylonjs/shared-ui-components/nodeGraphSystem/typeLedger.js";
import type { ConnectionPoint } from "@babylonjs/smart-filters";
import { getCompatibilityIssueMessage, ConnectionPointDirection } from "@babylonjs/smart-filters";

export class ConnectionPointPortData implements IPortData {
    private _connectedPort: Nullable<IPortData> = null;
    private _nodeContainer: INodeContainer;

    public data: ConnectionPoint;

    public get name() {
        const block = this.data.ownerBlock;
        let portName = this.data.displayName || this.data.name;
        if (this.data.ownerBlock.isInput) {
            portName = block.name;
        }

        return portName;
    }

    public get internalName() {
        return this.data.name;
    }

    public get isExposedOnFrame() {
        // return this.data.isExposedOnFrame;
        return false;
    }

    public set isExposedOnFrame(_value: boolean) {
        // this.data.isExposedOnFrame = value;
    }

    public get exposedPortPosition() {
        // return this.data.exposedPortPosition;
        return -1;
    }

    public set exposedPortPosition(_value: number) {
        // this.data.exposedPortPosition = value;
    }

    public get isConnected() {
        // return this.data.isConnected;
        return this.data.connectedTo !== null || this.hasEndpoints;
    }

    public get connectedPort() {
        if (!this.isConnected) {
            return null;
        }
        if (!this._connectedPort) {
            const otherBlock = this.data.connectedTo!.ownerBlock;
            let otherNode = this._nodeContainer.nodes.find((n) => n.content.data === otherBlock);

            if (!otherNode) {
                otherNode = this._nodeContainer.appendNode(TypeLedger.NodeDataBuilder(otherBlock, this._nodeContainer));
            }

            this._connectedPort = otherNode.getPortDataForPortDataContent(this.data.connectedTo!);
        }

        return this._connectedPort;
    }

    public set connectedPort(value: Nullable<IPortData>) {
        this._connectedPort = value;
    }

    public get direction() {
        switch (this.data.direction) {
            case ConnectionPointDirection.Input:
                return PortDataDirection.Input;
            default:
                return PortDataDirection.Output;
        }
    }

    public get ownerData() {
        return this.data.ownerBlock;
    }

    public get needDualDirectionValidation() {
        // return this.data.needDualDirectionValidation;
        return false;
    }

    public get hasEndpoints() {
        // return this.data.hasEndpoints;
        return this.data.endpoints.length > 0;
    }

    public get endpoints() {
        const endpoints: IPortData[] = [];

        this.data.endpoints.forEach((endpoint) => {
            const endpointOwnerBlock = endpoint.ownerBlock;
            const endpointNode = this._nodeContainer.nodes.find((n) => n.content.data === endpointOwnerBlock);
            endpoints.push(endpointNode!.getPortDataForPortDataContent(endpoint)!);
        });

        return endpoints;
    }

    public constructor(connectionPoint: ConnectionPoint, nodeContainer: INodeContainer) {
        this.data = connectionPoint;
        this._nodeContainer = nodeContainer;
    }

    public updateDisplayName(newName: string) {
        this.data.displayName = newName;
    }

    public connectTo(port: IPortData) {
        this.data.connectTo(port.data);
        this._connectedPort = port;
    }

    public canConnectTo(port: IPortData): boolean {
        return this.data.canConnectTo(port.data);
    }

    public disconnectFrom(port: IPortData) {
        this.data.disconnectFrom(port.data);
        port.data.runtimeData = port.data.defaultRuntimeData;
        port.connectedPort = null;
    }

    public checkCompatibilityState(port: IPortData) {
        return this.data.checkCompatibilityState(port.data);
    }

    public getCompatibilityIssueMessage(issue: number, _targetNode: GraphNode, _targetPort: IPortData) {
        return getCompatibilityIssueMessage(issue);
    }
}
