
import * as dagre from "dagre";
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';

export class GraphHelper {
    public static DistributeGraph(model: DiagramModel) {
        let nodes = this._MapElements(model);
        let edges = this._MapEdges(model);
        let graph = new dagre.graphlib.Graph();
        graph.setGraph({});
        graph.setDefaultEdgeLabel(() => ({}));
        graph.graph().rankdir = "LR";
        //add elements to dagre graph
        nodes.forEach(node => {
            graph.setNode(node.id, node.metadata);
        });
        edges.forEach(edge => {
            if (edge.from && edge.to) {
                graph.setEdge(edge.from.id, edge.to.id);
            }
        });
        //auto-distribute
        dagre.layout(graph);
        return graph.nodes().map(node => graph.node(node));
    }

    private static _MapElements(model: DiagramModel) {
        let output = [];

        // dagre compatible format
        for (var nodeName in model.nodes) {
            let node = model.nodes[nodeName];
            let size = {
                width: node.width | 200,
                height: node.height | 100
            };
            output.push({ id: node.id, metadata: { ...size, id: node.id } });
        }

        return output;
    }

    private static _MapEdges(model: DiagramModel) {
        // returns links which connects nodes
        // we check are there both from and to nodes in the model. Sometimes links can be detached
        let output = [];

        for (var linkName in model.links) {
            let link = model.links[linkName];

            output.push({
                from: link.sourcePort!.parent,
                to: link.targetPort!.parent
            });
        }

        return output;
    }
}