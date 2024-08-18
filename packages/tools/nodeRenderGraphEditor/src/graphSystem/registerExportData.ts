import type { GlobalState } from "../globalState";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { SerializationTools } from "../serializationTools";

export const RegisterExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data, frame) => {
        const nodeRenderGraph = (data as GlobalState).nodeRenderGraph;
        return SerializationTools.Serialize(nodeRenderGraph, stateManager.data as GlobalState, frame);
    };

    stateManager.getEditorDataMap = () => {
        return (stateManager.data as GlobalState).nodeRenderGraph.editorData.map;
    };
};
