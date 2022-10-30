import type { Nullable } from "core/types";
import { createContext } from "react";
import type { StateMachine } from "./stateMachine/StateMachine";

export interface IStateMachineWrapper {
    stateMachine: StateMachine;
    lastUpdate: number;
}

export interface IStateMachineWrapperContext {
    stateMachineWrapper: Nullable<IStateMachineWrapper>;
    setStateMachineWrapper?: (stateMachine: Nullable<IStateMachineWrapper>) => void;
}

export const StateMachineContext = createContext<IStateMachineWrapperContext>({ stateMachineWrapper: null, setStateMachineWrapper: () => {} });
