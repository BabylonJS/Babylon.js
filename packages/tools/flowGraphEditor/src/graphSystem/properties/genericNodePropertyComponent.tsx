import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { MatrixLineComponent } from "shared-ui-components/lines/matrixLineComponent";
import { Vector4LineComponent } from "shared-ui-components/lines/vector4LineComponent";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import type { IEditablePropertyListOption, IPropertyDescriptionForEdition } from "core/Decorators/nodeDecorator";
import { PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { ForceRebuild } from "shared-ui-components/nodeGraphSystem/automaticProperties";
import { EDITABLE_INPUTS } from "./editableInputsRegistry";
import { CONSTRUCTOR_CONFIG, FLOW_GRAPH_TYPE_OPTIONS } from "./constructorConfigRegistry";
import { getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes";
import { Vector2 } from "core/Maths/math.vector";
import { Vector3 } from "core/Maths/math.vector";
import { Vector4 } from "core/Maths/math.vector";
import { Matrix } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { FlowGraphBlockDisplayName } from "../blockDisplayUtils";

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

/** Default property panel for any FlowGraph block. */
export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        return (
            <>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <ConstructorVariablesPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <DataConnectionsPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </>
        );
    }
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
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent
                        label="Name"
                        propertyName="name"
                        target={block}
                        value={this.props.nodeData.name}
                        lockObject={this.props.stateManager.lockObject}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                        validator={() => {
                            return true;
                        }}
                    />
                    <TextLineComponent label="Type" value={FlowGraphBlockDisplayName(block.getClassName())} />
                    <TextInputLineComponent
                        label="Comments"
                        multilines={true}
                        lockObject={this.props.stateManager.lockObject}
                        value={(block as any).comments || ""}
                        target={block}
                        propertyName="comments"
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                    />
                </LineContainerComponent>
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

    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;
        const fields = CONSTRUCTOR_CONFIG.get(block.getClassName());

        if (!fields || fields.length === 0) {
            return <></>;
        }

        return (
            <LineContainerComponent title="CONSTRUCTION VARIABLES">
                {fields.map((field) => {
                    const currentVal = block.config ? block.config[field.key] : undefined;

                    if (field.kind === "boolean") {
                        return (
                            <CheckBoxLineComponent
                                key={field.key}
                                label={field.label}
                                isSelected={() => !!(block.config && block.config[field.key])}
                                onSelect={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "number") {
                        const proxy = { v: typeof currentVal === "number" ? currentVal : 0 };
                        return (
                            <FloatLineComponent
                                key={field.key}
                                label={field.label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "integer") {
                        const intVal = currentVal instanceof FlowGraphInteger ? currentVal.value : typeof currentVal === "number" ? currentVal : 0;
                        const proxy = { v: intVal };
                        return (
                            <FloatLineComponent
                                key={field.key}
                                label={field.label}
                                lockObject={this.props.stateManager.lockObject}
                                digits={0}
                                step={"1"}
                                isInteger={true}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._updateConfig(block, field.key, new FlowGraphInteger(v))}
                            />
                        );
                    }

                    if (field.kind === "flowgraph-type") {
                        // OptionsLine with valuesAreStrings + noDirectUpdate lets us
                        // control the update ourselves while still benefiting from the
                        // component's stateful re-render on selection.
                        const configProxy = block.config ?? {};
                        return (
                            <OptionsLine
                                key={`${field.key}-${block.uniqueId}`}
                                label={field.label}
                                options={FLOW_GRAPH_TYPE_OPTIONS}
                                valuesAreStrings={true}
                                noDirectUpdate={true}
                                target={configProxy}
                                propertyName={field.key}
                                extractValue={() => (block.config && block.config[field.key] != null ? (block.config[field.key] as string) : "any")}
                                onSelect={(v) => this._updateConfig(block, field.key, v as string, field.affectsPortTypes)}
                            />
                        );
                    }

                    if (field.kind === "string") {
                        const proxy = { v: typeof currentVal === "string" ? currentVal : "" };
                        return (
                            <TextInputLineComponent
                                key={field.key}
                                label={field.label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                throttlePropertyChangedNotification={true}
                                onChange={(v) => this._updateConfig(block, field.key, v)}
                            />
                        );
                    }

                    if (field.kind === "options" && field.options) {
                        const configProxy = block.config ?? {};
                        return (
                            <OptionsLine
                                key={`${field.key}-${block.uniqueId}`}
                                label={field.label}
                                options={field.options}
                                valuesAreStrings={true}
                                noDirectUpdate={true}
                                target={configProxy}
                                propertyName={field.key}
                                extractValue={() => (block.config && block.config[field.key] != null ? (block.config[field.key] as string) : (field.options![0]?.value ?? ""))}
                                onSelect={(v) => this._updateConfig(block, field.key, v as string)}
                            />
                        );
                    }

                    return null;
                })}
            </LineContainerComponent>
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
            <LineContainerComponent title="INPUT VALUES">
                {editableInputs.map((conn) => {
                    const def = (conn as any)._defaultValue;
                    const typeName = conn.richType.typeName;
                    const connected = conn.isConnected();
                    const label = connected ? `${conn.name} (connected)` : conn.name;

                    // Boolean
                    if (typeName === "boolean" || typeof def === "boolean") {
                        return (
                            <CheckBoxLineComponent
                                key={conn.name}
                                label={label}
                                isSelected={() => (conn as any)._defaultValue === true}
                                onSelect={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // FlowGraphInteger
                    if (def instanceof FlowGraphInteger || typeName === "FlowGraphInteger") {
                        const intVal = def instanceof FlowGraphInteger ? def.value : 0;
                        const proxy = { v: intVal };
                        return (
                            <FloatLineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                digits={0}
                                step={"1"}
                                isInteger={true}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, new FlowGraphInteger(v))}
                            />
                        );
                    }

                    // Number
                    if (typeName === "number" || typeof def === "number") {
                        const proxy = { v: typeof def === "number" ? def : 0 };
                        return (
                            <FloatLineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // Vector2
                    if (typeName === "Vector2") {
                        const proxy = { v: def instanceof Vector2 ? def.clone() : Vector2.Zero() };
                        return (
                            <Vector2LineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // Vector3
                    if (typeName === "Vector3") {
                        const proxy = { v: def instanceof Vector3 ? def.clone() : Vector3.Zero() };
                        return (
                            <Vector3LineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // Vector4
                    if (typeName === "Vector4") {
                        const proxy = { v: def instanceof Vector4 ? def.clone() : Vector4.Zero() };
                        return (
                            <Vector4LineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // Color3
                    if (typeName === "Color3") {
                        const proxy = { v: def instanceof Color3 ? def.clone() : new Color3(0, 0, 0) };
                        return (
                            <Color3LineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={() => this._setDefaultValue(conn, proxy.v)}
                            />
                        );
                    }

                    // Color4
                    if (typeName === "Color4") {
                        const proxy = { v: def instanceof Color4 ? def.clone() : new Color4(0, 0, 0, 1) };
                        return (
                            <Color4LineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={() => this._setDefaultValue(conn, proxy.v)}
                            />
                        );
                    }

                    // Matrix
                    if (typeName === "Matrix") {
                        const proxy = { v: def instanceof Matrix ? def.clone() : Matrix.Identity() };
                        return (
                            <MatrixLineComponent
                                key={conn.name}
                                label={label}
                                lockObject={this.props.stateManager.lockObject}
                                target={proxy}
                                propertyName="v"
                                onChange={(v) => this._setDefaultValue(conn, v)}
                            />
                        );
                    }

                    // String (default — also covers RichTypeAny with string default)
                    const proxy = { v: typeof def === "string" ? def : "" };
                    return (
                        <TextInputLineComponent
                            key={conn.name}
                            label={label}
                            lockObject={this.props.stateManager.lockObject}
                            target={proxy}
                            propertyName="v"
                            disabled={connected}
                            throttlePropertyChangedNotification={true}
                            onChange={(v) => this._setDefaultValue(conn, v)}
                        />
                    );
                })}
            </LineContainerComponent>
        );
    }
}

/** Renders properties registered via the `editableInPropertyPage` decorator on any block. */
export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
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
                        <CheckBoxLineComponent
                            key={`checkBox-${propertyName}`}
                            label={displayName}
                            target={block}
                            propertyName={propertyName}
                            onValueChanged={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent
                                key={`float-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                key={`slider-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent
                                key={`int-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                digits={0}
                                step={"1"}
                                isInteger={true}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                key={`slider-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                decimalCount={0}
                                step={1}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    components.push(
                        <Vector2LineComponent
                            key={`vector2-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Vector3: {
                    components.push(
                        <Vector3LineComponent
                            key={`vector3-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    components.push(
                        <OptionsLine
                            key={`options-${propertyName}`}
                            label={displayName}
                            options={options.options as IEditablePropertyListOption[]}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color3: {
                    components.push(
                        <Color3LineComponent
                            key={`color3-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color4: {
                    components.push(
                        <Color4LineComponent
                            key={`color4-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.String: {
                    components.push(
                        <TextInputLineComponent
                            key={`string-${propertyName}`}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            throttlePropertyChangedNotification={true}
                            throttlePropertyChangedNotificationDelay={1000}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Matrix: {
                    components.push(
                        <MatrixLineComponent
                            key={`matrix-${propertyName}`}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
            }
        }

        return (
            <>
                {groups.map((group) => (
                    <LineContainerComponent key={`group-${group}`} title={group}>
                        {componentList[group]}
                    </LineContainerComponent>
                ))}
            </>
        );
    }
}
