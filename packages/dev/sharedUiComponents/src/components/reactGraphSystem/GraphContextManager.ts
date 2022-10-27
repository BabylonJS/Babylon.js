import { createContext } from "react";

export interface IGraphContext {
    onNodesConnected?: (sourceId: string, targetId: string) => void;
    onLineSelected?: (lineId: string) => void;
    onNodeSelected?: (nodeId: string) => void;
}

export const GraphContextManager = createContext<IGraphContext>({});
