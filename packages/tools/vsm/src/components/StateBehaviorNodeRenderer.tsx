import { useSelectedState } from "./tools/useSelectedState";
import type { INodeType } from "../../../../dev/sharedUiComponents/src/components/reactGraphSystem/NodeRenderer";
import { NodeRenderer } from "../../../../dev/sharedUiComponents/src/components/reactGraphSystem/NodeRenderer";
import { useSelectedAction } from "./tools/useSelectedAction";
import type { Nullable } from "core/types";
import type { SetPositionAction } from "../actions/actions/SetPositionAction";
import { SetPositionBlock } from "./nodesDisplay/SetPositionBlock";

export interface IStateBehaviorNodeRendererProps {}

/**
 * This component displays the Actions of the currently selected state.
 * @param props properties
 * @returns Node renderer element
 */
export const StateBehaviorNodeRenderer = (props: IStateBehaviorNodeRendererProps) => {
    const { selectedState } = useSelectedState();
    const { setSelectedAction } = useSelectedAction();

    if (selectedState) {
        const nodes: INodeType[] = [
            { id: selectedState.name + "stateEnterAction", label: "Enter" },
            { id: selectedState.name + "stateExitAction", label: "Exit" },
        ];

        const connections = [];

        const stateEnterAction = selectedState.stateEnterAction;
        if (stateEnterAction) {
            nodes.push({
                id: selectedState.name + "action",
                label: stateEnterAction.actionName(),
                customData: { type: "SetPosition", value: { targetPosition: (stateEnterAction as SetPositionAction).targetPosition } },
            });
            connections.push({ id: selectedState.name + "enter", sourceId: selectedState.name + "stateEnterAction", targetId: selectedState.name + "action" });
            connections.push({ id: selectedState.name + "exit", sourceId: selectedState.name + "action", targetId: selectedState.name + "stateExitAction" });
        }

        const selectNode = (nodeId: Nullable<string>) => {
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
                // eslint-disable-next-line @typescript-eslint/naming-convention
                customComponents={{ SetPosition: SetPositionBlock }}
            />
        );
    } else {
        return null;
    }
};
