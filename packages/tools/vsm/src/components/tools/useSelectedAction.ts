import type { Nullable } from "core/types";
import { useContext } from "react";
import type { BaseAction } from "../../actions/actions/BaseAction";
import { ActionSelectionContext } from "../../context/ActionSelectionContext";

export const useSelectedAction = () => {
    const { selectedActionWrapper, setSelectedActionWrapper } = useContext(ActionSelectionContext);
    const { action, lastUpdate } = selectedActionWrapper;
    const setSelectedAction = (newAction: Nullable<BaseAction>) => {
        setSelectedActionWrapper({ action: newAction, lastUpdate: Date.now() });
    };
    return { selectedAction: action, lastUpdate, setSelectedAction };
};
