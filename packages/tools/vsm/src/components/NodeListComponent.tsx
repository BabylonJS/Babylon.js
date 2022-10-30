import { Vector3 } from "core/Maths/math";
import type { FC } from "react";
import { useState } from "react";
import { SetPositionAction } from "../actions/actions/SetPositionAction";
import { State } from "../stateMachine/State";
import style from "./NodeListComponent.modules.scss";
import { useSceneNode } from "./tools/useSceneNode";
import { useStateMachine } from "./tools/useStateMachine";

/**
 * This component display a list of all the possible nodes that can be added.
 */
export interface INodeListComponentProps {}

export const NodeListComponent: FC<INodeListComponentProps> = (props) => {
    const { stateMachine, setStateMachine } = useStateMachine();
    const [stateName, setStateName] = useState("New State");
    const node = useSceneNode("sphere");

    const onAddNewState = () => {
        if (stateMachine && node) {
            const state = new State(stateName);

            const stateAction = new SetPositionAction();
            stateAction.targetNode = node;
            stateAction.targetPosition = new Vector3(0, 0, 0);
            state.setOnStateEnterAction(stateAction);

            stateMachine.addState(state);
            if (stateMachine.getStates().length === 1) {
                stateMachine.setStartingState(state);
            }

            setStateMachine(stateMachine);
        }
    };

    return (
        <div>
            <div className={style.nodeContainer}>
                <div style={{ flexGrow: 1 }}>
                    <div>Add New State</div>
                    <input value={stateName} onChange={(evt) => setStateName(evt.target.value)}></input>
                </div>
                <button className={style.nodeAddButton} onClick={onAddNewState}>
                    Add
                </button>
            </div>
        </div>
    );
};
