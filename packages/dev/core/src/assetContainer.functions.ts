import type { INodeContainer } from "./INodeContainer";
import type { Node } from "./node";

/**
 * Get all nodes from the container
 * @param container Container to get nodes from
 * @returns the array of nodes
 */
export function GetNodes(container: INodeContainer): Array<Node> {
    let nodes: Node[] = [];
    nodes = nodes.concat(container.meshes);
    nodes = nodes.concat(container.lights);
    nodes = nodes.concat(container.cameras);
    nodes = nodes.concat(container.transformNodes); // dummies
    container.skeletons.forEach((skeleton) => (nodes = nodes.concat(skeleton.bones)));
    return nodes;
}
