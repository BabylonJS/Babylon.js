/**
 * This component converts a state machine states and transitions into nodes and connections for
 * the visual graph system.
 */

import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { useEffect, useMemo, useState } from "react";
import type { State } from "../stateMachine/State";
import { NodeRenderer } from "../../../../dev/sharedUiComponents/src/components/reactGraphSystem/NodeRenderer";
import { useSelectedAction } from "./tools/useSelectedAction";
import { useSelectedState } from "./tools/useSelectedState";
import { useStateMachine } from "./tools/useStateMachine";

export interface IStateViewNodeRendererProps {}

/**
 * This component offers a view of the State Machine states and allows
 * creating transitions between them
 * @param props
 * @returns
 */
export const StateViewNodeRenderer = (props: IStateViewNodeRendererProps) => {
    const { stateMachine, lastUpdate, setStateMachine } = useStateMachine();
    const { selectedState, setSelectedState } = useSelectedState();
    const { setSelectedAction } = useSelectedAction();
    const [enteredState, setEnteredState] = useState<Nullable<string>>(null);

    const nodes = useMemo(() => {
        return (
            stateMachine?.getStates().map((state) => {
                return { id: state.id, label: state.name };
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

    useEffect(() => {
        if (stateMachine) {
            const stateEnterObservers: [State, Nullable<Observer<State>>][] = stateMachine.getStates().map((state) => {
                return [
                    state,
                    state.onStateEnteredObservable.add(() => {
                        setEnteredState(state.id);
                    }),
                ];
            });
            return () => {
                stateEnterObservers.forEach(([state, observer]) => {
                    state.onStateEnteredObservable.remove(observer);
                });
            };
        }
        return () => {};
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
                highlightedNode={enteredState}
            />
        );
    } else {
        return null;
    }
};
