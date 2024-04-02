import type { ComponentType } from "react";
import { useState, useEffect, useMemo } from "react";
import { GraphContainer } from "./GraphContainer";
import { GraphLine } from "./GraphLine";
import { GraphNode } from "./GraphNode";
import { GraphNodesContainer } from "./GraphNodesContainer";
import { GraphLinesContainer } from "./GraphLinesContainer";
import { GraphContextManager } from "./GraphContextManager";
import type { Nullable } from "core/types";

const fullscreenStyle = { width: "100%", height: "100%" };

export type IVisualRecordsType = Record<string, { x: number; y: number }>;
export type IConnectionType = { id: string; sourceId: string; targetId: string };
export type ICustomDataType = { type: string; value: any };
export type INodeType = { id: string; label: string; customData?: ICustomDataType };

/**
 * props for the node renderer
 */
export interface INodeRendererProps {
    /**
     * array of connections between nodes
     */
    connections: IConnectionType[];
    /**
     * function called when a new connection is created
     */
    updateConnections: (sourceId: string, targetId: string) => void;
    /**
     * function called when a connection is deleted
     */
    deleteLine: (lineId: string) => void;
    /**
     * function called when a node is deleted
     */
    deleteNode: (nodeId: string) => void;
    /**
     * array of all nodes
     */
    nodes: INodeType[];
    /**
     * id of the node to highlight
     */
    highlightedNode?: Nullable<string>;
    /**
     * function to be called if a node is selected
     */
    selectNode?: (nodeId: Nullable<string>) => void;
    /**
     * id of this renderer
     */
    id: string;
    /**
     * optional list of custom components to be rendered inside nodes of
     * a certain type
     */
    customComponents?: Record<string, ComponentType<any>>;
}

/**
 * This component is a bridge between the app logic related to the graph, and the actual rendering
 * of it. It manages the nodes' positions and selection states.
 * @param props
 * @returns
 */
export const NodeRenderer = (props: INodeRendererProps) => {
    const { nodes, connections, updateConnections, highlightedNode } = props;
    // Store the nodes positions
    const [pos, setPos] = useState<IVisualRecordsType>({});
    const [selectedLine, setSelectedLine] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    const updatePos = (id: string, x: number, y: number) => {
        setPos((currentPos) => {
            const currPos = currentPos[id] || { x: 0, y: 0 };
            currentPos[id] = { x: currPos.x + x, y: currPos.y + y };
            return { ...currentPos };
        });
    };

    const onNodesConnected = (sourceId: string, targetId: string) => {
        updateConnections(sourceId, targetId);
    };

    const onLineSelected = (lineId: string) => {
        setSelectedLine(lineId);
        setSelectedNode(null);
    };

    const onNodeSelected = (nodeId: string) => {
        setSelectedNode(nodeId);
        setSelectedLine(null);
    };

    useEffect(() => {
        props.selectNode && props.selectNode(selectedNode);
    }, [selectedNode]);

    const onKeyDown = (evt: KeyboardEvent) => {
        if (evt.key === "Delete") {
            if (selectedLine) {
                props.deleteLine(selectedLine);
            } else if (selectedNode) {
                props.deleteNode(selectedNode);
            }
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [selectedLine, selectedNode]);

    const graphContext = useMemo(() => ({ updatePos, onNodesConnected, onLineSelected, onNodeSelected }), []);
    return (
        <div style={fullscreenStyle}>
            <GraphContextManager.Provider value={graphContext}>
                <GraphContainer>
                    <GraphNodesContainer id={props.id} onNodeMoved={updatePos}>
                        {nodes.map(({ id, label, customData }) => {
                            const posInRecord = pos[id] || { x: 0, y: 0 };
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            const CustomComponent = customData && customData.type && props.customComponents && props.customComponents[customData.type];
                            return (
                                <GraphNode
                                    parentContainerId={props.id}
                                    key={id}
                                    id={id}
                                    name={label}
                                    x={posInRecord.x}
                                    y={posInRecord.y}
                                    selected={id === selectedNode}
                                    highlighted={id === highlightedNode}
                                >
                                    {CustomComponent && <CustomComponent {...customData.value} />}
                                </GraphNode>
                            );
                        })}
                    </GraphNodesContainer>
                    <GraphLinesContainer id={props.id}>
                        {connections.map(({ id, sourceId, targetId }) => {
                            const sourcePos = pos[sourceId] || { x: 0, y: 0 };
                            const targetPos = pos[targetId] || { x: 0, y: 0 };
                            return <GraphLine key={id} id={id} x1={sourcePos.x} y1={sourcePos.y} x2={targetPos.x} y2={targetPos.y} selected={id === selectedLine} />;
                        })}
                    </GraphLinesContainer>
                </GraphContainer>
            </GraphContextManager.Provider>
        </div>
    );
};
