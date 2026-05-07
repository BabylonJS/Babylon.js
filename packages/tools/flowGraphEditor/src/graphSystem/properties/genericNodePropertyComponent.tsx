import * as React from "react";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { makeStyles, tokens } from "@fluentui/react-components";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextInputPropertyLine, NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextAreaPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textAreaPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { ComboBoxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/comboBoxPropertyLine";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine, Vector4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";

import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { type IEditablePropertyListOption, type IPropertyDescriptionForEdition, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { ForceRebuild } from "shared-ui-components/nodeGraphSystem/automaticProperties";
import { EDITABLE_INPUTS } from "./editableInputsRegistry";
import { CONSTRUCTOR_CONFIG, FLOW_GRAPH_TYPE_OPTIONS } from "./constructorConfigRegistry";
import { getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes";
import { Vector2, Vector3, Vector4, Matrix } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { FlowGraphBlockDisplayName } from "../blockDisplayUtils";
import { type GlobalState } from "../../globalState";
import { GatherVariableNames } from "../../variableUtils";

/**
 * Type names whose data inputs can be edited directly in
 * the right-hand property panel without explicit registration.
 */
const _EDITABLE_TYPE_NAMES: ReadonlySet<string> = new Set(["number", "boolean", "string", "FlowGraphInteger", "Vector2", "Vector3", "Vector4", "Color3", "Color4", "Matrix"]);

/**
 * Returns true if the given connection should be shown as an editable field
 * in the right-hand property panel.
 *
 * A connection is editable if:
 * 1. It is explicitly listed in the EDITABLE_INPUTS registry, **or**
 * 2. Its richType.typeName is a known editable type (number, boolean,
 *    string, FlowGraphInteger, Vector2/3/4, Color3/4, Matrix). This
 *    allows any block with typed inputs to expose those inputs
 *    automatically without requiring manual registration.
 *
 * @param conn The data connection to test.
 * @param block The block that owns the connection.
 * @returns True if the connection should be shown as an editable field.
 */
function IsPrimitiveEditableInput(conn: FlowGraphDataConnection<any>, block: FlowGraphBlock): boolean {
    if (EDITABLE_INPUTS.get(block.getClassName())?.has(conn.name)) {
        return true;
    }
    return _EDITABLE_TYPE_NAMES.has(conn.richType.typeName);
}

const useMatrixStyles = makeStyles({
    container: {
        display: "grid",
        // Four equal-width columns that together span the full available width.
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: tokens.spacingHorizontalXXS,
        rowGap: tokens.spacingVerticalXXS,
        marginTop: tokens.spacingVerticalXS,
        width: "100%",
    },
    cell: {
        // Let the SpinButton fill its grid cell so all 16 cells share the row width uniformly.
        width: "100%",
        minWidth: 0,
    },
});

/**
 * Compact 4×4 matrix editor used inline inside a `PropertyLine` (no `MatrixPropertyLine`
 * exists in the shared Fluent set yet). Each cell is a Fluent `SpinButton`.
 * @returns The rendered matrix editor.
 */
export const MatrixEditor: React.FunctionComponent<{ value: Matrix; onChange: (value: Matrix) => void }> = ({ value, onChange }) => {
    const classes = useMatrixStyles();
    // `Matrix.asArray()` returns a Float32Array. `Float32Array.prototype.map` is
    // type-preserving, so we convert to a plain array before iterating to render JSX.
    const data = Array.from(value.asArray());
    return (
        <div className={classes.container}>
            {data.map((cell, i) => (
                <SpinButton
                    key={i}
                    className={classes.cell}
                    value={cell}
                    step={0.1}
                    onChange={(next) => {
                        if (Number.isFinite(next)) {
                            const arr = Array.from(value.asArray());
                            arr[i] = next;
                            onChange(Matrix.FromArray(arr));
                        }
                    }}
                />
            ))}
        </div>
    );
};

/** Default property panel for any FlowGraph block. */
export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        return (
            <Accordion uniqueId="FlowGraphNodeProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}
                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}

/**
 * AccordionSection wrappers for the reusable subpanels.
 *
 * Why these are functions (not components): the shared `<Accordion>` discovers its
 * sections by iterating children and looking for elements with a `title` prop. A
 * wrapping React component (function or class) would be a single child with no
 * `title`, so the Accordion would skip it. Calling these as `{RenderGeneralSection(props)}`
 * yields the `<AccordionSection>` element directly into the children array.
 * @param props - The property component props.
 * @returns The rendered "General" AccordionSection.
 */
export function RenderGeneralSection(props: IPropertyComponentProps): JSX.Element {
    return (
        <AccordionSection key="general" title="General" collapseByDefault={false}>
            <GeneralPropertyTabComponent {...props} />
        </AccordionSection>
    );
}

/**
 * @param props - The property component props.
 * @returns The "Construction Variables" AccordionSection, or `null` if the block has no constructor config fields.
 */
export function RenderConstructorVariablesSection(props: IPropertyComponentProps): JSX.Element | null {
    const block = props.nodeData.data as FlowGraphBlock;
    const fields = CONSTRUCTOR_CONFIG.get(block.getClassName());
    if (!fields || fields.length === 0) {
        return null;
    }
    return (
        <AccordionSection key="ctor" title="Construction Variables" collapseByDefault={false}>
            <ConstructorVariablesPropertyTabComponent {...props} />
        </AccordionSection>
    );
}

/**
 * @param props - The property component props.
 * @returns The "Input Values" AccordionSection, or `null` if the block has no editable data inputs.
 */
export function RenderDataConnectionsSection(props: IPropertyComponentProps): JSX.Element | null {
    const block = props.nodeData.data as FlowGraphBlock;
    const editableInputs = block.dataInputs.filter((conn) => IsPrimitiveEditableInput(conn, block));
    if (editableInputs.length === 0) {
        return null;
    }
    return (
        <AccordionSection key="inputs" title="Input Values" collapseByDefault={false}>
            <DataConnectionsPropertyTabComponent {...props} />
        </AccordionSection>
    );
}

/**
 * Returns a flat array of `<AccordionSection>` elements — one per editable group declared
 * via the `editableInPropertyPage` decorator on the block. Each section delegates to
 * `<GenericPropertyTabComponent>` filtered to that group.
 * @param props - The property component props.
 * @returns Array of AccordionSection elements (one per editable group).
 */
export function RenderGenericPropStoreSections(props: IPropertyComponentProps): JSX.Element[] {
    const block = props.nodeData.data as FlowGraphBlock;
    const propStore = (block as any)._propStore as IPropertyDescriptionForEdition[] | undefined;
    if (!propStore) {
        return [];
    }
    // Match the class-walk filter inside GenericPropertyTabComponent so we only
    // collect groups that will actually render at least one entry.
    const classes: string[] = [];
    let proto = Object.getPrototypeOf(block);
    while (proto && proto.getClassName) {
        classes.push(proto.getClassName());
        proto = Object.getPrototypeOf(proto);
    }
    const groupOrder: string[] = [];
    const seen = new Set<string>();
    for (const entry of propStore) {
        if (classes.indexOf(entry.className) === -1) {
            continue;
        }
        if (!seen.has(entry.groupName)) {
            seen.add(entry.groupName);
            groupOrder.push(entry.groupName);
        }
    }
    return groupOrder.map((group) => (
        <AccordionSection key={`group-${group}`} title={group} collapseByDefault={false}>
            <GenericPropertyTabComponent {...props} groupFilter={group} />
        </AccordionSection>
    ));
}

/** Renders the "GENERAL" section (Name, Type, Comments) for any block. */
export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;

        return (
            <>
                <TextInputPropertyLine
                    label="Name"
                    value={(block as any).name ?? this.props.nodeData.name}
                    onChange={(value) => {
                        (block as any).name = value;
                        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                        this.forceUpdate();
                    }}
                />
                <TextPropertyLine label="Type" value={FlowGraphBlockDisplayName(block.getClassName())} />
                <TextAreaPropertyLine
                    label="Comments"
                    value={(block as any).comments ?? ""}
                    onChange={(value) => {
                        (block as any).comments = value;
                        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                        this.forceUpdate();
                    }}
                />
            </>
        );
    }
}

/**
 * Renders the "CONSTRUCTION VARIABLES" section for any block that has
 * constructor-configurable fields (e.g. the `type` pin-type selector on math
 * blocks like FlowGraphAddBlock).
 *
 * The set of configurable fields per block class is defined in
 * constructorConfigRegistry.ts, keeping all editor-specific knowledge out of
 * core.
 */
export class ConstructorVariablesPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    /**
     * Applies a change to a constructor config field.
     * Always writes to block.config so serialization picks it up.
     * When affectsPortTypes is true the richType on every data connection is
     * updated immediately so port colours refresh without reloading the graph.
     * @param block - The block whose config should be updated.
     * @param key - The config property key.
     * @param value - The new value.
     * @param affectsPortTypes - Whether to also update the block's port richTypes.
     */
    private _updateConfig(block: FlowGraphBlock, key: string, value: any, affectsPortTypes?: boolean): void {
        if (!block.config) {
            (block as any).config = {};
        }
        // block.config is guaranteed non-null by the guard above;
        // the cast is needed because TypeScript loses narrowing through (block as any).
        (block.config as Record<string, any>)[key] = value;

        if (affectsPortTypes) {
            const richType = getRichTypeByFlowGraphType(value as string);
            for (const conn of [...block.dataInputs, ...block.dataOutputs]) {
                (conn as any).richType = richType;
            }
        }

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
    }

    /**
     * Gathers all variable names currently defined across the flow graph
     * (from GetVariable/SetVariable blocks and context user variables).
     * Excludes the variable owned by the given block to avoid self-reference.
     * @param excludeBlock - The block to exclude from the scan.
     * @returns Sorted array of variable names.
     */
    private _getExistingVariableNames(excludeBlock: FlowGraphBlock): string[] {
        const globalState = this.props.stateManager.data as GlobalState;
        const fg = globalState.flowGraph;
        if (!fg) {
            return [];
        }
        return GatherVariableNames(fg, excludeBlock);
    }

    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;
        const fields = CONSTRUCTOR_CONFIG.get(block.getClassName());

        if (!fields || fields.length === 0) {
            return <></>;
        }

        return (
            <>
                {fields.map((field) => {
                    const currentVal = block.config ? block.config[field.key] : undefined;

                    if (field.kind === "boolean") {
                        return (
                            <SwitchPropertyLine
                                key={field.key}
                                label={field.label}
                                value={!!(block.config && block.config[field.key])}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "number") {
                        return (
                            <NumberInputPropertyLine
                                key={field.key}
                                label={field.label}
                                value={typeof currentVal === "number" ? currentVal : 0}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "integer") {
                        const intVal = currentVal instanceof FlowGraphInteger ? currentVal.value : typeof currentVal === "number" ? currentVal : 0;
                        return (
                            <NumberInputPropertyLine
                                key={field.key}
                                label={field.label}
                                value={intVal}
                                step={1}
                                onChange={(v) => this._updateConfig(block, field.key, new FlowGraphInteger(v | 0))}
                            />
                        );
                    }

                    if (field.kind === "flowgraph-type") {
                        const options: DropdownOption<string>[] = FLOW_GRAPH_TYPE_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value }));
                        const value = block.config && block.config[field.key] != null ? (block.config[field.key] as string) : "any";
                        return (
                            <StringDropdownPropertyLine
                                key={`${field.key}-${block.uniqueId}`}
                                label={field.label}
                                options={options}
                                value={value}
                                onChange={(v) => this._updateConfig(block, field.key, v, field.affectsPortTypes)}
                            />
                        );
                    }

                    if (field.kind === "string") {
                        return (
                            <TextInputPropertyLine
                                key={field.key}
                                label={field.label}
                                value={typeof currentVal === "string" ? currentVal : ""}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "options" && field.options) {
                        const options: DropdownOption<string>[] = field.options.map((opt) => ({ label: opt.label, value: opt.value }));
                        const value = block.config && block.config[field.key] != null ? (block.config[field.key] as string) : (options[0]?.value ?? "");
                        return (
                            <StringDropdownPropertyLine
                                key={`${field.key}-${block.uniqueId}`}
                                label={field.label}
                                options={options}
                                value={value}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "variable-picker") {
                        const existingVars = this._getExistingVariableNames(block);
                        const options: DropdownOption<string>[] = existingVars.map((name) => ({ label: name, value: name }));
                        return (
                            <ComboBoxPropertyLine
                                key={`${field.key}-${block.uniqueId}`}
                                label={field.label}
                                value={typeof currentVal === "string" ? currentVal : ""}
                                options={options}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    return null;
                })}
            </>
        );
    }
}

/**
 * Renders editable fields for all primitive-valued unconnected data-input connections of any block.
 * This makes it possible to set fixed values (like a property name) directly in the right panel
 * without requiring a connected input port.
 */
export class DataConnectionsPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    /**
     * Updates the default value of a data connection and keeps block.config in sync.
     * @param conn - The data connection to update.
     * @param value - The new value to set.
     */
    private _setDefaultValue(conn: FlowGraphDataConnection<any>, value: any) {
        const block = this.props.nodeData.data as FlowGraphBlock;
        // Update the DataConnection's internal default value
        (conn as any)._defaultValue = value;
        // Keep block.config in sync so serialization picks it up
        if (block.config) {
            (block.config as any)[conn.name] = value;
        }
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
    }

    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;
        const editableInputs = block.dataInputs.filter((conn) => IsPrimitiveEditableInput(conn, block));

        if (editableInputs.length === 0) {
            return <></>;
        }

        return (
            <>
                {editableInputs.map((conn) => {
                    const def = (conn as any)._defaultValue;
                    const typeName = conn.richType.typeName;
                    const connected = conn.isConnected();
                    const label = connected ? `${conn.name} (connected)` : conn.name;

                    // Boolean
                    if (typeName === "boolean" || typeof def === "boolean") {
                        return <SwitchPropertyLine key={conn.name} label={label} value={(conn as any)._defaultValue === true} onChange={(v) => this._setDefaultValue(conn, v)} />;
                    }

                    // FlowGraphInteger
                    if (def instanceof FlowGraphInteger || typeName === "FlowGraphInteger") {
                        const intVal = def instanceof FlowGraphInteger ? def.value : 0;
                        return (
                            <NumberInputPropertyLine
                                key={conn.name}
                                label={label}
                                value={intVal}
                                step={1}
                                onChange={(v) => this._setDefaultValue(conn, new FlowGraphInteger(v | 0))}
                            />
                        );
                    }

                    // Number
                    if (typeName === "number" || typeof def === "number") {
                        return <NumberInputPropertyLine key={conn.name} label={label} value={typeof def === "number" ? def : 0} onChange={(v) => this._setDefaultValue(conn, v)} />;
                    }

                    // Vector2
                    if (typeName === "Vector2") {
                        const current = def instanceof Vector2 ? def : Vector2.Zero();
                        return <Vector2PropertyLine key={conn.name} label={label} value={current} onChange={(v) => this._setDefaultValue(conn, v.clone())} />;
                    }

                    // Vector3
                    if (typeName === "Vector3") {
                        const current = def instanceof Vector3 ? def : Vector3.Zero();
                        return <Vector3PropertyLine key={conn.name} label={label} value={current} onChange={(v) => this._setDefaultValue(conn, v.clone())} />;
                    }

                    // Vector4
                    if (typeName === "Vector4") {
                        const current = def instanceof Vector4 ? def : Vector4.Zero();
                        return <Vector4PropertyLine key={conn.name} label={label} value={current} onChange={(v) => this._setDefaultValue(conn, v.clone())} />;
                    }

                    // Color3
                    if (typeName === "Color3") {
                        const current = def instanceof Color3 ? def : new Color3(0, 0, 0);
                        return <Color3PropertyLine key={conn.name} label={label} value={current} onChange={(v) => this._setDefaultValue(conn, v.clone())} />;
                    }

                    // Color4
                    if (typeName === "Color4") {
                        const current = def instanceof Color4 ? def : new Color4(0, 0, 0, 1);
                        return <Color4PropertyLine key={conn.name} label={label} value={current} onChange={(v) => this._setDefaultValue(conn, v.clone())} />;
                    }

                    // Matrix — no shared MatrixPropertyLine yet, use a small inline editor.
                    if (typeName === "Matrix") {
                        const current = def instanceof Matrix ? def : Matrix.Identity();
                        return (
                            <PropertyLine key={conn.name} label={label}>
                                <MatrixEditor value={current} onChange={(v) => this._setDefaultValue(conn, v)} />
                            </PropertyLine>
                        );
                    }

                    // String (default — also covers RichTypeAny with string default)
                    return (
                        <TextInputPropertyLine
                            key={conn.name}
                            label={label}
                            value={typeof def === "string" ? def : ""}
                            disabled={connected}
                            onChange={(v) => this._setDefaultValue(conn, v)}
                        />
                    );
                })}
            </>
        );
    }
}

/** Renders properties registered via the `editableInPropertyPage` decorator on any block. */
export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps & { groupFilter?: string }> {
    constructor(props: IPropertyComponentProps & { groupFilter?: string }) {
        super(props);
    }

    private _getValue(block: any, propertyName: string): any {
        return block[propertyName];
    }

    private _setValue(block: any, propertyName: string, value: any, options: any) {
        block[propertyName] = value;
        ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers);
        this.forceUpdate();
    }

    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock,
            propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

        if (!propStore) {
            return <></>;
        }

        const componentList: { [groupName: string]: JSX.Element[] } = {},
            groups: string[] = [];

        const classes: string[] = [];

        let proto = Object.getPrototypeOf(block);
        while (proto && proto.getClassName) {
            classes.push(proto.getClassName());
            proto = Object.getPrototypeOf(proto);
        }

        for (const { propertyName, displayName, type, groupName, options, className } of propStore) {
            let components = componentList[groupName];

            if (classes.indexOf(className) === -1) {
                continue;
            }

            if (!components) {
                components = [];
                componentList[groupName] = components;
                groups.push(groupName);
            }

            switch (type) {
                case PropertyTypeForEdition.Boolean: {
                    components.push(
                        <SwitchPropertyLine
                            key={`switch-${propertyName}`}
                            label={displayName}
                            value={!!this._getValue(block, propertyName)}
                            onChange={(v) => this._setValue(block, propertyName, v, options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <NumberInputPropertyLine
                                key={`float-${propertyName}`}
                                label={displayName}
                                value={Number(this._getValue(block, propertyName) ?? 0)}
                                onChange={(v) => this._setValue(block, propertyName, v, options)}
                            />
                        );
                    } else {
                        components.push(
                            <SyncedSliderPropertyLine
                                key={`slider-${propertyName}`}
                                label={displayName}
                                value={Number(this._getValue(block, propertyName) ?? 0)}
                                min={Math.min(options.min as number, options.max as number)}
                                max={options.max as number}
                                step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                                onChange={(v) => this._setValue(block, propertyName, v, options)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <NumberInputPropertyLine
                                key={`int-${propertyName}`}
                                label={displayName}
                                value={Number(this._getValue(block, propertyName) ?? 0)}
                                step={1}
                                onChange={(v) => this._setValue(block, propertyName, v | 0, options)}
                            />
                        );
                    } else {
                        components.push(
                            <SyncedSliderPropertyLine
                                key={`slider-${propertyName}`}
                                label={displayName}
                                value={Number(this._getValue(block, propertyName) ?? 0)}
                                min={Math.min(options.min as number, options.max as number)}
                                max={options.max as number}
                                step={1}
                                onChange={(v) => this._setValue(block, propertyName, v | 0, options)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    const current = (this._getValue(block, propertyName) as Vector2) ?? Vector2.Zero();
                    components.push(
                        <Vector2PropertyLine
                            key={`vector2-${propertyName}`}
                            label={displayName}
                            value={current}
                            onChange={(v) => this._setValue(block, propertyName, v.clone(), options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Vector3: {
                    const current = (this._getValue(block, propertyName) as Vector3) ?? Vector3.Zero();
                    components.push(
                        <Vector3PropertyLine
                            key={`vector3-${propertyName}`}
                            label={displayName}
                            value={current}
                            onChange={(v) => this._setValue(block, propertyName, v.clone(), options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    const opts: DropdownOption<string>[] = (options.options as IEditablePropertyListOption[]).map((opt) => ({ label: opt.label, value: String(opt.value) }));
                    components.push(
                        <StringDropdownPropertyLine
                            key={`options-${propertyName}`}
                            label={displayName}
                            options={opts}
                            value={String(this._getValue(block, propertyName) ?? opts[0]?.value ?? "")}
                            onChange={(v) => this._setValue(block, propertyName, v, options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color3: {
                    const current = (this._getValue(block, propertyName) as Color3) ?? new Color3(0, 0, 0);
                    components.push(
                        <Color3PropertyLine
                            key={`color3-${propertyName}`}
                            label={displayName}
                            value={current}
                            onChange={(v) => this._setValue(block, propertyName, v.clone(), options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color4: {
                    const current = (this._getValue(block, propertyName) as Color4) ?? new Color4(0, 0, 0, 1);
                    components.push(
                        <Color4PropertyLine
                            key={`color4-${propertyName}`}
                            label={displayName}
                            value={current}
                            onChange={(v) => this._setValue(block, propertyName, v.clone(), options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.String: {
                    components.push(
                        <TextInputPropertyLine
                            key={`string-${propertyName}`}
                            label={displayName}
                            value={String(this._getValue(block, propertyName) ?? "")}
                            onChange={(v) => this._setValue(block, propertyName, v, options)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Matrix: {
                    const current = (this._getValue(block, propertyName) as Matrix) ?? Matrix.Identity();
                    components.push(
                        <PropertyLine key={`matrix-${propertyName}`} label={displayName}>
                            <MatrixEditor value={current} onChange={(v) => this._setValue(block, propertyName, v, options)} />
                        </PropertyLine>
                    );
                    break;
                }
            }
        }

        return (
            <>
                {groups.map((group) => {
                    if (this.props.groupFilter !== undefined && group !== this.props.groupFilter) {
                        return null;
                    }
                    return <React.Fragment key={`group-${group}`}>{componentList[group]}</React.Fragment>;
                })}
            </>
        );
    }
}
