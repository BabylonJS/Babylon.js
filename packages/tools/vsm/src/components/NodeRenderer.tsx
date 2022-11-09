import type { ComponentType } from "react";
import { useState, useEffect, useMemo } from "react";
import { GraphContainer } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphLine } from "shared-ui-components/components/reactGraphSystem/GraphLine";
import { GraphNode } from "shared-ui-components/components/reactGraphSystem/GraphNode";
import { GraphNodesContainer } from "shared-ui-components/components/reactGraphSystem/GraphNodesContainer";
import { GraphLinesContainer } from "shared-ui-components/components/reactGraphSystem/GraphLinesContainer";
import { GraphContextManager } from "shared-ui-components/components/reactGraphSystem/GraphContextManager";
import type { Nullable } from "core/types";
/**
 * Test component to use Reactive Nodes
 */

const fullscreenStyle = { width: "100%", height: "100%" };

export type IVisualRecordsType = Record<string, { x: number; y: number }>;
export type IConnectionType = { id: string; sourceId: string; targetId: string };
export type ICustomDataType = { type: string; value: any };
export type INodeType = { id: string; label: string; customData?: ICustomDataType };

export interface INodeRendererProps {
    connections: IConnectionType[];
    updateConnections: (sourceId: string, targetId: string) => void;
    deleteLine: (lineId: string) => void;
    deleteNode: (nodeId: string) => void;
    nodes: INodeType[];
    highlightedNode?: string; // id of the node to highlight
    selectNode?: (nodeId: Nullable<string>) => void; // function to be called if a node is selected
    id: string; // renderer id
    customComponents?: Record<string, ComponentType<any>>;
}

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
        // console.log("onNodesConnected", sourceId, targetId);
        updateConnections(sourceId, targetId);
    };

    const onLineSelected = (lineId: string) => {
        // console.log("onLineSelected", lineId);
        setSelectedLine(lineId);
        setSelectedNode(null);
    };

    const onNodeSelected = (nodeId: string) => {
        // console.log("onNodeSelected", nodeId);
        setSelectedNode(nodeId);
        setSelectedLine(null);
    };

    useEffect(() => {
        props.selectNode && props.selectNode(selectedNode);
    }, [selectedNode]);

    const onKeyDown = (evt: KeyboardEvent) => {
        // console.log("on key down", evt, "selectedLine", selectedLine, "selectedNode", selectedNode);
        if (evt.key === "Delete") {
            if (selectedLine) {
                console.log("call deleteline", selectedLine);
                props.deleteLine(selectedLine);
            } else if (selectedNode) {
                console.log("call delete node", selectedNode);
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
    // console.log("nodes", nodes);
    // console.log("connections", connections);
    return (
        <div style={fullscreenStyle}>
            <GraphContextManager.Provider value={graphContext}>
                <GraphContainer>
                    <GraphNodesContainer id={props.id} onNodeMoved={updatePos}>
                        {nodes.map(({ id, label, customData }) => {
                            const posInRecord = pos[id] || { x: 0, y: 0 };
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
