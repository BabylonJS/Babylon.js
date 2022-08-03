import type { GlobalState } from "../globalState";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { SerializationTools } from "../serializationTools";

export const RegisterExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data, frame) => {
        const nodeMaterial = (data as GlobalState).nodeMaterial;
        return SerializationTools.Serialize(nodeMaterial, stateManager.data as GlobalState, frame);
    };

    stateManager.getEditorDataMap = () => {
        return (stateManager.data as GlobalState).nodeMaterial.editorData.map;
    };
};
