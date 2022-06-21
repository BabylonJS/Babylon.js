import { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { IPortData } from "node-editor/sharedComponents/nodeGraphEngine/portData";

export class ConnectionPointPortData implements IPortData {
    public data: NodeMaterialConnectionPoint;
    
    public getName() {
        const block = this.data.ownerBlock;
        let portName = this.data.displayName || this.data.name;
        if (this.data.ownerBlock.isInput) {
            portName = block.name;
        }

        return portName;
    }

    public constructor(connectionPoint: NodeMaterialConnectionPoint) {
        this.data = connectionPoint;
    }
}