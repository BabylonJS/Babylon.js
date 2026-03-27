import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { MatrixLineComponent } from "shared-ui-components/lines/matrixLineComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { FlowGraphConstantBlock } from "core/FlowGraph/Blocks/Data/flowGraphConstantBlock";
import { getRichTypeFromValue } from "core/FlowGraph/flowGraphRichTypes";
import { FlowGraphInteger } from "core/FlowGraph/CustomTypes/flowGraphInteger";
import { Vector2, Vector3, Vector4, Quaternion, Matrix } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";

const ValueTypeOptions = [
    { label: "Number", value: "number" },
    { label: "Integer", value: "FlowGraphInteger" },
    { label: "Boolean", value: "boolean" },
    { label: "String", value: "string" },
    { label: "Vector2", value: "Vector2" },
    { label: "Vector3", value: "Vector3" },
    { label: "Vector4", value: "Vector4" },
    { label: "Quaternion", value: "Quaternion" },
    { label: "Color3", value: "Color3" },
    { label: "Color4", value: "Color4" },
    { label: "Matrix", value: "Matrix" },
];

function DetectValueType(value: any): string {
    if (value instanceof FlowGraphInteger) {
        return "FlowGraphInteger";
    }
    if (typeof value === "number") {
        return "number";
    }
    if (typeof value === "boolean") {
        return "boolean";
    }
    if (typeof value === "string") {
        return "string";
    }
    if (value instanceof Color4) {
        return "Color4";
    } // check before Color3 since Color4 extends Color3
    if (value instanceof Color3) {
        return "Color3";
    }
    if (value instanceof Quaternion) {
        return "Quaternion";
    } // check before Vector4
    if (value instanceof Vector4) {
        return "Vector4";
    }
    if (value instanceof Vector3) {
        return "Vector3";
    }
    if (value instanceof Vector2) {
        return "Vector2";
    }
    if (value instanceof Matrix) {
        return "Matrix";
    }
    return "number";
}

function CreateDefaultValue(typeName: string): any {
    switch (typeName) {
        case "number":
            return 0;
        case "FlowGraphInteger":
            return new FlowGraphInteger(0);
        case "boolean":
            return false;
        case "string":
            return "";
        case "Vector2":
            return Vector2.Zero();
        case "Vector3":
            return Vector3.Zero();
        case "Vector4":
            return Vector4.Zero();
        case "Quaternion":
            return Quaternion.Identity();
        case "Color3":
            return Color3.Black();
        case "Color4":
            return new Color4(0, 0, 0, 1);
        case "Matrix":
            return Matrix.Identity();
        default:
            return 0;
    }
}

/**
 * Property panel for FlowGraphConstantBlock.
 * Shows a type selector and a value editor that adapts to the current type.
 */
export class ConstantBlockPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    private _getBlock(): FlowGraphConstantBlock<any> {
        return this.props.nodeData.data as FlowGraphConstantBlock<any>;
    }

    private _updateValue(newValue: any) {
        const block = this._getBlock();
        block.config.value = newValue;
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _changeType(newTypeName: string) {
        const block = this._getBlock();
        const newValue = CreateDefaultValue(newTypeName);
        block.config.value = newValue;

        // Update the output port's rich type so downstream connections see the new type.
        const output = block.getDataOutput("output");
        if (output) {
            (output as any).richType = getRichTypeFromValue(newValue);
        }

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    private _renderValueEditor(value: any): JSX.Element | null {
        const lock = this.props.stateManager.lockObject;
        const block = this._getBlock();
        const notify = () => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);

        if (typeof value === "boolean") {
            return <CheckBoxLineComponent label="Value" isSelected={() => block.config.value === true} onSelect={(v) => this._updateValue(v)} />;
        }

        if (value instanceof FlowGraphInteger) {
            const proxy = { v: value.value };
            return (
                <FloatLineComponent
                    label="Value"
                    lockObject={lock}
                    digits={0}
                    step={"1"}
                    isInteger={true}
                    target={proxy}
                    propertyName="v"
                    onChange={(v) => this._updateValue(new FlowGraphInteger(v))}
                />
            );
        }

        if (typeof value === "number") {
            const proxy = { v: value };
            return <FloatLineComponent label="Value" lockObject={lock} target={proxy} propertyName="v" onChange={(v) => this._updateValue(v)} />;
        }

        if (typeof value === "string") {
            const proxy = { v: value };
            return (
                <TextInputLineComponent
                    label="Value"
                    lockObject={lock}
                    target={proxy}
                    propertyName="v"
                    throttlePropertyChangedNotification={true}
                    onChange={(v) => this._updateValue(v)}
                />
            );
        }

        if (value instanceof Vector2) {
            return <Vector2LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Vector3 && !(value instanceof Vector4) && !(value instanceof Quaternion)) {
            return <Vector3LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        // Color3 before Vector3 subclasses since Color3/4 have dedicated editors
        if (value instanceof Color4) {
            return <Color4LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Color3) {
            return <Color3LineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        if (value instanceof Matrix) {
            return <MatrixLineComponent label="Value" lockObject={lock} target={block.config} propertyName="value" onChange={notify} />;
        }

        // Fallback: show the type name for uneditable types (Vector4, Quaternion)
        return <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>Cannot edit {DetectValueType(value)} inline.</div>;
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const block = this._getBlock();
        const value = block.config.value;
        const currentType = DetectValueType(value);

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="CONSTANT VALUE">
                    <OptionsLine
                        key={`type-${block.uniqueId}`}
                        label="Type"
                        options={ValueTypeOptions}
                        target={{}}
                        propertyName="_unused"
                        valuesAreStrings={true}
                        noDirectUpdate={true}
                        extractValue={() => currentType}
                        onSelect={(v) => this._changeType(v as string)}
                    />
                    {this._renderValueEditor(value)}
                </LineContainerComponent>
            </>
        );
    }
}
