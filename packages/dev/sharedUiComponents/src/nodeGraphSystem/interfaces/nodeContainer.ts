import type { GraphNode } from "../graphNode";
import type { INodeData } from "./nodeData";

export interface INodeContainer {
    nodes: GraphNode[];
    appendNode(data: INodeData): GraphNode;
}
