import { useContext } from "react";
import { GraphContextManager } from "./GraphContextManager";

/**
 * utility hook to assist using the graph context
 * @returns
 */
export const useGraphContext = () => {
    const context = useContext(GraphContextManager);
    return context;
};
