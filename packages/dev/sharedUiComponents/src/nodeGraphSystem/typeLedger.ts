import { GraphNode } from "./graphNode";
import { INodeData } from "./interfaces/nodeData";
import { IPortData } from "./interfaces/portData";
import { NodePort } from "./nodePort";

export class TypeLedger {
    public static PortDataBuilder: (port: NodePort) => IPortData;
    public static NodeDataBuilder: (data: any, existingNodes: GraphNode[]) => INodeData;
}