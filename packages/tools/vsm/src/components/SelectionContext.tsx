import type { Nullable } from "core/types";
import { createContext } from "react";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";

export const SelectionContext = createContext<{ selectedNode: Nullable<GraphNode>; setSelectedNode: (selectedNode: Nullable<GraphNode>) => void }>({
    selectedNode: null,
    setSelectedNode: () => {},
});
