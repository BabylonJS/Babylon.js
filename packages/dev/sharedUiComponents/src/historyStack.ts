import type { IDisposable } from "core/scene";

/**
 * Class handling undo / redo operations
 */
export class HistoryStack implements IDisposable {
    private _historyStack: string[] = [];
    private _redoStack: string[] = [];
    private _activeData: any;
    private readonly _maxHistoryLength = 256;
    private _locked = false;
    private _dataProvider: () => any;
    private _applyUpdate: (data: any) => void;

    /**
     * Constructor
     * @param dataProvider defines the data provider function
     * @param applyUpdate defines the code to execute when undo/redo operation is required
     */
    constructor(dataProvider: () => any, applyUpdate: (data: any) => void) {
        this._dataProvider = dataProvider;
        this._applyUpdate = applyUpdate;
    }

    /**
     * Resets the stack
     */
    public reset() {
        this._historyStack = [];
        this._redoStack = [];
        this._activeData = null;
        this.store();
    }

    private _generateJSONDiff(obj1: any, obj2: any): any {
        if (obj1 === obj2) return undefined;
        if (obj1 === null || obj2 === null || typeof obj1 !== "object" || typeof obj2 !== "object") {
            if (obj1 !== obj2 && obj2 === undefined) {
                return "@d@";
            }
            return obj2;
        }

        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            const diff = [];
            const maxLength = Math.max(obj1.length, obj2.length);
            let hasChanges = false;

            for (let i = 0; i < maxLength; i++) {
                const localDiff = this._generateJSONDiff(obj1[i], obj2[i]);
                if (localDiff !== undefined) {
                    diff[i] = localDiff;
                    hasChanges = true;
                }
            }

            return hasChanges ? diff : undefined;
        }

        const diff: any = {};
        const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        let hasChanges = false;

        for (const key of keys) {
            if (!(key in obj1)) {
                diff[key] = obj2[key];
                hasChanges = true;
            } else if (!(key in obj2)) {
                diff[key] = "@d@"; // Mark for deletion
                hasChanges = true;
            } else {
                const nestedDiff = this._generateJSONDiff(obj1[key], obj2[key]);
                if (nestedDiff !== undefined) {
                    diff[key] = nestedDiff;
                    hasChanges = true;
                }
            }
        }

        return hasChanges ? diff : undefined;
    }

    private _applyJSONDiff(obj1: any, diff: any) {
        if (diff === undefined) {
            return obj1;
        }
        if (typeof diff !== "object" || diff === null || obj1 == null) {
            return diff;
        }

        const result: any = Array.isArray(obj1) ? [] : {};

        if (Array.isArray(diff)) {
            for (let i = 0; i < Math.max(obj1.length, diff.length); i++) {
                if (diff[i] === null && i < obj1.length) {
                    result[i] = obj1[i];
                } else if (diff[i] !== "@d@") {
                    result[i] = this._applyJSONDiff(obj1[i], diff[i]);
                }
            }
        } else {
            for (const key in obj1) {
                if (!(key in diff)) {
                    result[key] = obj1[key];
                }
            }
            for (const key in diff) {
                if (diff[key] === "@d@") {
                    // Skip this key (it's been deleted)
                } else if (typeof diff[key] === "object" && diff[key] !== null) {
                    result[key] = this._applyJSONDiff(obj1[key], diff[key]);
                } else {
                    result[key] = diff[key];
                }
            }
        }

        return result;
    }

    private _copy(source: any) {
        return JSON.parse(JSON.stringify(source));
    }

    /**
     * Stores the current state
     */
    public store() {
        if (this._locked) {
            return;
        }

        const data = this._copy(this._dataProvider());

        if (this._activeData) {
            const diff = this._generateJSONDiff(data, this._activeData);
            if (!diff) {
                return;
            }
            this._historyStack.push(JSON.stringify(diff));
        }

        this._activeData = data;

        if (this._historyStack.length > this._maxHistoryLength) {
            this._historyStack.shift();
        }

        this._redoStack.length = 0;
    }

    /**
     * Undo the latest operation
     */
    public undo() {
        if (!this._historyStack.length) {
            return;
        }

        this._locked = true;
        const diff = this._historyStack.pop()!;

        const newState = this._applyJSONDiff(this._activeData, JSON.parse(diff));
        this._redoStack.push(JSON.stringify(this._generateJSONDiff(newState, this._activeData)));

        this._applyUpdate(this._copy(newState));
        this._activeData = newState;

        this._locked = false;
    }

    /**
     * Redo the latest undo operation
     */
    public redo() {
        if (!this._redoStack.length) {
            return;
        }

        this._locked = true;
        const diff = this._redoStack.pop()!;

        const newState = this._applyJSONDiff(this._activeData, JSON.parse(diff));
        this._historyStack.push(JSON.stringify(this._generateJSONDiff(newState, this._activeData)));

        this._applyUpdate(this._copy(newState));
        this._activeData = newState;

        this._locked = false;
    }

    /**
     * Disposes the stack
     */
    public dispose() {
        this._historyStack = [];
        this._redoStack = [];
    }
}
