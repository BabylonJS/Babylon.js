import { useContext } from "react";
import { GraphContextManager } from "./GraphContextManager";

/**
 * utility hook to assist using the graph context
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const useGraphContext = () => {
    const context = useContext(GraphContextManager);
    return context;
};
