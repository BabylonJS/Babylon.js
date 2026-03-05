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
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import type { IEditablePropertyListOption, IPropertyDescriptionForEdition } from "core/Decorators/nodeDecorator";
import { PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { ForceRebuild } from "shared-ui-components/nodeGraphSystem/automaticProperties";

/** Primitive types that can be shown as editable fields in the right panel. */
const PRIMITIVE_FG_TYPES = new Set(["string", "number", "boolean", "FlowGraphInteger"]);

/**
 * Returns true if the given connection should be shown as an editable field.
 * Shows: unconnected inputs whose default value is a string, number, boolean, or FlowGraphInteger,
 *        OR whose rich type is one of those primitives (even if the current default is undefined).
 * @param conn The data connection to test.
 * @returns True if the connection should be shown as an editable field.
 */
function IsPrimitiveEditableInput(conn: FlowGraphDataConnection<any>): boolean {
    if (conn.isConnected()) {
        return false;
    }
    const def = (conn as any)._defaultValue;
    if (def instanceof FlowGraphInteger) {
        return true;
    }
    const defType = typeof def;
    if (defType === "string" || defType === "number" || defType === "boolean") {
        return true;
    }
    // No value yet, but the richType declares a primitive — still show it
    return PRIMITIVE_FG_TYPES.has(conn.richType.typeName);
}

/** Default property panel for any FlowGraph block. */
export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    /** {@inheritDoc} */
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    /** {@inheritDoc} */
    override render() {
        return (
            <>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <DataConnectionsPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </>
        );
    }
}

/** Renders the "GENERAL" section (Name, Type, Comments) for any block. */
export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    /** {@inheritDoc} */
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    /** {@inheritDoc} */
    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;

        return (
            <>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent
                        label="Name"
                        propertyName="name"
                        target={block}
                        lockObject={this.props.stateManager.lockObject}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                        validator={() => {
                            return true;
                        }}
                    />
                    <TextLineComponent label="Type" value={block.getClassName()} />
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
 * Renders editable fields for all primitive-valued unconnected data-input connections of any block.
 * This makes it possible to set fixed values (like a property name) directly in the right panel
 * without requiring a connected input port.
 */
export class DataConnectionsPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    /** {@inheritDoc} */
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

    /** {@inheritDoc} */
    override render() {
        const block = this.props.nodeData.data as FlowGraphBlock;
        const editableInputs = block.dataInputs.filter(IsPrimitiveEditableInput);

        if (editableInputs.length === 0) {
            return <></>;
        }

        return (
            <LineContainerComponent title="INPUT VALUES">
                {editableInputs.map((conn) => {
                    const def = (conn as any)._defaultValue;
                    const typeName = conn.richType.typeName;
                    const label = conn.name;

                    // Boolean
                    if (typeName === "boolean" || typeof def === "boolean") {
                        return (
                            <CheckBoxLineComponent
                                key={label}
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
                                key={label}
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
                                key={label}
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
                            key={label}
                            label={label}
                            lockObject={this.props.stateManager.lockObject}
                            target={proxy}
                            propertyName="v"
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
    /** {@inheritDoc} */
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    /** {@inheritDoc} */
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
