/**
 * This component converts a state machine states and transitions into nodes and connections for
 * the visual graph system.
 */

import { useEffect, useState } from "react";
import type { IVisualRecordsType } from "./NodeRenderer";
import { NodeRenderer } from "./NodeRenderer";
import { useStateMachine } from "./tools/useStateMachine";

export interface IStateViewNodeRendererProps {}

export const StateViewNodeRenderer = (props: IStateViewNodeRendererProps) => {
    const { stateMachine, lastUpdate } = useStateMachine();
    const [nodesVisualProperties, setNodesVisualProperties] = useState<IVisualRecordsType>({});

    useEffect(() => {
        const states = stateMachine?.getStates();
        console.log("state machine changed at", lastUpdate, "states", states);

        if (states) {
            let propertiesUpdated = false;
            for (const state of states) {
                const id = state.id;
                // If the node doesn't have a recorded position yet, record it
                if (!nodesVisualProperties[id]) {
                    nodesVisualProperties[id] = { x: 100, y: 100 };
                    propertiesUpdated = true;
                }
            }
            if (propertiesUpdated) {
                setNodesVisualProperties({ ...nodesVisualProperties });
            }
        }
    }, [stateMachine, lastUpdate]);

    const connections =
        stateMachine?.getTransitions().map((transition) => {
            const fromId = transition[0];
            const toId = transition[1].id;
            const connId = `${fromId}-${toId}`;
            return { id: connId, sourceId: fromId, targetId: toId };
        }) || [];

    const updateVisualRecords = (id: string, x: number, y: number) => {
        // console.log("call update visual records with records", records);
        // setNodesVisualProperties({ ...records });
        setNodesVisualProperties((currentRecords) => {
            currentRecords[id] = { x, y };
            return { ...currentRecords };
        });
    };

    const updateConnections = (sourceId: string, targetId: string) => {
        const sourceState = stateMachine?.getStateById(sourceId);
        const destState = stateMachine?.getStateById(targetId);
        if (stateMachine && sourceState && destState) {
            stateMachine.addTransition(sourceState, destState);
        }
    };

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

    return (
        <NodeRenderer
            visualRecords={nodesVisualProperties}
            connections={connections}
            updateConnections={updateConnections}
            updateVisualRecords={updateVisualRecords}
            deleteLine={deleteLine}
            deleteNode={deleteNode}
        />
    );
};
