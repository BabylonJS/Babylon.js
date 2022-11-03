import { createContext } from "react";
import type { Nullable } from "core/types";
import type { BaseAction } from "../actions/actions/BaseAction";

export const ActionSelectionContext = createContext<{ selectedAction: Nullable<BaseAction>; setSelectedAction: (action: Nullable<BaseAction>) => void }>({
    selectedAction: null,
    setSelectedAction: (action: Nullable<BaseAction>) => {},
});
