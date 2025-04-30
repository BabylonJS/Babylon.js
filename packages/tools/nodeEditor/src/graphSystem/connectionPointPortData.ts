import { NodeMaterialBlockConnectionPointTypes } from "core/Materials";
import type { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { NodeMaterialConnectionPointCompatibilityStates, NodeMaterialConnectionPointDirection } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import type { Nullable } from "core/types";
import type { GlobalState } from "node-editor/globalState";
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

    public data: NodeMaterialConnectionPoint;

    public get name() {
        const block = this.data.ownerBlock;
        let portName = this.data.displayName || this.data.name;
        if (this.data.ownerBlock.isInput && this.data.ownerBlock.inputs.length === 1) {
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
                if (globalState.nodeMaterial!.attachedBlocks.indexOf(otherBlock) === -1) {
                    globalState.nodeMaterial!.attachedBlocks.push(otherBlock);
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
            case NodeMaterialConnectionPointDirection.Input:
                return PortDataDirection.Input;
            default:
                return PortDataDirection.Output;
        }
    }

    public get ownerData(): NodeMaterialBlock {
        return this.data.ownerBlock;
    }

    public get needDualDirectionValidation() {
        return this.data.needDualDirectionValidation;
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

    public constructor(connectionPoint: NodeMaterialConnectionPoint, nodeContainer: INodeContainer) {
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
            case NodeMaterialConnectionPointCompatibilityStates.Compatible:
                return 0;

            default:
                return state;
        }
    }

    public getCompatibilityIssueMessage(issue: number, targetNode: GraphNode, targetPort: IPortData) {
        if (!issue) {
            const isFragmentOutput = targetPort.ownerData.getClassName() === "FragmentOutputBlock";
            if (isFragmentOutput) {
                const fragmentBlock = targetPort.ownerData as FragmentOutputBlock;

                if (targetPort.name === "rgb" && fragmentBlock.rgba.isConnected) {
                    targetNode.getLinksForPortDataContent(fragmentBlock.rgba)[0].dispose();
                } else if (targetPort.name === "rgba" && fragmentBlock.rgb.isConnected) {
                    targetNode.getLinksForPortDataContent(fragmentBlock.rgb)[0].dispose();
                }
                return "";
            }
        }

        switch (issue) {
            case NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible: {
                return GetConnectionErrorMessage(
                    this.data.type,
                    NodeMaterialBlockConnectionPointTypes,
                    NodeMaterialBlockConnectionPointTypes.All,
                    NodeMaterialBlockConnectionPointTypes.AutoDetect,
                    targetPort.data as NodeMaterialConnectionPoint
                );
            }

            case NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible:
                return "Source block can only work in fragment shader whereas destination block is currently aimed for the vertex shader";

            case NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue:
                return "Source block cannot be connected with one of its ancestors";
        }

        return "";
    }
}
