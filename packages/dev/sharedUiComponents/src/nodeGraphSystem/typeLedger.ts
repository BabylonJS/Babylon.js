import type { INodeContainer } from "./interfaces/nodeContainer";
import type { INodeData } from "./interfaces/nodeData";
import type { IPortData } from "./interfaces/portData";
import type { NodePort } from "./nodePort";

export class TypeLedger {
    public static PortDataBuilder: (port: NodePort, nodeContainer: INodeContainer) => IPortData;
    public static NodeDataBuilder: (data: any, nodeContainer: INodeContainer) => INodeData;
}
