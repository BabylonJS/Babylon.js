import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import {
    NodeGeometryConnectionPointDirection,
    type NodeGeometryConnectionPoint,
    NodeGeometryConnectionPointCompatibilityStates,
} from "core/Meshes/Node/nodeGeometryBlockConnectionPoint";
import type { Nullable } from "core/types";
import type { GlobalState } from "node-geometry-editor/globalState";
import type { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { PortDataDirection, PortDirectValueTypes } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { GetConnectionErrorMessage } from "shared-ui-components/nodeGraphSystem/tools";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";

export class ConnectionPointPortData implements IPortData {
    private _connectedPort: Nullable<IPortData> = null;
    private _nodeContainer: INodeContainer;

    public data: NodeGeometryConnectionPoint;

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
        return this.data.isExposedOnFrame;
    }

    public set isExposedOnFrame(value: boolean) {
        this.data.isExposedOnFrame = value;
    }

    public get exposedPortPosition() {
        return this.data.exposedPortPosition;
    }

    public set exposedPortPosition(value: number) {
        this.data.exposedPortPosition = value;
    }

    public get isConnected() {
        return this.data.isConnected;
    }

    public get connectedPort() {
        if (!this.isConnected) {
            return null;
        }
        if (!this._connectedPort && this.data.connectedPoint) {
            const otherBlock = this.data.connectedPoint!.ownerBlock;
            let otherNode = this._nodeContainer.nodes.find((n) => n.content.data === otherBlock);

            if (!otherNode) {
                otherNode = this._nodeContainer.appendNode(TypeLedger.NodeDataBuilder(otherBlock, this._nodeContainer));

                const globalState = (this._nodeContainer as GraphCanvasComponent).stateManager.data as GlobalState;
                if (globalState.nodeGeometry!.attachedBlocks.indexOf(otherBlock) === -1) {
                    globalState.nodeGeometry!.attachedBlocks.push(otherBlock);
                }
            }

            this._connectedPort = otherNode.getPortDataForPortDataContent(this.data.connectedPoint!);
        }

        return this._connectedPort;
    }

    public set connectedPort(value: Nullable<IPortData>) {
        this._connectedPort = value;
    }

    public get directValueDefinition() {
        if (this.direction === PortDataDirection.Output) {
            return undefined;
        }

        if (this.data.value === null || this.data.value === undefined) {
            return undefined;
        }

        const acceptedTypes = [NodeGeometryBlockConnectionPointTypes.Float, NodeGeometryBlockConnectionPointTypes.Int];

        if (acceptedTypes.indexOf(this.data.type) !== -1 || (this.data._defaultConnectionPointType && acceptedTypes.indexOf(this.data._defaultConnectionPointType) !== -1)) {
            return {
                source: this.data,
                propertyName: "value",
                valueMin: this.data.valueMin,
                valueMax: this.data.valueMax,
                valueType: this.data.type === NodeGeometryBlockConnectionPointTypes.Float ? PortDirectValueTypes.Float : PortDirectValueTypes.Int,
            };
        }

        return undefined;
    }

    public get direction() {
        switch (this.data.direction) {
            case NodeGeometryConnectionPointDirection.Input:
                return PortDataDirection.Input;
            default:
                return PortDataDirection.Output;
        }
    }

    public get ownerData(): NodeGeometryBlock {
        return this.data.ownerBlock;
    }

    public get needDualDirectionValidation() {
        return false;
    }

    public get hasEndpoints() {
        return this.data.hasEndpoints;
    }

    public get endpoints() {
        const endpoints: IPortData[] = [];

        for (const endpoint of this.data.endpoints) {
            const endpointOwnerBlock = endpoint.ownerBlock;
            const endpointNode = this._nodeContainer.nodes.find((n) => n.content.data === endpointOwnerBlock);
            endpoints.push(endpointNode!.getPortDataForPortDataContent(endpoint)!);
        }

        return endpoints;
    }

    public constructor(connectionPoint: NodeGeometryConnectionPoint, nodeContainer: INodeContainer) {
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
        port.connectedPort = null;
    }

    public checkCompatibilityState(port: IPortData) {
        const state = this.data.checkCompatibilityState(port.data);

        switch (state) {
            case NodeGeometryConnectionPointCompatibilityStates.Compatible:
                return 0;

            default:
                return state;
        }
    }

    public getCompatibilityIssueMessage(issue: number, targetNode: GraphNode, targetPort: IPortData) {
        switch (issue) {
            case NodeGeometryConnectionPointCompatibilityStates.TypeIncompatible: {
                return GetConnectionErrorMessage(
                    this.data.type,
                    NodeGeometryBlockConnectionPointTypes,
                    NodeGeometryBlockConnectionPointTypes.All,
                    NodeGeometryBlockConnectionPointTypes.AutoDetect,
                    targetPort.data as NodeGeometryConnectionPoint,
                    [NodeGeometryBlockConnectionPointTypes.BasedOnInput]
                );
            }
            case NodeGeometryConnectionPointCompatibilityStates.HierarchyIssue:
                return "Source block cannot be connected with one of its ancestors";
        }

        return "";
    }
}
