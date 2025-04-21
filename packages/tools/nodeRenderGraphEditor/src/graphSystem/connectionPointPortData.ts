import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";
import {
    NodeRenderGraphConnectionPointDirection,
    NodeRenderGraphConnectionPointCompatibilityStates,
    NodeRenderGraphBlockConnectionPointTypes,
} from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import type { Nullable } from "core/types";
import type { GlobalState } from "node-render-graph-editor/globalState";
import type { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import type { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { PortDataDirection } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { GetConnectionErrorMessage } from "shared-ui-components/nodeGraphSystem/tools";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";

export class ConnectionPointPortData implements IPortData {
    private _connectedPort: Nullable<IPortData> = null;
    private _nodeContainer: INodeContainer;

    public data: NodeRenderGraphConnectionPoint;

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
                if (globalState.nodeRenderGraph!.attachedBlocks.indexOf(otherBlock) === -1) {
                    globalState.nodeRenderGraph!.attachedBlocks.push(otherBlock);
                }
            }

            this._connectedPort = otherNode.getPortDataForPortDataContent(this.data.connectedPoint!);
        }

        return this._connectedPort;
    }

    public set connectedPort(value: Nullable<IPortData>) {
        this._connectedPort = value;
    }

    public get direction() {
        switch (this.data.direction) {
            case NodeRenderGraphConnectionPointDirection.Input:
                return PortDataDirection.Input;
            default:
                return PortDataDirection.Output;
        }
    }

    public get ownerData(): NodeRenderGraphBlock {
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

    public constructor(connectionPoint: NodeRenderGraphConnectionPoint, nodeContainer: INodeContainer) {
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
            case NodeRenderGraphConnectionPointCompatibilityStates.Compatible:
                return 0;

            default:
                return state;
        }
    }

    public getCompatibilityIssueMessage(issue: number, targetNode: GraphNode, targetPort: IPortData) {
        switch (issue) {
            case NodeRenderGraphConnectionPointCompatibilityStates.TypeIncompatible: {
                return GetConnectionErrorMessage(
                    this.data.type,
                    NodeRenderGraphBlockConnectionPointTypes,
                    NodeRenderGraphBlockConnectionPointTypes.All,
                    NodeRenderGraphBlockConnectionPointTypes.AutoDetect,
                    targetPort.data as NodeRenderGraphConnectionPoint
                );
            }
            case NodeRenderGraphConnectionPointCompatibilityStates.HierarchyIssue:
                return "Source block cannot be connected with one of its ancestors";
        }

        return "";
    }
}
