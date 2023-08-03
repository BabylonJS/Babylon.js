import type { GraphCanvasComponent } from "./graphCanvas";
import type { GraphNode } from "./graphNode";
import type { NodeLink } from "./nodeLink";
import type { FramePortData } from "./types/framePortData";

export const IsFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData).port !== undefined;
    } else {
        return false;
    }
};

export const RefreshNode = (node: GraphNode, visitedNodes?: Set<GraphNode>, visitedLinks?: Set<NodeLink>, canvas?: GraphCanvasComponent) => {
    node.refresh();

    const links = node.links;

    if (visitedNodes) {
        // refresh first the nodes so that the right types are assigned to the auto-detect ports
        links.forEach((link) => {
            const nodeA = link.nodeA,
                nodeB = link.nodeB;

            if (!visitedNodes.has(nodeA)) {
                visitedNodes.add(nodeA);
                RefreshNode(nodeA, visitedNodes, visitedLinks);
            }

            if (nodeB && !visitedNodes.has(nodeB)) {
                visitedNodes.add(nodeB);
                RefreshNode(nodeB, visitedNodes, visitedLinks);
            }
        });
    }

    // Invisible endpoints (for teleport nodes)
    const invisibleEndpoints = node.content.invisibleEndpoints;
    if (invisibleEndpoints && invisibleEndpoints.length) {
        for (const endpoint of invisibleEndpoints) {
            const graphNode = canvas?.findNodeFromData(endpoint);
            if (graphNode) {
                if (visitedNodes) {
                    visitedNodes.add(graphNode);
                }
                RefreshNode(graphNode, visitedNodes, visitedLinks);
            }
        }
    }

    if (!visitedLinks) {
        return;
    }

    // then refresh the links to display the right color between ports
    links.forEach((link) => {
        if (!visitedLinks.has(link)) {
            visitedLinks.add(link);
            link.update();
        }
    });
};
