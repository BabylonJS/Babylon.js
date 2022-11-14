import type { Nullable } from "core/types";
import { createContext } from "react";
import type { State } from "../stateMachine/State";

export const StateSelectionContext = createContext<{ selectedState: Nullable<State>; setSelectedState: (selectedState: Nullable<State>) => void }>({
    selectedState: null,
    setSelectedState: () => {},
});
