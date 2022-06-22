import { FragmentOutputBlock } from "core/Materials/Node/Blocks/Fragment/fragmentOutputBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointCompatibilityStates, NodeMaterialConnectionPointDirection } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Nullable } from "core/types";
import { GlobalState } from "node-editor/globalState";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { INodeContainer } from "shared-ui-components/nodeGraphSystem/interfaces/nodeContainer";
import { IPortData, PortDataDirection } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { BlockNodeData } from "./blockNodeData";

export class ConnectionPointPortData implements IPortData {    
    private _connectedPort: Nullable<IPortData> = null;
    private _nodeContainer: INodeContainer;
    
    public data: NodeMaterialConnectionPoint;
    
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
        if (!this._connectedPort) {
            const otherBlock = this.data.connectedPoint!.ownerBlock;
            const otherNode = this._nodeContainer.nodes.find(n => n.content.data === otherBlock);

            if (otherNode) {
                this._connectedPort = otherNode.getPortDataForPortDataContent(this.data.connectedPoint!);
            }
        }

        return this._connectedPort;
    }

    public get direction() {
        switch (this.data.direction) {
            case NodeMaterialConnectionPointDirection.Input:
                return PortDataDirection.Input;
            default:
                return PortDataDirection.Output;
        }
    }

    public get ownerData() {
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
        
        this.data.endpoints.forEach(endpoint => {
            const endpointOwnerBlock = endpoint.ownerBlock;
            const endpointNode = this._nodeContainer.nodes.find(n => n.content.data === endpointOwnerBlock);
            endpoints.push(endpointNode!.getPortDataForPortDataContent(endpoint)!);
        });

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

    public disconnectFrom(port: IPortData){
        this.data.disconnectFrom(port.data);
        this._connectedPort = null;
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
            case NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible:
                return "Cannot connect two different connection types";

            case NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible:    
                return "Source block can only work in fragment shader whereas destination block is currently aimed for the vertex shader";

            case NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue:
                return "Source block cannot be connected with one of its ancestors"
        }

        return "";
    }

    public createDefaultInputData(rootData: any) {
        const customInputBlock = this.data.createCustomInputBlock();
        let pointName = "output";
        let emittedBlock;
        
        if (!customInputBlock) {
            emittedBlock = new InputBlock(
                NodeMaterialBlockConnectionPointTypes[this.data.type],
                undefined,
                this.data.type
            );
        } else {
            [emittedBlock, pointName] = customInputBlock;
        }

        const nodeMaterial = (rootData as GlobalState).nodeMaterial;
        nodeMaterial.attachedBlocks.push(emittedBlock);
        if (!emittedBlock.isInput) {
            emittedBlock.autoConfigure(nodeMaterial);
        }

        return {
            data: new BlockNodeData(emittedBlock, this._nodeContainer),
            name: pointName
        }
    }
}