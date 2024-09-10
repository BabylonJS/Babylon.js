import type { Nullable } from "core/types";
import type { GlobalState } from "./globalState";
import type { Observer } from "core/Misc/observable";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IDisposable } from "core/scene";
import type { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { SerializationTools } from "./serializationTools";

/**
 * Class handling undo / redo operations
 */
export class HistoryStack implements IDisposable {
    private _onUpdateRequiredObserver: Nullable<Observer<Nullable<NodeMaterialBlock>>>;
    private _onClearUndoStackObserver: Nullable<Observer<void>>;
    private _onRebuildRequiredObserver: Nullable<Observer<void>>;
    private _globalState: GlobalState;
    private _nodeMaterial: NodeMaterial;
    private _history: string[] = [];
    private _redoStack: string[] = [];
    private readonly _maxHistoryLength = 64;
    private _locked = false;

    /**
     * Constructor
     * @param globalState defines the hosting global state
     */
    constructor(globalState: GlobalState) {
        this._nodeMaterial = globalState.nodeMaterial;
        this._globalState = globalState;
        this._onUpdateRequiredObserver = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            this._store();
        });

        this._onRebuildRequiredObserver = globalState.stateManager.onRebuildRequiredObservable.add(() => {
            this._store();
        });

        this._onClearUndoStackObserver = globalState.onClearUndoStack.add(() => {
            this.reset();
        });
    }

    /**
     * Resets the stack
     */
    public reset() {
        this._history = [];
        this._redoStack = [];
        this._store();
    }

    private _store() {
        if (this._locked) {
            return;
        }

        SerializationTools.UpdateLocations(this._nodeMaterial, this._globalState);
        const data = JSON.stringify(this._nodeMaterial.serialize());

        if (this._history.length > 0 && this._history[this._history.length - 1] === data) {
            return;
        }

        this._history.push(data);

        if (this._history.length > this._maxHistoryLength) {
            this._history.splice(0, 1);
        }
    }

    /**
     * Undo the latest operation
     */
    public undo() {
        if (this._history.length < 2) {
            return;
        }

        this._locked = true;
        const current = this._history.pop()!;
        const previous = this._history[this._history.length - 1];
        this._redoStack.push(current);

        this._globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
        this._nodeMaterial.parseSerializedObject(JSON.parse(previous));

        this._globalState.onResetRequiredObservable.notifyObservers(false);

        this._locked = false;
    }

    /**
     * Disposes the stack
     */
    public dispose() {
        this._globalState.stateManager.onRebuildRequiredObservable.remove(this._onRebuildRequiredObserver);
        this._globalState.onClearUndoStack.remove(this._onClearUndoStackObserver);
        this._globalState.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._history = [];
        this._redoStack = [];
    }
}
