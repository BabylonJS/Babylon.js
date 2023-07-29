import * as React from "react";
import type { GlobalState } from "../../globalState";
import { FloatPropertyTabComponent } from "../../components/propertyTab/properties/floatPropertyTabComponent";
import { Vector2PropertyTabComponent } from "../../components/propertyTab/properties/vector2PropertyTabComponent";
import { Vector3PropertyTabComponent } from "../../components/propertyTab/properties/vector3PropertyTabComponent";
import { Vector4PropertyTabComponent } from "../../components/propertyTab/properties/vector4PropertyTabComponent";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryContextualSources } from "core/Meshes/Node/Enums/nodeGeometryContextualSources";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<GeometryInputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    componentDidMount() {
        const inputBlock = this.props.nodeData.data as GeometryInputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
        });
    }

    componentWillUnmount() {
        const inputBlock = this.props.nodeData.data as GeometryInputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(globalState: GlobalState) {
        const inputBlock = this.props.nodeData.data as GeometryInputBlock;
        switch (inputBlock.type) {
            case NodeGeometryBlockConnectionPointTypes.Float: {
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
                                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                }}
                            />
                        )}
                    </>
                );
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                return <Vector2PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                return <Vector3PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                return <Vector4PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.nodeData.data as GeometryInputBlock;
        inputBlock.setDefaultValue();
    }

    render() {
        const inputBlock = this.props.nodeData.data as GeometryInputBlock;

        let contextualSourcesOptions: { label: string; value: NodeGeometryContextualSources }[] = [{ label: "None", value: NodeGeometryContextualSources.None }];

        switch (inputBlock.type) {
            case NodeGeometryBlockConnectionPointTypes.Float:
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector2:
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector3:
                contextualSourcesOptions = [
                    { label: "Positions", value: NodeGeometryContextualSources.Positions },
                    { label: "Normals", value: NodeGeometryContextualSources.Normals },
                ];
                break;
            case NodeGeometryBlockConnectionPointTypes.Vector4:
                break;
        }

        const modeOptions = [{ label: "User-defined", value: 0 }];

        if (contextualSourcesOptions.length > 0) {
            modeOptions.push({ label: "Contextual value", value: 1 });
        }

        const typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    {!inputBlock.isContextual && (
                        <OptionsLineComponent
                            label="Type"
                            options={typeOptions}
                            target={inputBlock}
                            noDirectUpdate={true}
                            extractValue={() => {
                                if (inputBlock.visibleInInspector) {
                                    return 1;
                                }

                                return 0;
                            }}
                            onSelect={(value: any) => {
                                switch (value) {
                                    case 0:
                                        inputBlock.visibleInInspector = false;
                                        break;
                                    case 1:
                                        inputBlock.visibleInInspector = true;
                                        break;
                                    case 2:
                                        inputBlock.visibleInInspector = false;
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
                    <OptionsLineComponent
                        label="Mode"
                        options={modeOptions}
                        target={inputBlock}
                        noDirectUpdate={true}
                        extractValue={() => {
                            if (inputBlock.isContextual) {
                                return 1;
                            }

                            return 0;
                        }}
                        onSelect={(value: any) => {
                            switch (value) {
                                case 0:
                                    this.setDefaultValue();
                                    break;
                                case 1:
                                    inputBlock.contextualValue = contextualSourcesOptions[1].value;
                                    break;
                            }
                            this.forceUpdate();
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                        propertyName={""}
                    />
                    {!inputBlock.isContextual && this.renderValue(this.props.stateManager.data as GlobalState)}
                    {inputBlock.isContextual && (
                        <OptionsLineComponent
                            label="System value"
                            options={contextualSourcesOptions}
                            target={inputBlock}
                            propertyName="contextualValue"
                            onSelect={(value: any) => {
                                inputBlock.contextualValue = value;
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {!inputBlock.isContextual && <CheckBoxLineComponent label="Visible on frame" target={inputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>}
                </LineContainerComponent>
            </div>
        );
    }
}
