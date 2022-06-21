import { GlobalState } from "../globalState";
import { SerializationTools } from "node-editor/serializationTools";
import { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";

export const registerExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data) => {
        const nodeMaterial = (data as GlobalState).nodeMaterial;
        return SerializationTools.Serialize(nodeMaterial, stateManager.data as GlobalState, this);
    }
}