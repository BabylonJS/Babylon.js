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
import { Body1, Caption1, Button, Card, Dropdown, Input, Option, OptionGroup, Switch, makeStyles, tokens } from "@fluentui/react-components";
import { AddRegular, ChevronDownRegular, ChevronRightRegular, DismissRegular } from "@fluentui/react-icons";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

interface IVariablesPanelProps {
    globalState: GlobalState;
}

interface IVariablesPanelInnerProps extends IVariablesPanelProps {
    classes: ReturnType<typeof useStyles>;
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

const useStyles = makeStyles({
    strip: {
        background: tokens.colorNeutralBackground3,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        flexShrink: 0,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground1,
    },
    header: {
        display: "flex",
        alignItems: "center",
        height: "26px",
        padding: `0 ${tokens.spacingHorizontalS}`,
        gap: tokens.spacingHorizontalXS,
        background: tokens.colorNeutralBackground2,
    },
    title: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        userSelect: "none",
    },
    liveBadge: {
        color: tokens.colorPaletteGreenForeground1,
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
    },
    addButton: { marginLeft: "auto" },
    body: {
        maxHeight: "120px",
        overflowY: "auto",
        overflowX: "hidden",
    },
    empty: {
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
        fontSize: tokens.fontSizeBase300,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    },
    table: {
        display: "flex",
        flexWrap: "wrap",
        // Spacing between adjacent variable Cards on the same row and between rows.
        columnGap: tokens.spacingHorizontalS,
        rowGap: tokens.spacingVerticalS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    },
    cell: {
        // Trim the Fluent Card to fit our compact variables strip. Background, border, radius,
        // and hover treatment all come from Card itself.
        minWidth: "120px",
        maxWidth: "220px",
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
        gap: tokens.spacingVerticalXS,
    },
    nameRow: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalXS },
    name: {
        flex: 1,
        fontFamily: tokens.fontFamilyMonospace,
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        cursor: "default",
        minWidth: 0,
    },
    nameInput: { flex: 1, minWidth: 0 },
    typeRow: { marginTop: "2px" },
    typeSelect: {
        // Compact dropdown to fit in the variables strip's small per-row layout.
        width: "100%",
        minWidth: "auto",
    },
    typeOptionGroupLabel: {
        // The Fluent dropdown popover renders inside a portal which our `Theme`
        // intentionally configures with `applyStylesToPortals: false`. As a result,
        // CSS custom properties like `var(--fontFamilyBase)` aren't resolved inside the
        // popover, and `<OptionGroup>` labels fall back to the browser default (Times New
        // Roman). Hard-code Fluent's web font stack here, applied via OptionGroup's `label`
        // slot, so just *our* group labels look right.
        fontFamily: "'Segoe UI', 'Segoe UI Web (West European)', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",
    },
    valueRow: { marginTop: "2px" },
    value: {
        display: "block",
        fontFamily: tokens.fontFamilyMonospace,
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorPaletteGreenForeground1,
        cursor: "pointer",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        padding: "1px 0",
        ":hover": { color: tokens.colorPaletteGreenForeground3 },
    },
    components: { display: "flex", flexWrap: "wrap", gap: "2px" },
    component: { display: "flex", alignItems: "center", gap: "2px" },
    componentLabel: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        minWidth: "8px",
    },
    componentInput: { width: "60px" },
    objectSelect: {
        width: "100%",
        height: "20px",
        padding: `0 ${tokens.spacingHorizontalXXS}`,
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorPaletteGreenForeground1,
        background: tokens.colorNeutralBackground3,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusSmall,
        cursor: "pointer",
        outline: "none",
        boxSizing: "border-box",
    },
    boolToggle: { display: "flex", alignItems: "center", gap: tokens.spacingHorizontalXS },
});

/**
 * Compact variables strip that sits between the toolbar and the canvas.
 * Shows variable names (shared across contexts) and per-context values
 * with inline editing for both.
 *
 * Wraps `VariablesPanelInner` (the class component containing the logic) so we can use
 * `makeStyles` (a hook) without converting the entire stateful component to a function.
 * @param props - The component props.
 * @returns The rendered variables panel.
 */
export const VariablesPanelComponent: React.FunctionComponent<IVariablesPanelProps> = (props) => {
    const classes = useStyles();
    return <VariablesPanelInner {...props} classes={classes} />;
};

class VariablesPanelInner extends React.Component<IVariablesPanelInnerProps, IVariablesPanelState> {
    private _builtObserver: Nullable<Observer<void>> = null;
    private _stateObserver: Nullable<Observer<FlowGraphState>> = null;
    private _contextChangedObserver: Nullable<Observer<number>> = null;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    /** @internal */
    constructor(props: IVariablesPanelInnerProps) {
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
        // Use raw Fluent Dropdown + OptionGroup here because the shared wrapper at
        // `shared-ui-components/fluent/primitives/dropdown` takes a flat options array and
        // doesn't expose grouped options. The shared wrapper's other ergonomics (ToolContext
        // sizing, etc.) aren't critical at this density.
        const { classes } = this.props;
        const currentLabel = VariableTypeGroups.flatMap((g) => g.types).find((t) => t.name === currentType)?.label ?? currentType;
        return (
            <Dropdown
                size="small"
                className={classes.typeSelect}
                value={currentLabel}
                selectedOptions={[currentType]}
                onOptionSelect={(_, data) => {
                    if (data.optionValue) {
                        this._changeVariableType(varName, data.optionValue as VariableTypeName);
                    }
                }}
                title="Variable type"
            >
                {VariableTypeGroups.map((group) => (
                    <OptionGroup key={group.label} label={{ className: classes.typeOptionGroupLabel, children: group.label }}>
                        {group.types.map((t) => (
                            <Option key={t.name} value={t.name} text={t.label}>
                                {t.label}
                            </Option>
                        ))}
                    </OptionGroup>
                ))}
            </Dropdown>
        );
    }

    private _renderValueEditor(varName: string, typeName: VariableTypeName, idx: number) {
        const { classes } = this.props;
        const { editingValueIndex, editingValue, runtimeValues } = this.state;

        // --- Boolean: toggle ---
        if (typeName === "boolean") {
            const fg = this.props.globalState.flowGraph;
            const ctx = fg?.getContext(this.props.globalState.selectedContextIndex);
            const currentVal = ctx?.userVariables[varName];
            return (
                <label className={classes.boolToggle}>
                    <Switch
                        checked={!!currentVal}
                        onChange={(_, data) => {
                            ctx?.setVariable(varName, data.checked);
                            this._pollRuntimeValues();
                        }}
                    />
                    <Body1>{currentVal ? "true" : "false"}</Body1>
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
                <Input
                    size="small"
                    type="number"
                    step={typeName === "FlowGraphInteger" ? 1 : "any"}
                    value={String(numVal)}
                    onFocus={() => {
                        this.props.globalState.lockObject.lock = true;
                    }}
                    onBlur={() => {
                        this.props.globalState.lockObject.lock = false;
                    }}
                    onChange={(_, data) => {
                        const n = typeName === "FlowGraphInteger" ? Math.round(Number(data.value)) : Number(data.value);
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
                <div className={classes.components}>
                    {labels.map((label, ci) => (
                        <div key={label} className={classes.component}>
                            <Caption1 className={classes.componentLabel}>{label}</Caption1>
                            <Input
                                className={classes.componentInput}
                                size="small"
                                type="number"
                                step="any"
                                value={String(components[ci])}
                                onFocus={() => {
                                    this.props.globalState.lockObject.lock = true;
                                }}
                                onBlur={() => {
                                    this.props.globalState.lockObject.lock = false;
                                }}
                                onChange={(_, data) => {
                                    const n = Number(data.value);
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
                    className={classes.objectSelect}
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
                <Input
                    size="small"
                    value={editingValue}
                    onChange={(_, data) => this.setState({ editingValue: data.value })}
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
            <Body1 className={classes.value} onClick={() => this._startValueEditing(idx)} title="Click to edit value">
                {runtimeValues.get(varName) ?? "undefined"}
            </Body1>
        );
    }

    /** @internal */
    override render() {
        const { classes } = this.props;
        const { variables, editingNameIndex, editingName, variableTypes, collapsed } = this.state;
        const varCount = variables.length;

        return (
            <div className={classes.strip}>
                <div className={classes.header}>
                    <Button
                        size="small"
                        appearance="subtle"
                        icon={collapsed ? <ChevronRightRegular /> : <ChevronDownRegular />}
                        title={collapsed ? "Expand variables" : "Collapse variables"}
                        onClick={() => this.setState({ collapsed: !collapsed })}
                    />
                    <Body1 className={classes.title}>Variables{varCount > 0 ? ` (${varCount})` : ""}</Body1>
                    {this.state.isRunning && <Caption1 className={classes.liveBadge}>● Live</Caption1>}
                    <Button className={classes.addButton} size="small" appearance="subtle" icon={<AddRegular />} title="Add a new variable" onClick={() => this._addVariable()} />
                </div>
                <Collapse visible={!collapsed} orientation="vertical">
                    <div className={classes.body}>
                        {variables.length === 0 ? (
                            <Body1 className={classes.empty}>No variables. Click + to add one, or use GetVariable/SetVariable blocks.</Body1>
                        ) : (
                            <div className={classes.table}>
                                {variables.map((v, idx) => {
                                    const typeName = variableTypes.get(v.name) ?? "any";
                                    return (
                                        <Card key={v.name} size="small" className={classes.cell}>
                                            <div className={classes.nameRow}>
                                                {editingNameIndex === idx ? (
                                                    <Input
                                                        className={classes.nameInput}
                                                        size="small"
                                                        value={editingName}
                                                        onChange={(_, data) => this.setState({ editingName: data.value })}
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
                                                    <Body1
                                                        className={classes.name}
                                                        onDoubleClick={() => this._startNameEditing(idx)}
                                                        title={`${v.name} (${v.getCount}G/${v.setCount}S) — double-click to rename`}
                                                    >
                                                        {v.name}
                                                    </Body1>
                                                )}
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    icon={<DismissRegular />}
                                                    title="Delete variable and its blocks"
                                                    onClick={() => this._deleteVariable(v.name)}
                                                />
                                            </div>
                                            <div className={classes.typeRow}>{this._renderTypeSelector(v.name, typeName)}</div>
                                            <div className={classes.valueRow}>{this._renderValueEditor(v.name, typeName, idx)}</div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </Collapse>
            </div>
        );
    }
}
