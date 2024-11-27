import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { BlockNodeData } from "./blockNodeData";
import { ConnectionPointPortData } from "./connectionPointPortData";
import type { NodeRenderGraphConnectionPoint } from "core/FrameGraph/Node/nodeRenderGraphBlockConnectionPoint";

export const RegisterTypeLedger = () => {
    TypeLedger.PortDataBuilder = (data, nodeContainer) => {
        return new ConnectionPointPortData(data.portData.data as NodeRenderGraphConnectionPoint, nodeContainer);
    };

    TypeLedger.NodeDataBuilder = (data, nodeContainer) => {
        return new BlockNodeData(data, nodeContainer);
    };
};
