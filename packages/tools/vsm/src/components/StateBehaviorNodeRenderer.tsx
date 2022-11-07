import { useSelectedState } from "./tools/useSelectedState";
import { NodeRenderer } from "./NodeRenderer";
import { useSelectedAction } from "./tools/useSelectedAction";
import type { Nullable } from "core/types";

export interface IStateBehaviorNodeRendererProps {}

export const StateBehaviorNodeRenderer = (props: IStateBehaviorNodeRendererProps) => {
    const { selectedState } = useSelectedState();
    const { setSelectedAction } = useSelectedAction();

    if (selectedState) {
        const nodes = [
            { id: selectedState.name + "stateEnterAction", label: "Enter" },
            { id: selectedState.name + "stateExitAction", label: "Exit" },
        ];

        const connections = [];

        const stateEnterAction = selectedState.stateEnterAction;
        if (stateEnterAction) {
            nodes.push({ id: selectedState.name + "action", label: stateEnterAction.actionName() });
            connections.push({ id: selectedState.name + "enter", sourceId: selectedState.name + "stateEnterAction", targetId: selectedState.name + "action" });
            connections.push({ id: selectedState.name + "exit", sourceId: selectedState.name + "action", targetId: selectedState.name + "stateExitAction" });
        }

        const selectNode = (nodeId: Nullable<string>) => {
            console.log("call select node with", nodeId, "compare with ", selectedState.name + "action");
            if (nodeId === selectedState.name + "action") {
                setSelectedAction(stateEnterAction);
            } else {
                setSelectedAction(null);
            }
        };

        return (
            <NodeRenderer
                id="stateBehavior"
                nodes={nodes}
                connections={connections}
                updateConnections={() => {}}
                deleteLine={() => {}}
                deleteNode={() => {}}
                selectNode={selectNode}
            />
        );
    } else {
        return null;
    }
};
