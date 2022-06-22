import * as React from "react";
import type { GlobalState } from "../../globalState";
import { FloatLineComponent } from "../../sharedComponents/floatLineComponent";
import { FloatPropertyTabComponent } from "../../components/propertyTab/properties/floatPropertyTabComponent";
import { SliderLineComponent } from "../../sharedComponents/sliderLineComponent";
import { Vector2PropertyTabComponent } from "../../components/propertyTab/properties/vector2PropertyTabComponent";
import { Color3PropertyTabComponent } from "../../components/propertyTab/properties/color3PropertyTabComponent";
import { Vector3PropertyTabComponent } from "../../components/propertyTab/properties/vector3PropertyTabComponent";
import { Vector4PropertyTabComponent } from "../../components/propertyTab/properties/vector4PropertyTabComponent";
import { MatrixPropertyTabComponent } from "../../components/propertyTab/properties/matrixPropertyTabComponent";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { OptionsLineComponent } from "../../sharedComponents/optionsLineComponent";
import { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { NodeMaterialSystemValues } from "core/Materials/Node/Enums/nodeMaterialSystemValues";
import { AnimatedInputBlockTypes } from "core/Materials/Node/Blocks/Input/animatedInputBlockTypes";
import type { IPropertyComponentProps } from "./propertyComponentProps";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { TextInputLineComponent } from "../../sharedComponents/textInputLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { Color4PropertyTabComponent } from "../../components/propertyTab/properties/color4PropertyTabComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<InputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    componentDidMount() {
        const inputBlock = this.props.block as InputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
        });
    }

    componentWillUnmount() {
        const inputBlock = this.props.block as InputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(globalState: GlobalState) {
        const inputBlock = this.props.block as InputBlock;
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
                                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                                    }
                                    this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                }}
                            />
                        )}
                        {!inputBlock.isBoolean && (
                            <FloatLineComponent
                                globalState={this.props.globalState}
                                label="Min"
                                target={inputBlock}
                                propertyName="min"
                                onChange={() => {
                                    if (inputBlock.value < inputBlock.min) {
                                        inputBlock.value = inputBlock.min;
                                        if (inputBlock.isConstant) {
                                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                                        }
                                    }
                                    this.forceUpdate();
                                }}
                            ></FloatLineComponent>
                        )}
                        {!inputBlock.isBoolean && (
                            <FloatLineComponent
                                globalState={this.props.globalState}
                                label="Max"
                                target={inputBlock}
                                propertyName="max"
                                onChange={() => {
                                    if (inputBlock.value > inputBlock.max) {
                                        inputBlock.value = inputBlock.max;
                                        if (inputBlock.isConstant) {
                                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                                        }
                                    }
                                    this.forceUpdate();
                                }}
                            ></FloatLineComponent>
                        )}
                        {!inputBlock.isBoolean && cantDisplaySlider && <FloatPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />}
                        {!inputBlock.isBoolean && !cantDisplaySlider && (
                            <SliderLineComponent
                                label="Value"
                                globalState={this.props.globalState}
                                target={inputBlock}
                                propertyName="value"
                                step={Math.abs(inputBlock.max - inputBlock.min) / 100.0}
                                minimum={Math.min(inputBlock.min, inputBlock.max)}
                                maximum={inputBlock.max}
                                onChange={() => {
                                    if (inputBlock.isConstant) {
                                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                                    }
                                    this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                }}
                            />
                        )}
                    </>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return <Vector2PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <>
                        <Color3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                        <CheckBoxLineComponent
                            label="Convert to gamma space"
                            propertyName="convertToGammaSpace"
                            target={this.props.block}
                            onValueChanged={() => {
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            }}
                        />
                        <CheckBoxLineComponent
                            label="Convert to linear space"
                            propertyName="convertToLinearSpace"
                            target={this.props.block}
                            onValueChanged={() => {
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            }}
                        />
                    </>
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <>
                        <Color4PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                        <CheckBoxLineComponent
                            label="Convert to gamma space"
                            propertyName="convertToGammaSpace"
                            target={this.props.block}
                            onValueChanged={() => {
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            }}
                        />
                        <CheckBoxLineComponent
                            label="Convert to linear space"
                            propertyName="convertToLinearSpace"
                            target={this.props.block}
                            onValueChanged={() => {
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            }}
                        />
                    </>
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return <Vector3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return <Vector4PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return <MatrixPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />;
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.block as InputBlock;
        inputBlock.setDefaultValue();
    }

    render() {
        const inputBlock = this.props.block as InputBlock;

        let systemValuesOptions: { label: string; value: NodeMaterialSystemValues }[] = [];
        let attributeOptions: { label: string; value: string }[] = [];
        let animationOptions: { label: string; value: AnimatedInputBlockTypes }[] = [];

        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                animationOptions = [
                    { label: "None", value: AnimatedInputBlockTypes.None },
                    { label: "Time", value: AnimatedInputBlockTypes.Time },
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
                systemValuesOptions = [{ label: "Camera position", value: NodeMaterialSystemValues.CameraPosition }];
                attributeOptions = [
                    { label: "position", value: "position" },
                    { label: "normal", value: "normal" },
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                attributeOptions = [
                    { label: "matricesIndices", value: "matricesIndices" },
                    { label: "matricesWeights", value: "matricesWeights" },
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
            <div>
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block} />
                <LineContainerComponent title="PROPERTIES">
                    {inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None && (
                        <OptionsLineComponent
                            label="Type"
                            options={typeOptions}
                            target={inputBlock}
                            noDirectUpdate={true}
                            getSelection={(block) => {
                                if (block.visibleInInspector) {
                                    return 1;
                                }

                                if (block.isConstant) {
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
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            }}
                        />
                    )}
                    {inputBlock.visibleInInspector && (
                        <TextInputLineComponent
                            globalState={this.props.globalState}
                            label="Group"
                            propertyName="groupInInspector"
                            target={this.props.block}
                            onChange={() => {
                                this.forceUpdate();
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            }}
                        />
                    )}
                    <OptionsLineComponent
                        label="Mode"
                        options={modeOptions}
                        target={inputBlock}
                        noDirectUpdate={true}
                        getSelection={(block) => {
                            if (block.isAttribute) {
                                return 1;
                            }

                            if (block.isSystemValue) {
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
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        }}
                    />
                    {inputBlock.isAttribute && (
                        <OptionsLineComponent
                            label="Attribute"
                            valuesAreStrings={true}
                            options={attributeOptions}
                            target={inputBlock}
                            propertyName="name"
                            onSelect={(value: any) => {
                                inputBlock.setAsAttribute(value);
                                this.forceUpdate();

                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            }}
                        />
                    )}
                    {inputBlock.isUniform && animationOptions.length > 0 && (
                        <OptionsLineComponent
                            label="Animation type"
                            options={animationOptions}
                            target={inputBlock}
                            propertyName="animationType"
                            onSelect={() => {
                                this.forceUpdate();

                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            }}
                        />
                    )}
                    {inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None && this.renderValue(this.props.globalState)}
                    {inputBlock.isUniform && inputBlock.isSystemValue && (
                        <OptionsLineComponent
                            label="System value"
                            options={systemValuesOptions}
                            target={inputBlock}
                            propertyName="systemValue"
                            onSelect={(value: any) => {
                                inputBlock.setAsSystemValue(value);
                                this.forceUpdate();

                                this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                            }}
                        />
                    )}
                    {inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None && (
                        <CheckBoxLineComponent label="Visible on frame" target={this.props.block as InputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>
                    )}
                </LineContainerComponent>
            </div>
        );
    }
}
