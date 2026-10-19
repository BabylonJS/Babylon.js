import { DataStorage } from "core/Misc/dataStorage";
import { HistoryStack } from "shared-ui-components/historyStack";

import { type GlobalState } from "./globalState";
import { SerializationTools } from "./serializationTools";
import { ReconcileNodeGeometryWebMcpHistory } from "./webMcp";

export function CreateNodeGeometryHistoryStack(globalState: GlobalState): HistoryStack {
    const geometry = globalState.nodeGeometry;
    const dataProvider = () => {
        SerializationTools.UpdateLocations(geometry, globalState);
        return geometry.serialize();
    };
    const applyUpdate = (data: any) => {
        globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
        geometry.parseSerializedObject(data);
        ReconcileNodeGeometryWebMcpHistory(globalState);
        globalState.onResetRequiredObservable.notifyObservers(false);
    };
    const historyStack = new HistoryStack(dataProvider, applyUpdate);
    historyStack.isEnabled = DataStorage.ReadBoolean("UndoRedo", true);
    globalState.stateManager.historyStack = historyStack;

    globalState.stateManager.onUpdateRequiredObservable.add(() => {
        void historyStack.storeAsync();
    });
    globalState.stateManager.onRebuildRequiredObservable.add(() => {
        void historyStack.storeAsync();
    });
    globalState.stateManager.onNodeMovedObservable.add(() => {
        void historyStack.storeAsync();
    });
    globalState.stateManager.onNewNodeCreatedObservable.add(() => {
        void historyStack.storeAsync();
    });
    globalState.onClearUndoStack.add(() => {
        historyStack.reset();
    });

    return historyStack;
}
