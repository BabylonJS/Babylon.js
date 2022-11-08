import { useContext } from "react";
import { StateSelectionContext } from "../../context/StateSelectionContext";

export const useSelectedState = () => {
    const { selectedState, setSelectedState } = useContext(StateSelectionContext);
    return { selectedState, setSelectedState };
};
