import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { GatherVariables, RenameVariable, DeleteVariable, FormatVariableValue, type IVariableEntry } from "../../variableUtils";
import "./variables.scss";

interface IVariablesPanelProps {
    globalState: GlobalState;
}

interface IVariablesPanelState {
    variables: IVariableEntry[];
    editingIndex: number | null;
    editingName: string;
    isRunning: boolean;
    runtimeValues: Map<string, string>;
}

/**
 * Panel component that lists all flow graph variables (referenced by
 * GetVariable / SetVariable blocks) and supports add, rename, and delete.
 */
export class VariablesPanelComponent extends React.Component<IVariablesPanelProps, IVariablesPanelState> {
    private _builtObserver: Nullable<Observer<void>> = null;
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    /** @internal */
    constructor(props: IVariablesPanelProps) {
        super(props);
        this.state = { variables: [], editingIndex: null, editingName: "", isRunning: false, runtimeValues: new Map() };
    }

    /** @internal */
    override componentDidMount() {
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._subscribeToFlowGraph();
            this._refreshVariables();
        });
        this._subscribeToFlowGraph();
        this._refreshVariables();
    }

    /** @internal */
    override componentWillUnmount() {
        this._builtObserver?.remove();
        this._builtObserver = null;
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._stopPolling();
    }

    private _subscribeToFlowGraph() {
        this._stateObserver?.remove();
        this._stateObserver = null;
        this._stopPolling();

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const running = fg.state === FlowGraphState.Started;
        this.setState({ isRunning: running });
        if (running) {
            this._startPolling();
        }

        this._stateObserver = fg.onStateChangedObservable.add((newState) => {
            const isRunning = newState === FlowGraphState.Started;
            this.setState({ isRunning });
            if (isRunning) {
                this._startPolling();
            } else {
                // Do one final read so the panel shows the last values
                this._pollRuntimeValues();
                this._stopPolling();
            }
        });
    }

    private _startPolling() {
        this._stopPolling();
        this._pollRuntimeValues();
        this._pollTimer = setInterval(() => this._pollRuntimeValues(), 200);
    }

    private _stopPolling() {
        if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    private _pollRuntimeValues() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const values = new Map<string, string>();
        const ctx = fg.getContext(0);
        if (ctx) {
            for (const [key, val] of Object.entries(ctx.userVariables)) {
                values.set(key, FormatVariableValue(val));
            }
        }
        this.setState({ runtimeValues: values });
    }

    /**
     * Scan all blocks in the flow graph to build the variable list.
     */
    private _refreshVariables() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            this.setState({ variables: [] });
            return;
        }

        const variables = GatherVariables(fg);
        this.setState({ variables });
    }

    /**
     * Rename a variable across all GetVariable and SetVariable blocks.
     * @param oldName - the current name
     * @param newName - the new name
     */
    private _renameVariable(oldName: string, newName: string) {
        if (!newName || newName === oldName) {
            return;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        RenameVariable(fg, oldName, newName);

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    /**
     * Delete a variable by removing all GetVariable and SetVariable blocks that
     * reference it, and removing it from all execution contexts.
     * @param name - the variable name to delete
     */
    private _deleteVariable(name: string) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        DeleteVariable(fg, name);

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    /**
     * Add a new variable by creating a GetVariable block with a default name.
     */
    private _addVariable() {
        // Find a unique name
        const existing = new Set(this.state.variables.map((v) => v.name));
        let idx = 1;
        let name = "newVariable";
        while (existing.has(name)) {
            name = `newVariable${idx++}`;
        }

        // Add a SetVariable block referencing this name so the variable is registered
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        // Set the variable on context 0 with a default empty value
        let ctx = fg.getContext(0);
        if (!ctx) {
            ctx = fg.createContext();
        }
        ctx.setVariable(name, undefined);

        // Gather the updated list and start editing the new variable
        const variables = GatherVariables(fg);
        const newIdx = variables.findIndex((v) => v.name === name);
        this.setState({ variables, editingIndex: newIdx, editingName: name });
    }

    private _startEditing(index: number) {
        this.setState({ editingIndex: index, editingName: this.state.variables[index].name });
    }

    private _commitEditing() {
        const { editingIndex, editingName, variables } = this.state;
        if (editingIndex === null || editingIndex >= variables.length) {
            this.setState({ editingIndex: null });
            return;
        }
        const oldName = variables[editingIndex].name;
        const newName = editingName.trim();
        this.setState({ editingIndex: null });
        if (newName && newName !== oldName) {
            this._renameVariable(oldName, newName);
        }
    }

    /** @internal */
    override render() {
        const { variables, editingIndex, editingName, isRunning, runtimeValues } = this.state;

        return (
            <div className="fge-variables-panel">
                <div className="fge-variables-header">
                    <h3>Variables</h3>
                    {isRunning && <span className="fge-variables-running-badge">● Live</span>}
                    <button className="fge-variables-add-btn" onClick={() => this._addVariable()} title="Add a new variable">
                        + Add
                    </button>
                </div>
                {variables.length === 0 && (
                    <div className="fge-variables-empty">No variables defined. Use GetVariable / SetVariable blocks or click &quot;+ Add&quot; to create one.</div>
                )}
                {variables.map((v, idx) => (
                    <div key={v.name} className="fge-variable-row">
                        <div className="fge-variable-row-top">
                            {editingIndex === idx ? (
                                <input
                                    className="fge-variable-name"
                                    value={editingName}
                                    onChange={(e) => this.setState({ editingName: e.target.value })}
                                    onFocus={() => {
                                        this.props.globalState.lockObject.lock = true;
                                    }}
                                    onBlur={() => {
                                        this.props.globalState.lockObject.lock = false;
                                        this._commitEditing();
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === "Enter") {
                                            this._commitEditing();
                                        } else if (e.key === "Escape") {
                                            this.setState({ editingIndex: null });
                                        }
                                    }}
                                    autoFocus
                                />
                            ) : (
                                <span className="fge-variable-name" onDoubleClick={() => this._startEditing(idx)} title="Double-click to rename">
                                    {v.name}
                                </span>
                            )}
                            <span className="fge-variable-type" title={`${v.getCount} get, ${v.setCount} set`}>
                                {v.getCount}G / {v.setCount}S
                            </span>
                            <button className="fge-variable-delete-btn" title="Delete variable and its blocks" onClick={() => this._deleteVariable(v.name)}>
                                ✕
                            </button>
                        </div>
                        {runtimeValues.size > 0 && (
                            <div className="fge-variable-value" title={runtimeValues.get(v.name) ?? "undefined"}>
                                = {runtimeValues.get(v.name) ?? "undefined"}
                            </div>
                        )}
                    </div>
                ))}
                <div className="fge-variables-info">
                    Double-click a name to rename. Renaming propagates to all Get/Set blocks.
                    <br />
                    Deleting a variable removes all GetVariable and SetVariable blocks that reference it.
                </div>
            </div>
        );
    }
}
