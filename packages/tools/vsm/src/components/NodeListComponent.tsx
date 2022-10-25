import type { FC } from "react";
import { useContext } from "react";
import { State } from "../stateMachine/State";
import { StateMachineContext } from "../StateMachineContext";
import style from "./NodeListComponent.modules.scss";

/**
 * This component display a list of all the possible nodes that can be added.
 */
export interface INodeListComponentProps {}

export const NodeListComponent: FC<INodeListComponentProps> = (props) => {
    const { stateMachineWrapper, setStateMachineWrapper } = useContext(StateMachineContext);

    const onAddNewState = () => {
        if (stateMachineWrapper && setStateMachineWrapper) {
            const state = new State("New State");
            const stateMachine = stateMachineWrapper.stateMachine;
            stateMachine.addState(state);
            setStateMachineWrapper({ stateMachine, lastUpdate: Date.now() });
        }
    };

    return (
        <div>
            <div className={style.nodeContainer}>
                <div>New State</div>
                <button className={style.nodeAddButton} onClick={onAddNewState}>
                    Add
                </button>
            </div>
        </div>
    );
};
