import { useContext } from "react";
import { ActionSelectionContext } from "../ActionSelectionContext";

export const useSelectedAction = () => {
    const { selectedAction, setSelectedAction } = useContext(ActionSelectionContext);
    return { selectedAction, setSelectedAction };
};
