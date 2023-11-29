import type { GlobalState } from "../globalState";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { SerializationTools } from "../serializationTools";

export const RegisterExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data, frame) => {
        const nodeGeometry = (data as GlobalState).nodeGeometry;
        return SerializationTools.Serialize(nodeGeometry, stateManager.data as GlobalState, frame);
    };

    stateManager.getEditorDataMap = () => {
        return (stateManager.data as GlobalState).nodeGeometry.editorData.map;
    };
};
