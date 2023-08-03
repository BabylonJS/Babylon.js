import { NodeMaterialTeleportInBlock } from "core/Materials/Node/Blocks/Teleport/teleportInBlock";
import type { GraphNode } from "./graphNode";
import type { NodeLink } from "./nodeLink";
import type { FramePortData } from "./types/framePortData";
import { GraphCanvasComponent } from "./graphCanvas";

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
        // if it's a teleport in block, we have to refresh the corresponding teleport out block
        if (node.content.data.getClassName() === "NodeMaterialTeleportInBlock") {
            for (const endpoint of (node.content.data as NodeMaterialTeleportInBlock).endpoints) {
                const graphNode = canvas?.findNodeFromData(endpoint);
                if (graphNode) {
                    visitedNodes.add(graphNode);
                    RefreshNode(graphNode, visitedNodes, visitedLinks);
                }
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
