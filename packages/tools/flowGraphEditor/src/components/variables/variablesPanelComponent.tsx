import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { FlowGraphState } from "core/FlowGraph/flowGraph";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import {
    GatherVariables,
    RenameVariable,
    DeleteVariable,
    FormatVariableValue,
    ParseVariableValue,
    VariableTypeGroups,
    IsSceneObjectType,
    IsVectorOrColorType,
    GetComponentLabels,
    GetComponents,
    BuildFromComponents,
    GetDefaultValueForType,
    InferVariableType,
    type IVariableEntry,
    type VariableTypeName,
} from "../../variableUtils";
import "./variables.scss";

interface IVariablesPanelProps {
    globalState: GlobalState;
}

interface IVariablesPanelState {
    variables: IVariableEntry[];
    /** Index of the variable whose *name* is being edited (null = none). */
    editingNameIndex: number | null;
    editingName: string;
    /** Index of the variable whose *value* is being edited (null = none). */
    editingValueIndex: number | null;
    editingValue: string;
    isRunning: boolean;
    runtimeValues: Map<string, string>;
    /** Per-variable declared type, keyed by variable name. */
    variableTypes: Map<string, VariableTypeName>;
    collapsed: boolean;
}

/**
 * Compact variables strip that sits between the toolbar and the canvas.
 * Shows variable names (shared across contexts) and per-context values
 * with inline editing for both.
 */
export class VariablesPanelComponent extends React.Component<IVariablesPanelProps, IVariablesPanelState> {
    private _builtObserver: Nullable<Observer<void>> = null;
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _contextChangedObserver: Nullable<Observer<number>> = null;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    /** @internal */
    constructor(props: IVariablesPanelProps) {
        super(props);
        this.state = {
            variables: [],
            editingNameIndex: null,
            editingName: "",
            editingValueIndex: null,
            editingValue: "",
            isRunning: false,
            runtimeValues: new Map(),
            variableTypes: new Map(),
            collapsed: false,
        };
    }

    /** @internal */
    override componentDidMount() {
        this._builtObserver = this.props.globalState.onBuiltObservable.add(() => {
            this._subscribeToFlowGraph();
            this._refreshVariables();
        });
        this._contextChangedObserver = this.props.globalState.onSelectedContextChanged.add(() => {
            this._refreshVariables();
            this._pollRuntimeValues();
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
        this._contextChangedObserver?.remove();
        this._contextChangedObserver = null;
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
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (ctx) {
            for (const [key, val] of Object.entries(ctx.userVariables)) {
                values.set(key, FormatVariableValue(val));
            }
        }
        this.setState({ runtimeValues: values });
    }

    private _refreshVariables() {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            this.setState({ variables: [], variableTypes: new Map() });
            return;
        }

        const variables = GatherVariables(fg);

        // Read type annotations from the selected context (or first available)
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex) ?? fg.getContext(0);
        const variableTypes = new Map<string, VariableTypeName>();
        if (ctx) {
            for (const v of variables) {
                const declared = ctx.getVariableType(v.name) as VariableTypeName | undefined;
                if (declared) {
                    variableTypes.set(v.name, declared);
                } else {
                    // Infer from current value
                    const val = ctx.userVariables[v.name];
                    variableTypes.set(v.name, InferVariableType(val));
                }
            }
        }
        this.setState({ variables, variableTypes });
    }

    private _renameVariable(oldName: string, newName: string) {
        if (!newName || newName === oldName) {
            return;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        RenameVariable(fg, oldName, newName);

        // Migrate variable type annotations across all contexts
        for (let i = 0; i < fg.contextCount; i++) {
            const ctx = fg.getContext(i);
            if (ctx) {
                const oldType = ctx.getVariableType(oldName);
                if (oldType) {
                    ctx.setVariableType(newName, oldType);
                    delete ctx.variableTypes[oldName];
                }
            }
        }

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    private _deleteVariable(name: string) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        DeleteVariable(fg, name);

        // Remove stored type annotations so deleted variables don't reappear after reload
        for (let i = 0; i < fg.contextCount; i++) {
            const ctx = fg.getContext(i);
            if (ctx) {
                delete ctx.variableTypes[name];
            }
        }

        this.props.globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        this._refreshVariables();
    }

    private _addVariable() {
        const existing = new Set(this.state.variables.map((v) => v.name));
        let idx = 1;
        let name = "newVariable";
        while (existing.has(name)) {
            name = `newVariable${idx++}`;
        }

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        let ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            ctx = fg.createContext();
        }
        ctx.setVariable(name, 0);
        ctx.setVariableType(name, "number");
        // Also set on all other contexts
        for (let i = 0; i < fg.contextCount; i++) {
            const other = fg.getContext(i);
            if (other && other !== ctx) {
                if (!other.hasVariable(name)) {
                    other.setVariable(name, 0);
                }
                other.setVariableType(name, "number");
            }
        }

        const variables = GatherVariables(fg);
        const newIdx = variables.findIndex((v) => v.name === name);
        const variableTypes = new Map(this.state.variableTypes);
        variableTypes.set(name, "number");
        this.setState({ variables, variableTypes, editingNameIndex: newIdx, editingName: name, collapsed: false });
    }

    // --- Name editing ---

    private _startNameEditing(index: number) {
        this.setState({ editingNameIndex: index, editingName: this.state.variables[index].name });
    }

    private _commitNameEditing() {
        const { editingNameIndex, editingName, variables } = this.state;
        if (editingNameIndex === null || editingNameIndex >= variables.length) {
            this.setState({ editingNameIndex: null });
            return;
        }
        const oldName = variables[editingNameIndex].name;
        const newName = editingName.trim();
        this.setState({ editingNameIndex: null });
        if (newName && newName !== oldName) {
            this._renameVariable(oldName, newName);
        }
    }

    // --- Value editing ---

    private _startValueEditing(index: number) {
        const name = this.state.variables[index].name;
        const display = this.state.runtimeValues.get(name) ?? "undefined";
        this.setState({ editingValueIndex: index, editingValue: display });
    }

    private _commitValueEditing() {
        const { editingValueIndex, editingValue, variables } = this.state;
        if (editingValueIndex === null || editingValueIndex >= variables.length) {
            this.setState({ editingValueIndex: null });
            return;
        }
        const name = variables[editingValueIndex].name;
        this.setState({ editingValueIndex: null });

        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            return;
        }

        const currentValue = ctx.userVariables[name];
        const parsed = ParseVariableValue(editingValue, currentValue);
        ctx.setVariable(name, parsed);
        this._pollRuntimeValues();
    }

    // --- Type changing ---

    private _changeVariableType(varName: string, newType: VariableTypeName) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }

        const defaultValue = GetDefaultValueForType(newType);

        // Update type annotation and set default value on all contexts
        for (let i = 0; i < fg.contextCount; i++) {
            const ctx = fg.getContext(i);
            if (ctx) {
                ctx.setVariableType(varName, newType);
                ctx.setVariable(varName, defaultValue);
            }
        }

        const variableTypes = new Map(this.state.variableTypes);
        variableTypes.set(varName, newType);
        this.setState({ variableTypes });
        this._pollRuntimeValues();
    }

    // --- Scene object helpers ---

    /** Cache: sceneUid → typeName → { lengths, options } */
    private _sceneObjectCache = new Map<string, Map<string, { lengths: number[]; options: { name: string; uniqueId: number }[] }>>();

    private _getSceneObjectsForType(typeName: VariableTypeName): { name: string; uniqueId: number }[] {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return [];
        }
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            return [];
        }
        const scene = ctx.getScene();
        const sceneUid = scene.uid ?? "0";

        // Get or create per-scene cache
        let typeCache = this._sceneObjectCache.get(sceneUid);
        if (!typeCache) {
            typeCache = new Map();
            this._sceneObjectCache.set(sceneUid, typeCache);
        }

        // Determine source collections and current lengths for cache invalidation
        const sources = this._getSceneCollections(scene, typeName);
        const currentLengths = sources.map((s) => s.length);
        const cached = typeCache.get(typeName);
        if (cached && cached.lengths.length === currentLengths.length && cached.lengths.every((len, i) => len === currentLengths[i])) {
            return cached.options;
        }

        // Rebuild
        let options: { name: string; uniqueId: number }[];
        if (typeName === "TransformNode") {
            options = [...scene.transformNodes, ...scene.meshes].map((n) => ({ name: n.name, uniqueId: n.uniqueId }));
        } else if (sources.length > 0) {
            options = sources[0].map((item) => ({ name: item.name, uniqueId: item.uniqueId }));
        } else {
            options = [];
        }

        typeCache.set(typeName, { lengths: currentLengths, options });
        return options;
    }

    private _getSceneCollections(
        scene: { meshes: any[]; transformNodes: any[]; cameras: any[]; lights: any[]; materials: any[]; animationGroups: any[] },
        typeName: VariableTypeName
    ): any[][] {
        switch (typeName) {
            case "Mesh":
                return [scene.meshes];
            case "TransformNode":
                return [scene.transformNodes, scene.meshes];
            case "Camera":
                return [scene.cameras];
            case "Light":
                return [scene.lights];
            case "Material":
                return [scene.materials];
            case "AnimationGroup":
                return [scene.animationGroups];
            default:
                return [];
        }
    }

    private _setSceneObjectVariable(varName: string, typeName: VariableTypeName, uniqueId: number) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            return;
        }
        const scene = ctx.getScene();
        let obj: unknown = undefined;
        switch (typeName) {
            case "Mesh":
                obj = scene.meshes.find((m) => m.uniqueId === uniqueId);
                break;
            case "TransformNode":
                obj = scene.transformNodes.find((n) => n.uniqueId === uniqueId) ?? scene.meshes.find((m) => m.uniqueId === uniqueId);
                break;
            case "Camera":
                obj = scene.cameras.find((c) => c.uniqueId === uniqueId);
                break;
            case "Light":
                obj = scene.lights.find((l) => l.uniqueId === uniqueId);
                break;
            case "Material":
                obj = scene.materials.find((m) => m.uniqueId === uniqueId);
                break;
            case "AnimationGroup":
                obj = scene.animationGroups.find((ag) => ag.uniqueId === uniqueId);
                break;
        }
        ctx.setVariable(varName, obj);
        this._pollRuntimeValues();
    }

    // --- Component editing for Vector/Color ---

    private _setVectorComponent(varName: string, typeName: VariableTypeName, componentIndex: number, value: number) {
        const fg = this.props.globalState.flowGraph;
        if (!fg) {
            return;
        }
        const ctx = fg.getContext(this.props.globalState.selectedContextIndex);
        if (!ctx) {
            return;
        }
        const current = ctx.userVariables[varName];
        const components = GetComponents(current, typeName);
        components[componentIndex] = value;
        const newValue = BuildFromComponents(components, typeName);
        ctx.setVariable(varName, newValue);
        this._pollRuntimeValues();
    }

    private _renderTypeSelector(varName: string, currentType: VariableTypeName) {
        return (
            <select
                className="fge-var-cell-type-select"
                value={currentType}
                onChange={(e) => {
                    this._changeVariableType(varName, e.target.value as VariableTypeName);
                }}
                title="Variable type"
            >
                {VariableTypeGroups.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                        {group.types.map((t) => (
                            <option key={t.name} value={t.name}>
                                {t.label}
                            </option>
                        ))}
                    </optgroup>
                ))}
            </select>
        );
    }

    private _renderValueEditor(varName: string, typeName: VariableTypeName, idx: number) {
        const { editingValueIndex, editingValue, runtimeValues } = this.state;

        // --- Boolean: toggle ---
        if (typeName === "boolean") {
            const fg = this.props.globalState.flowGraph;
            const ctx = fg?.getContext(this.props.globalState.selectedContextIndex);
            const currentVal = ctx?.userVariables[varName];
            return (
                <label className="fge-var-cell-bool-toggle">
                    <input
                        type="checkbox"
                        checked={!!currentVal}
                        onChange={(e) => {
                            ctx?.setVariable(varName, e.target.checked);
                            this._pollRuntimeValues();
                        }}
                    />
                    <span>{currentVal ? "true" : "false"}</span>
                </label>
            );
        }

        // --- Number / Integer: number input ---
        if (typeName === "number" || typeName === "FlowGraphInteger") {
            const fg = this.props.globalState.flowGraph;
            const ctx = fg?.getContext(this.props.globalState.selectedContextIndex);
            const raw = ctx?.userVariables[varName];
            const numVal = typeName === "FlowGraphInteger" ? (raw?.value ?? 0) : typeof raw === "number" ? raw : 0;
            return (
                <input
                    className="fge-var-cell-number-input"
                    type="number"
                    step={typeName === "FlowGraphInteger" ? 1 : "any"}
                    value={numVal}
                    onFocus={() => {
                        this.props.globalState.lockObject.lock = true;
                    }}
                    onBlur={() => {
                        this.props.globalState.lockObject.lock = false;
                    }}
                    onChange={(e) => {
                        const n = typeName === "FlowGraphInteger" ? Math.round(Number(e.target.value)) : Number(e.target.value);
                        if (!isNaN(n)) {
                            if (typeName === "FlowGraphInteger") {
                                ctx?.setVariable(varName, new FlowGraphInteger(n));
                            } else {
                                ctx?.setVariable(varName, n);
                            }
                            this._pollRuntimeValues();
                        }
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                />
            );
        }

        // --- Vector / Color: component inputs ---
        if (IsVectorOrColorType(typeName)) {
            const fg = this.props.globalState.flowGraph;
            const ctx = fg?.getContext(this.props.globalState.selectedContextIndex);
            const current = ctx?.userVariables[varName];
            const components = GetComponents(current, typeName);
            const labels = GetComponentLabels(typeName);
            return (
                <div className="fge-var-cell-components">
                    {labels.map((label, ci) => (
                        <div key={label} className="fge-var-cell-component">
                            <span className="fge-var-cell-component-label">{label}</span>
                            <input
                                className="fge-var-cell-component-input"
                                type="number"
                                step="any"
                                value={components[ci]}
                                onFocus={() => {
                                    this.props.globalState.lockObject.lock = true;
                                }}
                                onBlur={() => {
                                    this.props.globalState.lockObject.lock = false;
                                }}
                                onChange={(e) => {
                                    const n = Number(e.target.value);
                                    if (!isNaN(n)) {
                                        this._setVectorComponent(varName, typeName, ci, n);
                                    }
                                }}
                                onKeyDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        // --- Scene objects: dropdown picker ---
        if (IsSceneObjectType(typeName)) {
            const objects = this._getSceneObjectsForType(typeName);
            const fg = this.props.globalState.flowGraph;
            const ctx = fg?.getContext(this.props.globalState.selectedContextIndex);
            const current = ctx?.userVariables[varName];
            const currentUid = (current as { uniqueId?: number })?.uniqueId ?? -1;
            return (
                <select
                    className="fge-var-cell-object-select"
                    value={currentUid}
                    onChange={(e) => {
                        const uid = Number(e.target.value);
                        if (uid === -1) {
                            ctx?.setVariable(varName, undefined);
                            this._pollRuntimeValues();
                        } else {
                            this._setSceneObjectVariable(varName, typeName, uid);
                        }
                    }}
                >
                    <option value={-1}>(none)</option>
                    {objects.map((obj) => (
                        <option key={obj.uniqueId} value={obj.uniqueId}>
                            {obj.name || `[unnamed #${obj.uniqueId}]`}
                        </option>
                    ))}
                </select>
            );
        }

        // --- String / Any: text input ---
        if (editingValueIndex === idx) {
            return (
                <input
                    className="fge-var-cell-value-input"
                    value={editingValue}
                    onChange={(e) => this.setState({ editingValue: e.target.value })}
                    onFocus={() => {
                        this.props.globalState.lockObject.lock = true;
                    }}
                    onBlur={() => {
                        this.props.globalState.lockObject.lock = false;
                        this._commitValueEditing();
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") {
                            this._commitValueEditing();
                        } else if (e.key === "Escape") {
                            this.setState({ editingValueIndex: null });
                        }
                    }}
                    autoFocus
                />
            );
        }
        return (
            <span className="fge-var-cell-value" onClick={() => this._startValueEditing(idx)} title="Click to edit value">
                {runtimeValues.get(varName) ?? "undefined"}
            </span>
        );
    }

    /** @internal */
    override render() {
        const { variables, editingNameIndex, editingName, variableTypes, collapsed } = this.state;
        const varCount = variables.length;

        return (
            <div className="fge-variables-strip">
                <div className="fge-variables-strip-header">
                    <button className="fge-variables-toggle" onClick={() => this.setState({ collapsed: !collapsed })} title={collapsed ? "Expand variables" : "Collapse variables"}>
                        {collapsed ? "▶" : "▼"}
                    </button>
                    <span className="fge-variables-strip-title">Variables{varCount > 0 ? ` (${varCount})` : ""}</span>
                    {this.state.isRunning && <span className="fge-variables-live-badge">● Live</span>}
                    <button className="fge-variables-strip-add" onClick={() => this._addVariable()} title="Add a new variable">
                        +
                    </button>
                </div>
                {!collapsed && (
                    <div className="fge-variables-strip-body">
                        {variables.length === 0 ? (
                            <div className="fge-variables-strip-empty">No variables. Click + to add one, or use GetVariable/SetVariable blocks.</div>
                        ) : (
                            <div className="fge-variables-strip-table">
                                {variables.map((v, idx) => {
                                    const typeName = variableTypes.get(v.name) ?? "any";
                                    return (
                                        <div key={v.name} className="fge-var-cell">
                                            <div className="fge-var-cell-name-row">
                                                {editingNameIndex === idx ? (
                                                    <input
                                                        className="fge-var-cell-name-input"
                                                        value={editingName}
                                                        onChange={(e) => this.setState({ editingName: e.target.value })}
                                                        onFocus={() => {
                                                            this.props.globalState.lockObject.lock = true;
                                                        }}
                                                        onBlur={() => {
                                                            this.props.globalState.lockObject.lock = false;
                                                            this._commitNameEditing();
                                                        }}
                                                        onKeyDown={(e) => {
                                                            e.stopPropagation();
                                                            if (e.key === "Enter") {
                                                                this._commitNameEditing();
                                                            } else if (e.key === "Escape") {
                                                                this.setState({ editingNameIndex: null });
                                                            }
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        className="fge-var-cell-name"
                                                        onDoubleClick={() => this._startNameEditing(idx)}
                                                        title={`${v.name} (${v.getCount}G/${v.setCount}S) — double-click to rename`}
                                                    >
                                                        {v.name}
                                                    </span>
                                                )}
                                                <button className="fge-var-cell-delete" title="Delete variable and its blocks" onClick={() => this._deleteVariable(v.name)}>
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="fge-var-cell-type-row">{this._renderTypeSelector(v.name, typeName)}</div>
                                            <div className="fge-var-cell-value-row">{this._renderValueEditor(v.name, typeName, idx)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }
}
