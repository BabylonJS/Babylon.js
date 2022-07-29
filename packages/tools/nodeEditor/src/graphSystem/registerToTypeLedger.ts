import type { NodeMaterialConnectionPoint } from "core/Materials/Node/nodeMaterialBlockConnectionPoint";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { BlockNodeData } from "./blockNodeData";
import { ConnectionPointPortData } from "./connectionPointPortData";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data, nodeContainer) => {
        return new ConnectionPointPortData(data.portData.data as NodeMaterialConnectionPoint, nodeContainer);
    };

    TypeLedger.NodeDataBuilder = (data, nodeContainer) => {
        return new BlockNodeData(data, nodeContainer);
    };
};
