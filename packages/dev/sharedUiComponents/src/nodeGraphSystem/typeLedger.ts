import { INodeContainer } from "./interfaces/nodeContainer";
import { INodeData } from "./interfaces/nodeData";
import { IPortData } from "./interfaces/portData";
import { NodePort } from "./nodePort";

export class TypeLedger {
    public static PortDataBuilder: (port: NodePort, nodeContainer: INodeContainer) => IPortData;
    public static NodeDataBuilder: (data: any, nodeContainer: INodeContainer) => INodeData;
}