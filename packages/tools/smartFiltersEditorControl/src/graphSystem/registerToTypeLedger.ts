import { TypeLedger } from "@babylonjs/shared-ui-components/nodeGraphSystem/typeLedger.js";
import { BlockNodeData } from "./blockNodeData.js";
import { ConnectionPointPortData } from "./connectionPointPortData.js";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data, nodeContainer) => {
        return new ConnectionPointPortData(data.portData.data, nodeContainer);
    };

    TypeLedger.NodeDataBuilder = (data, nodeContainer) => {
        return new BlockNodeData(data, nodeContainer);
    };
};
