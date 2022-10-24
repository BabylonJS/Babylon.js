import type { Nullable } from "core/types";
import { createContext } from "react";
import type { StateMachine } from "./stateMachine/StateMachine";

export interface IStateMachineContext {
    stateMachine: Nullable<StateMachine>;
    setStateMachine?: (stateMachine: Nullable<StateMachine>) => void;
}

export const StateMachineContext = createContext<IStateMachineContext>({ stateMachine: null, setStateMachine: () => {} });
