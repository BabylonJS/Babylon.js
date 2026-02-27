import * as React from "react";
import type { GlobalState } from "../../globalState";
import { FloatPropertyTabComponent } from "../../components/propertyTab/properties/floatPropertyTabComponent";
import { Vector2PropertyTabComponent } from "../../components/propertyTab/properties/vector2PropertyTabComponent";
import { Color3PropertyTabComponent } from "../../components/propertyTab/properties/color3PropertyTabComponent";
import { Vector3PropertyTabComponent } from "../../components/propertyTab/properties/vector3PropertyTabComponent";
import { Vector4PropertyTabComponent } from "../../components/propertyTab/properties/vector4PropertyTabComponent";
import { MatrixPropertyTabComponent } from "../../components/propertyTab/properties/matrixPropertyTabComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { AnimatedInputBlockTypes } from "core/Materials/Node/Blocks/Input/animatedInputBlockTypes";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { GetGeneralProperties } from "./genericNodePropertyComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { Color4PropertyTabComponent } from "../../components/propertyTab/properties/color4PropertyTabComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { PropertyTabComponentBase } from "shared-ui-components/components/propertyTabComponentBase";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<InputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        const inputBlock = this.props.nodeData.data as InputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
        });
    }

    override componentWillUnmount() {
        const inputBlock = this.props.nodeData.data as InputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(globalState: GlobalState) {
        const inputBlock = this.props.nodeData.data as InputBlock;
        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(inputBlock.min) || isNaN(inputBlock.max) || inputBlock.min === inputBlock.max;
                return (
                    <>
                        <CheckBoxLineComponent label="Is boolean" target={inputBlock} propertyName="isBoolean" />
                        {inputBlock.isBoolean && (
                            <CheckBoxLineComponent
                                label="Value"
                                isSelected={() => {
                                    return inputBlock.value === 1;
                                }}
                                onSelect={(value) => {
                                    inputBlock.value = value ? 1 : 0;
                                    if (inputBlock.isConstant) {
                                        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                    }
                                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                }}
                            />
                        )}
                        {!inputBlock.isBoolean && (
                            <FloatLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label="Min"
                                target={inputBlock}
                                propertyName="min"
                                onChange={() => {
                                    if (inputBlock.value < inputBlock.min) {
                                        inputBlock.value = inputBlock.min;
                                        if (inputBlock.isConstant) {
                                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                        }
                                    }
                                    this.forceUpdate();
                                }}
                            ></FloatLineComponent>
                        )}
                        {!inputBlock.isBoolean && (
                            <FloatLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label="Max"
                                target={inputBlock}
                                propertyName="max"
                                onChange={() => {
                                    if (inputBlock.value > inputBlock.max) {
                                        inputBlock.value = inputBlock.max;
                                        if (inputBlock.isConstant) {
                                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                        }
                                    }
                                    this.forceUpdate();
                                }}
                            ></FloatLineComponent>
                        )}
                        {!inputBlock.isBoolean && cantDisplaySlider && <FloatPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />}
                        {!inputBlock.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label="Value"
                                target={inputBlock}
                                propertyName="value"
                                step={Math.abs(inputBlock.max - inputBlock.min) / 100.0}
                                minimum={Math.min(inputBlock.min, inputBlock.max)}
                                maximum={inputBlock.max}
                                onChange={() => {
                                    if (inputBlock.isConstant) {
                                        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                    }
                                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                }}
                            />
                        )}
                    </>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return <Vector2PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <>
                        <Color3PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />
                        <CheckBoxLineComponent
                            label="Convert to gamma space"
                            propertyName="convertToGammaSpace"
                            target={inputBlock}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            }}
                        />
                        <CheckBoxLineComponent
                            label="Convert to linear space"
                            propertyName="convertToLinearSpace"
                            target={inputBlock}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            }}
                        />
                    </>
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <>
                        <Color4PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />
                        <CheckBoxLineComponent
                            label="Convert to gamma space"
                            propertyName="convertToGammaSpace"
                            target={inputBlock}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            }}
                        />
                        <CheckBoxLineComponent
                            label="Convert to linear space"
                            propertyName="convertToLinearSpace"
                            target={inputBlock}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            }}
                        />
                    </>
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return <Vector3PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return <Vector4PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return <MatrixPropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.nodeData.data as InputBlock;
        inputBlock.setDefaultValue();
    }

    override render() {
        const inputBlock = this.props.nodeData.data as InputBlock;

        let systemValuesOptions: { label: string; value: NodeMaterialSystemValues }[] = [];
        let attributeOptions: { label: string; value: string }[] = [];
        let animationOptions: { label: string; value: AnimatedInputBlockTypes }[] = [];

        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                animationOptions = [
                    { label: "None", value: AnimatedInputBlockTypes.None },
                    { label: "Time", value: AnimatedInputBlockTypes.Time },
                    { label: "RealTime", value: AnimatedInputBlockTypes.RealTime },
                ];
                systemValuesOptions = [
                    { label: "Delta time", value: NodeMaterialSystemValues.DeltaTime },
                    { label: "Material alpha", value: NodeMaterialSystemValues.MaterialAlpha },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                systemValuesOptions = [
                    { label: "World", value: NodeMaterialSystemValues.World },
                    { label: "World x View", value: NodeMaterialSystemValues.WorldView },
                    { label: "World x View x Projection", value: NodeMaterialSystemValues.WorldViewProjection },
                    { label: "View", value: NodeMaterialSystemValues.View },
                    { label: "View x Projection", value: NodeMaterialSystemValues.ViewProjection },
                    { label: "Projection", value: NodeMaterialSystemValues.Projection },
                    { label: "Projection Inverse", value: NodeMaterialSystemValues.ProjectionInverse },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                systemValuesOptions = [{ label: "Fog color", value: NodeMaterialSystemValues.FogColor }];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                attributeOptions = [
                    { label: "color", value: "color" },
                    { label: "Instance Color", value: "instanceColor" },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                attributeOptions = [
                    { label: "uv", value: "uv" },
                    { label: "uv2", value: "uv2" },
                    { label: "uv3", value: "uv3" },
                    { label: "uv4", value: "uv4" },
                    { label: "uv5", value: "uv5" },
                    { label: "uv6", value: "uv6" },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                systemValuesOptions = [
                    { label: "Camera position", value: NodeMaterialSystemValues.CameraPosition },
                    { label: "Camera forward", value: NodeMaterialSystemValues.CameraForward },
                ];
                attributeOptions = [
                    { label: "position", value: "position" },
                    { label: "normal", value: "normal" },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                animationOptions = [
                    { label: "None", value: AnimatedInputBlockTypes.None },
                    { label: "MouseInfo", value: AnimatedInputBlockTypes.MouseInfo },
                ];
                attributeOptions = [
                    { label: "matricesIndices", value: "matricesIndices" },
                    { label: "matricesWeights", value: "matricesWeights" },
                    { label: "matricesIndicesExtra", value: "matricesIndicesExtra" },
                    { label: "matricesWeightsExtra", value: "matricesWeightsExtra" },
                    { label: "tangent", value: "tangent" },
                ];
                systemValuesOptions = [{ label: "Camera parameters", value: NodeMaterialSystemValues.CameraParameters }];
                break;
        }

        const modeOptions = [{ label: "User-defined", value: 0 }];

        if (attributeOptions.length > 0) {
            modeOptions.push({ label: "Mesh attribute", value: 1 });
        }

        if (systemValuesOptions.length > 0) {
            modeOptions.push({ label: "System value", value: 2 });
        }

        const typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
            { label: "Constant", value: 2 },
        ];

        return (
            <PropertyTabComponentBase>
                {GetGeneralProperties({ stateManager: this.props.stateManager, nodeData: this.props.nodeData })}
                <LineContainerComponent title="PROPERTIES">
                    {inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None && (
                        <OptionsLine
                            label="Type"
                            options={typeOptions}
                            target={inputBlock}
                            noDirectUpdate={true}
                            extractValue={() => {
                                if (inputBlock.visibleInInspector) {
                                    return 1;
                                }

                                if (inputBlock.isConstant) {
                                    return 2;
                                }

                                return 0;
                            }}
                            onSelect={(value: any) => {
                                switch (value) {
                                    case 0:
                                        inputBlock.visibleInInspector = false;
                                        inputBlock.isConstant = false;
                                        break;
                                    case 1:
                                        inputBlock.visibleInInspector = true;
                                        inputBlock.isConstant = false;
                                        break;
                                    case 2:
                                        inputBlock.visibleInInspector = false;
                                        inputBlock.isConstant = true;
                                        break;
                                }
                                this.forceUpdate();
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                            propertyName={""}
                        />
                    )}
                    {inputBlock.visibleInInspector && (
                        <TextInputLineComponent
                            label="Group"
                            propertyName="groupInInspector"
                            target={inputBlock}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => {
                                this.forceUpdate();
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                            throttlePropertyChangedNotification={true}
                        />
                    )}
                    <OptionsLine
                        label="Mode"
                        options={modeOptions}
                        target={inputBlock}
                        noDirectUpdate={true}
                        extractValue={() => {
                            if (inputBlock.isAttribute) {
                                return 1;
                            }

                            if (inputBlock.isSystemValue) {
                                return 2;
                            }

                            return 0;
                        }}
                        onSelect={(value: any) => {
                            switch (value) {
                                case 0:
                                    inputBlock.isUniform = true;
                                    inputBlock.setAsSystemValue(null);
                                    this.setDefaultValue();
                                    break;
                                case 1:
                                    inputBlock.setAsAttribute(attributeOptions[0].value);
                                    break;
                                case 2:
                                    inputBlock.setAsSystemValue(systemValuesOptions[0].value);
                                    break;
                            }
                            this.forceUpdate();
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                        propertyName={""}
                    />
                    {inputBlock.isAttribute && (
                        <OptionsLine
                            label="Attribute"
                            valuesAreStrings={true}
                            options={attributeOptions}
                            target={inputBlock}
                            propertyName="name"
                            onSelect={(value: any) => {
                                inputBlock.setAsAttribute(value);
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {inputBlock.isUniform && animationOptions.length > 0 && (
                        <OptionsLine
                            label="Animation type"
                            options={animationOptions}
                            target={inputBlock}
                            propertyName="animationType"
                            onSelect={() => {
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {inputBlock.isUniform &&
                        !inputBlock.isSystemValue &&
                        inputBlock.animationType === AnimatedInputBlockTypes.None &&
                        this.renderValue(this.props.stateManager.data as GlobalState)}
                    {inputBlock.isUniform && inputBlock.isSystemValue && (
                        <OptionsLine
                            label="System value"
                            options={systemValuesOptions}
                            target={inputBlock}
                            propertyName="systemValue"
                            onSelect={(value: any) => {
                                inputBlock.setAsSystemValue(value);
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None && (
                        <CheckBoxLineComponent label="Visible on frame" target={inputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>
                    )}
                </LineContainerComponent>
            </PropertyTabComponentBase>
        );
    }
}
