import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialConnectionPoint, NodeMaterialConnectionPointCompatibilityStates, NodeMaterialConnectionPointDirection } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { Nullable } from "core/types";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { IPortData, PortCompatibilityStates, PortDataDirection } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { BlockNodeData } from "./blockNodeData";

export class ConnectionPointPortData implements IPortData {    
    private _connectedPort: Nullable<IPortData> = null;
    
    public data: NodeMaterialConnectionPoint;
    
    public get name() {
        const block = this.data.ownerBlock;
        let portName = this.data.displayName || this.data.name;
        if (this.data.ownerBlock.isInput) {
            portName = block.name;
        }

        return portName;
    }

    public get isExposedOnFrame() {
        return this.data.isExposedOnFrame;
    }

    public get exposedPortPosition() {
        return this.data.exposedPortPosition;
    }

    public get isConnected() {
        return this.data.isConnected;
    }

    public get connectedPort() {
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

    public constructor(connectionPoint: NodeMaterialConnectionPoint, existingNodes?: GraphNode[]) {
        this.data = connectionPoint;

        if (connectionPoint.isConnected && existingNodes) {
            const otherBlock = connectionPoint.connectedPoint!.ownerBlock;
            const otherNode = existingNodes.find(n => n.content.data === otherBlock);

            if (otherNode) {
                this._connectedPort = otherNode.getPortDataForPortDataContent(connectionPoint.connectedPoint!);
            }
        }
    }

    public updateDisplayName(newName: string) {
        this.data.displayName = newName;;
    }

    public connectTo(port: IPortData) {
        this.data.connectTo(port.data);
        this._connectedPort = port;
    }

    public disconnectFrom(port: IPortData){
        this.data.disconnectFrom(port.data);
    }

    public checkCompatibilityState(port: IPortData) {
        const state = this.data.checkCompatibilityState(port.data);

        switch (state) {
            case NodeMaterialConnectionPointCompatibilityStates.Compatible:
                return PortCompatibilityStates.Compatible;

            case NodeMaterialConnectionPointCompatibilityStates.TypeIncompatible:
                return PortCompatibilityStates.TypeIncompatible;

            case NodeMaterialConnectionPointCompatibilityStates.TargetIncompatible:
                return PortCompatibilityStates.TargetIncompatible;

            case NodeMaterialConnectionPointCompatibilityStates.HierarchyIssue:
                return PortCompatibilityStates.HierarchyIssue;
        }
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

        const nodeMaterial = rootData as NodeMaterial;
        nodeMaterial.attachedBlocks.push(emittedBlock);
        if (!emittedBlock.isInput) {
            emittedBlock.autoConfigure(nodeMaterial);
        }

        return {
            data: new BlockNodeData(emittedBlock),
            name: pointName
        }
    }
}