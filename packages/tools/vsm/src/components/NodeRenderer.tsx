import { useState, useEffect, useMemo } from "react";
import { GraphContainer } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphLine } from "shared-ui-components/components/reactGraphSystem/GraphLine";
import { GraphNode } from "shared-ui-components/components/reactGraphSystem/GraphNode";
import { GraphNodesContainer } from "shared-ui-components/components/reactGraphSystem/GraphNodesContainer";
import { GraphLinesContainer } from "shared-ui-components/components/reactGraphSystem/GraphLinesContainer";
import { GraphContextManager } from "shared-ui-components/components/reactGraphSystem/GraphContextManager";
/**
 * Test component to use Reactive Nodes
 */

const fullscreenStyle = { width: "100%", height: "100%" };

// const posRecords: Record<string, { x: number; y: number }> = {};

// const initialConnections: { id: string; sourceId: string; targetId: string }[] = [];
export type IVisualRecordsType = Record<string, { x: number; y: number }>;
export type IConnectionType = { id: string; sourceId: string; targetId: string };

export interface INodeRendererProps {
    // visualRecords: IVisualRecordsType;
    connections: IConnectionType[];
    // updateVisualRecords: (id: string, x: number, y: number) => void;
    updateConnections: (sourceId: string, targetId: string) => void;
    deleteLine: (lineId: string) => void;
    deleteNode: (nodeId: string) => void;
    nodes: { id: string }[];
}

export const NodeRenderer = (props: INodeRendererProps) => {
    // const { visualRecords, connections, updateVisualRecords, updateConnections } = props;
    const { nodes, connections, updateConnections } = props;
    // Store the nodes positions
    const [pos, setPos] = useState<IVisualRecordsType>({});
    // const [conn, setConn] = useState(initialConnections);
    const [selectedLine, setSelectedLine] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    const updatePos = (id: string, x: number, y: number) => {
        console.log("called update pos with", id, "pos", x, y);
        // console.log("update pos of", id, "by", x, y);
        // const records = { ...visualRecords };
        // records[id] = { x: records[id].x + x, y: records[id].y + y };
        // return { ...currentPos };
        // updateVisualRecords(records);
        // updateVisualRecords(id, visualRecords[id].x + x, visualRecords[id].y + y);
        setPos((currentPos) => {
            const currPos = currentPos[id] || { x: 0, y: 0 };
            currentPos[id] = { x: currPos.x + x, y: currPos.y + y };
            return { ...currentPos };
        });
    };

    const onNodesConnected = (sourceId: string, targetId: string) => {
        console.log("onNodesConnected", sourceId, targetId);
        // setConn((currentConnections) => [...currentConnections, { id: `${sourceId}-${targetId}`, sourceId, targetId }]);
        updateConnections(sourceId, targetId);
    };

    const onLineSelected = (lineId: string) => {
        console.log("onLineSelected", lineId);
        setSelectedLine(lineId);
        setSelectedNode(null);
    };

    const onNodeSelected = (nodeId: string) => {
        console.log("onNodeSelected", nodeId);
        setSelectedNode(nodeId);
        setSelectedLine(null);
    };

    const onKeyDown = (evt: KeyboardEvent) => {
        console.log(evt);
        if (evt.key === "Delete") {
            if (selectedLine) {
                // const newConn = conn.filter((c) => c.id !== selectedLine);
                // setConn(newConn);
                // setSelectedLine(null);
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
    }, [selectedLine]);

    const graphContext = useMemo(() => ({ updatePos, onNodesConnected, onLineSelected, onNodeSelected }), []);

    return (
        <div style={fullscreenStyle}>
            <GraphContextManager.Provider value={graphContext}>
                <GraphContainer>
                    <GraphNodesContainer onNodeMoved={updatePos}>
                        {/* {Object.entries(visualRecords).map(([id, { x, y }]) => ( */}
                        {Object.entries(nodes).map(([id]) => {
                            const posInRecord = pos[id] || { x: 0, y: 0 };
                            return <GraphNode key={id} id={id} name={id} x={posInRecord.x} y={posInRecord.y} selected={id === selectedNode} />;
                        })}
                    </GraphNodesContainer>
                    <GraphLinesContainer>
                        {connections.map(({ id, sourceId, targetId }) => (
                            <GraphLine key={id} id={id} x1={pos[sourceId].x} y1={pos[sourceId].y} x2={pos[targetId].x} y2={pos[targetId].y} selected={id === selectedLine} />
                        ))}
                    </GraphLinesContainer>
                </GraphContainer>
            </GraphContextManager.Provider>
        </div>
    );
};
