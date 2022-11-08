import { createContext } from "react";
import type { Nullable } from "core/types";
import type { BaseAction } from "../actions/actions/BaseAction";

export interface IActionSelectionContextWrapper {
    action: Nullable<BaseAction>;
    lastUpdate: number;
}

export const ActionSelectionContext = createContext<{
    selectedActionWrapper: IActionSelectionContextWrapper;
    setSelectedActionWrapper: (action: IActionSelectionContextWrapper) => void;
}>({
    selectedActionWrapper: { action: null, lastUpdate: 0 },
    setSelectedActionWrapper: (action: IActionSelectionContextWrapper) => {},
});
