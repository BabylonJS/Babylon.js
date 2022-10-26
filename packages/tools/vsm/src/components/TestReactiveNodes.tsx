import { GraphContainer } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphNode } from "shared-ui-components/components/reactGraphSystem/GraphNode";
/**
 * Test component to use Reactive Nodes
 */

export const TestReactiveNodes = () => {
    return (
        <GraphContainer>
            <GraphNode name="Test" x={100} y={200} />
        </GraphContainer>
    );
};
