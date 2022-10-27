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

const initialPos: Record<string, { x: number; y: number }> = {
    Test: { x: 100, y: 200 },
    Test2: { x: 400, y: 100 },
    Test3: { x: 400, y: 200 },
    Test4: { x: 100, y: 100 },
};

const initialConnections: { id: string; sourceId: string; targetId: string }[] = [];

export const TestReactiveNodes = () => {
    const [pos, setPos] = useState(initialPos);
    const [conn, setConn] = useState(initialConnections);
    const [selectedLine, setSelectedLine] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    const updatePos = (id: string, x: number, y: number) => {
        // console.log("update pos of", id, "by", x, y);
        setPos((currentPos) => {
            currentPos[id] = { x: currentPos[id].x + x, y: currentPos[id].y + y };
            return { ...currentPos };
        });
    };

    const onNodesConnected = (sourceId: string, targetId: string) => {
        console.log("onNodesConnected", sourceId, targetId);
        setConn((currentConnections) => [...currentConnections, { id: `${sourceId}-${targetId}`, sourceId, targetId }]);
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
                const newConn = conn.filter((c) => c.id !== selectedLine);
                setConn(newConn);
                setSelectedLine(null);
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
                        {Object.entries(pos).map(([id, { x, y }]) => (
                            <GraphNode key={id} id={id} name={id} x={x} y={y} selected={id === selectedNode} />
                        ))}
                    </GraphNodesContainer>
                    <GraphLinesContainer>
                        {conn.map(({ id, sourceId, targetId }) => (
                            <GraphLine key={id} id={id} x1={pos[sourceId].x} y1={pos[sourceId].y} x2={pos[targetId].x} y2={pos[targetId].y} selected={id === selectedLine} />
                        ))}
                    </GraphLinesContainer>
                </GraphContainer>
            </GraphContextManager.Provider>
        </div>
    );
};
