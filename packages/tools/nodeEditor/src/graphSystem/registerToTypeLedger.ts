import { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { BlockNodeData } from "./blockNodeData";
import { ConnectionPointPortData } from "./connectionPointPortData";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data) => {
        return new ConnectionPointPortData(data.portData.data as NodeMaterialConnectionPoint);
    }

    TypeLedger.NodeDataBuilder = (data, existingNodes: GraphNode[]) => {
        return new BlockNodeData(data, existingNodes);
    }
}
