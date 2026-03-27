import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { BlockNodeData } from "./blockNodeData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import type { FlowGraphConnectionPoint } from "./connectionPointPortData";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data, nodeContainer) => {
        const connectionPoint = data.portData.data as FlowGraphConnectionPoint;
        const kind = (data.portData as any).connectionKind ?? "data";
        return new ConnectionPointPortData(connectionPoint, nodeContainer, kind);
    };

    TypeLedger.NodeDataBuilder = (data, nodeContainer) => {
        return new BlockNodeData(data, nodeContainer);
    };
};
