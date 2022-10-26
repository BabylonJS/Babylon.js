import type { IGraphContainerProps } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphContainer } from "shared-ui-components/components/reactGraphSystem/GraphContainer";
import { GraphNode } from "shared-ui-components/components/reactGraphSystem/GraphNode";

export default { component: GraphContainer };

export const Default = {
    render: (props: IGraphContainerProps) => {
        return (
            <div>
                <GraphContainer>
                    <GraphNode name={"Test"} x={100} y={200} />
                </GraphContainer>
            </div>
        );
    },
};
