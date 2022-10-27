import { useContext } from "react";
import { GraphContextManager } from "./GraphContextManager";

export const useGraphContext = () => {
    const context = useContext(GraphContextManager);
    return context;
};
