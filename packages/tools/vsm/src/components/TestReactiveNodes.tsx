import { useState } from "react";
import { GraphContainer } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphNode } from "shared-ui-components/components/reactGraphSystem/GraphNode";
/**
 * Test component to use Reactive Nodes
 */
const initialPos: Record<string, { x: number; y: number }> = {
    Test: { x: 100, y: 200 },
    Test2: { x: 400, y: 200 },
};
export const TestReactiveNodes = () => {
    const [pos, setPos] = useState(initialPos);

    const updatePos = (id: string, x: number, y: number) => {
        console.log("update pos of", id, "by", x, y);
        pos[id] = { x: pos[id].x + x, y: pos[id].y + y };
        setPos({ ...pos });
    };
    return (
        <GraphContainer onNodeMoved={updatePos}>
            <GraphNode id="Test" name="Test" x={pos["Test"].x} y={pos["Test"].y} />
            <GraphNode id="Test2" name="Test2" x={pos["Test2"].x} y={pos["Test2"].y} />
        </GraphContainer>
    );
};
