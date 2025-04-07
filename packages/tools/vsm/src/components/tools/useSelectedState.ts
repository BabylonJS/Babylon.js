import { useContext } from "react";
import { StateSelectionContext } from "../../context/StateSelectionContext";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const useSelectedState = () => {
    const { selectedState, setSelectedState } = useContext(StateSelectionContext);
    return { selectedState, setSelectedState };
};
