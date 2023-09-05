import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { BlockNodeData } from "./blockNodeData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import type { NodeGeometryConnectionPoint } from "core/Meshes/Node/nodeGeometryBlockConnectionPoint";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data, nodeContainer) => {
        return new ConnectionPointPortData(data.portData.data as NodeGeometryConnectionPoint, nodeContainer);
    };

    TypeLedger.NodeDataBuilder = (data, nodeContainer) => {
        return new BlockNodeData(data, nodeContainer);
    };
};
