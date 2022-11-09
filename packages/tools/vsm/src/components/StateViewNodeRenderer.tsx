/**
 * This component converts a state machine states and transitions into nodes and connections for
 * the visual graph system.
 */

import type { Nullable } from "core/types";
import { useMemo } from "react";
import { NodeRenderer } from "./NodeRenderer";
import { useSelectedAction } from "./tools/useSelectedAction";
import { useSelectedState } from "./tools/useSelectedState";
import { useStateMachine } from "./tools/useStateMachine";

export interface IStateViewNodeRendererProps {}

export const StateViewNodeRenderer = (props: IStateViewNodeRendererProps) => {
    const { stateMachine, lastUpdate, setStateMachine } = useStateMachine();
    const { selectedState, setSelectedState } = useSelectedState();
    const { setSelectedAction } = useSelectedAction();
    // console.log("lastUpdate", lastUpdate);

    const nodes = useMemo(() => {
        return (
            stateMachine?.getStates().map((state) => {
                return { id: state.id, label: state.name };
            }) || []
        );
    }, [lastUpdate]);

    const connections = useMemo(() => {
        // console.log("all transitions", stateMachine?.getTransitions());
        return (
            stateMachine?.getTransitions().map((transition) => {
                // console.log("transition", transition);
                const fromId = transition[0];
                const toId = transition[1].id;
                const connId = `${fromId}-${toId}`;
                return { id: connId, sourceId: fromId, targetId: toId };
            }) || []
        );
    }, [lastUpdate]);

    const updateConnections = (sourceId: string, targetId: string) => {
        const sourceState = stateMachine!.getStateById(sourceId);
        const destState = stateMachine!.getStateById(targetId);
        if (stateMachine && sourceState && destState) {
            stateMachine.addTransition(sourceState, destState);
            setStateMachine(stateMachine);
        }
    };

    const deleteLine = (lineId: string) => {
        const [sourceId, targetId] = lineId.split("-");
        const sourceState = stateMachine?.getStateById(sourceId);
        const destState = stateMachine?.getStateById(targetId);
        if (stateMachine && sourceState && destState) {
            stateMachine.removeTransition(sourceState, destState);
            setStateMachine(stateMachine);
        }
    };

    const deleteNode = (nodeId: string) => {
        const node = stateMachine?.getStateById(nodeId);
        if (stateMachine && node) {
            stateMachine.removeState(node);
            setStateMachine(stateMachine);
        }
    };

    const selectNode = (nodeId: Nullable<string>) => {
        if (nodeId === null) {
            setSelectedState(null);
        } else if (nodeId !== selectedState?.id) {
            const node = stateMachine?.getStateById(nodeId);
            if (node) {
                setSelectedState(node);
                setSelectedAction(null);
            }
        }
    };

    if (stateMachine) {
        return (
            <NodeRenderer
                id="stateView"
                connections={connections}
                updateConnections={updateConnections}
                deleteLine={deleteLine}
                deleteNode={deleteNode}
                nodes={nodes}
                selectNode={selectNode}
            />
        );
    } else {
        return null;
    }
};
