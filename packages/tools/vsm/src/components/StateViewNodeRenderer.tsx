/**
 * This component converts a state machine states and transitions into nodes and connections for
 * the visual graph system.
 */

import { useMemo } from "react";
import { NodeRenderer } from "./NodeRenderer";
import { useStateMachine } from "./tools/useStateMachine";

export interface IStateViewNodeRendererProps {}

export const StateViewNodeRenderer = (props: IStateViewNodeRendererProps) => {
    // @ts-ignore
    const { stateMachine, lastUpdate, setStateMachine } = useStateMachine();
    console.log("lastUpdate", lastUpdate);

    const nodes = useMemo(() => {
        return (
            stateMachine?.getStates().map((state) => {
                return { id: state.id };
            }) || []
        );
    }, [lastUpdate]);

    const connections = useMemo(() => {
        return (
            stateMachine?.getTransitions().map((transition) => {
                const fromId = transition[0];
                const toId = transition[1].id;
                const connId = `${fromId}-${toId}`;
                return { id: connId, sourceId: fromId, targetId: toId };
            }) || []
        );
    }, [lastUpdate]);

    // const updateConnections = useMemo(
    //     () => (sourceId: string, targetId: string) => {
    const updateConnections = (sourceId: string, targetId: string) => {
        // const { stateMachine, setStateMachine } = useStateMachine();
        //WHY THIS IS NULL!!!!!!!!!!!?????????????
        const sourceState = stateMachine?.getStateById(sourceId);
        const destState = stateMachine?.getStateById(targetId);
        if (stateMachine && sourceState && destState) {
            stateMachine.addTransition(sourceState, destState);
            setStateMachine(stateMachine);
        }
    };
    //     [lastUpdate]
    // );

    const deleteLine = (lineId: string) => {
        const [sourceId, targetId] = lineId.split("-");
        const sourceState = stateMachine?.getStateById(sourceId);
        const destState = stateMachine?.getStateById(targetId);
        if (stateMachine && sourceState && destState) {
            stateMachine.removeTransition(sourceState, destState);
        }
    };

    const deleteNode = (nodeId: string) => {
        const node = stateMachine?.getStateById(nodeId);
        if (stateMachine && node) {
            stateMachine.removeState(node);
        }
    };

    return <NodeRenderer connections={connections} updateConnections={updateConnections} deleteLine={deleteLine} deleteNode={deleteNode} nodes={nodes} />;
};
