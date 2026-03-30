import { type GlobalState } from "../globalState";
import { type StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { SerializationTools } from "../serializationTools";

export const RegisterExportData = (stateManager: StateManager) => {
    stateManager.exportData = (data, frame) => {
        const flowGraph = (data as GlobalState).flowGraph;
        return SerializationTools.Serialize(flowGraph, stateManager.data as GlobalState, frame);
    };

    stateManager.getEditorDataMap = () => {
        return ((stateManager.data as GlobalState).flowGraph as any)._editorData?.map ?? new Map();
    };
};
