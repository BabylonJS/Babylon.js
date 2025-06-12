import type { GlobalState } from "../globalState";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { SerializationTools } from "../serializationTools";

export const RegisterExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data, frame) => {
        const nodeParticleSet = (data as GlobalState).nodeParticleSet;
        return SerializationTools.Serialize(nodeParticleSet, stateManager.data as GlobalState, frame);
    };

    stateManager.getEditorDataMap = () => {
        return (stateManager.data as GlobalState).nodeParticleSet.editorData.map;
    };
};
