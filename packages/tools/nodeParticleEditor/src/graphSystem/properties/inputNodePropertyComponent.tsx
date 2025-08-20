import * as React from "react";
import type { GlobalState } from "../../globalState";
import { FloatPropertyTabComponent } from "../../components/propertyTab/properties/floatPropertyTabComponent";
import { Vector2PropertyTabComponent } from "../../components/propertyTab/properties/vector2PropertyTabComponent";
import { Vector3PropertyTabComponent } from "../../components/propertyTab/properties/vector3PropertyTabComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import type { ParticleInputBlock } from "core/Particles/Node/Blocks/particleInputBlock";
import { Color4PropertyTabComponent } from "../../components/propertyTab/properties/color4PropertyTabComponent";
import { NodeParticleContextualSources } from "core/Particles/Node/Enums/nodeParticleContextualSources";
import { NodeParticleSystemSources } from "core/Particles/Node/Enums/nodeParticleSystemSources";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<ParticleInputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        const inputBlock = this.props.nodeData.data as ParticleInputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        const inputBlock = this.props.nodeData.data as ParticleInputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(globalState: GlobalState) {
        const inputBlock = this.props.nodeData.data as ParticleInputBlock;
        switch (inputBlock.type) {
            case NodeParticleBlockConnectionPointTypes.Int:
            case NodeParticleBlockConnectionPointTypes.Float: {
                const cantDisplaySlider = isNaN(inputBlock.min) || isNaN(inputBlock.max) || inputBlock.min === inputBlock.max;
                const isIntger = inputBlock.type === NodeParticleBlockConnectionPointTypes.Int;
                return (
                    <>
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Min"
                            target={inputBlock}
                            isInteger={isIntger}
                            propertyName="min"
                            onChange={() => {
                                if (inputBlock.value < inputBlock.min) {
                                    inputBlock.value = inputBlock.min;
                                }
                                this.forceUpdate();
                            }}
                        ></FloatLineComponent>
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Max"
                            target={inputBlock}
                            isInteger={isIntger}
                            propertyName="max"
                            onChange={() => {
                                if (inputBlock.value > inputBlock.max) {
                                    inputBlock.value = inputBlock.max;
                                }
                                this.forceUpdate();
                            }}
                        ></FloatLineComponent>
                        {cantDisplaySlider && <FloatPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />}
                        {!cantDisplaySlider && (
                            <SliderLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label="Value"
                                target={inputBlock}
                                propertyName="value"
                                step={isIntger ? 1 : Math.abs(inputBlock.max - inputBlock.min) / 100.0}
                                decimalCount={isIntger ? 0 : 2}
                                minimum={Math.min(inputBlock.min, inputBlock.max)}
                                maximum={inputBlock.max}
                                onChange={() => {
                                    this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                    this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                }}
                            />
                        )}
                    </>
                );
            }
            case NodeParticleBlockConnectionPointTypes.Vector2:
                return <Vector2PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                return <Vector3PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case NodeParticleBlockConnectionPointTypes.Color4:
                return <Color4PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.nodeData.data as ParticleInputBlock;
        inputBlock.setDefaultValue();
    }

    override render() {
        const inputBlock = this.props.nodeData.data as ParticleInputBlock;

        let contextualSourcesOptions: { label: string; value: NodeParticleContextualSources }[] = [{ label: "None", value: NodeParticleContextualSources.None }];
        let systemSourcesOptions: { label: string; value: NodeParticleSystemSources }[] = [{ label: "None", value: NodeParticleSystemSources.None }];

        switch (inputBlock.type) {
            case NodeParticleBlockConnectionPointTypes.Float:
                contextualSourcesOptions = [
                    { label: "Age", value: NodeParticleContextualSources.Age },
                    { label: "Lifetime", value: NodeParticleContextualSources.Lifetime },
                    { label: "Age gradient", value: NodeParticleContextualSources.AgeGradient },
                    { label: "Angle", value: NodeParticleContextualSources.Angle },
                ];
                systemSourcesOptions = [
                    { label: "Time", value: NodeParticleSystemSources.Time },
                    { label: "Delta", value: NodeParticleSystemSources.Delta },
                ];
                break;
            case NodeParticleBlockConnectionPointTypes.Int:
                contextualSourcesOptions = [{ label: "Sprite cell index", value: NodeParticleContextualSources.SpriteCellIndex }];
                contextualSourcesOptions = [{ label: "Sprite cell start", value: NodeParticleContextualSources.SpriteCellStart }];
                contextualSourcesOptions = [{ label: "Sprite cell end", value: NodeParticleContextualSources.SpriteCellEnd }];
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
                contextualSourcesOptions = [{ label: "Scale", value: NodeParticleContextualSources.Scale }];
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                contextualSourcesOptions = [
                    { label: "Position", value: NodeParticleContextualSources.Position },
                    { label: "Direction", value: NodeParticleContextualSources.Direction },
                    { label: "Scaled direction", value: NodeParticleContextualSources.ScaledDirection },
                ];
                systemSourcesOptions = [{ label: "Emitter", value: NodeParticleSystemSources.Emitter }];
                break;
            case NodeParticleBlockConnectionPointTypes.Color4:
                contextualSourcesOptions = [
                    { label: "Color", value: NodeParticleContextualSources.Color },
                    { label: "Initial Color", value: NodeParticleContextualSources.InitialColor },
                    { label: "Dead Color", value: NodeParticleContextualSources.ColorDead },
                ];
                break;
        }

        const modeOptions = [{ label: "User-defined", value: 0 }];

        if (contextualSourcesOptions.length > 0) {
            modeOptions.push({ label: "Contextual value (Float)", value: 2 });
            modeOptions.push({ label: "Contextual value (int)", value: 1 });
            modeOptions.push({ label: "Contextual value (Vector2)", value: 4 });
            modeOptions.push({ label: "Contextual value (Vector3)", value: 8 });
            modeOptions.push({ label: "Contextual value (Color4)", value: 128 });
        }

        if (systemSourcesOptions.length > 0) {
            modeOptions.push({ label: "System value (Float)", value: 2 });
            modeOptions.push({ label: "System value (Vector3)", value: 8 });
        }

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Mode"
                        options={modeOptions}
                        target={inputBlock}
                        noDirectUpdate={true}
                        extractValue={() => {
                            if (inputBlock.isContextual || inputBlock.isSystemSource) {
                                return inputBlock.type;
                            }

                            return 0;
                        }}
                        onSelect={(value: any) => {
                            switch (value) {
                                case 0:
                                    this.setDefaultValue();
                                    break;
                                default:
                                    switch (value) {
                                        case 1:
                                            inputBlock.contextualValue = NodeParticleContextualSources.Age;
                                            break;
                                        case 2:
                                            inputBlock.contextualValue = NodeParticleContextualSources.SpriteCellIndex;
                                            break;
                                        case 3:
                                            inputBlock.contextualValue = NodeParticleContextualSources.Scale;
                                            break;
                                        case 4:
                                            inputBlock.contextualValue = NodeParticleContextualSources.Position;
                                            break;
                                        case 5:
                                            inputBlock.contextualValue = NodeParticleContextualSources.Color;
                                            break;
                                        case 6:
                                            inputBlock.systemSource = NodeParticleSystemSources.Time;
                                            break;
                                        case 7:
                                            inputBlock.systemSource = NodeParticleSystemSources.Emitter;
                                            break;
                                    }
                                    break;
                            }
                            this.forceUpdate();
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                        propertyName={""}
                    />
                    {!inputBlock.isContextual && !inputBlock.isSystemSource && this.renderValue(this.props.stateManager.data as GlobalState)}
                    {inputBlock.isContextual && (
                        <OptionsLine
                            label="Contextual value"
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
                    {inputBlock.isSystemSource && (
                        <OptionsLine
                            label="System value"
                            options={systemSourcesOptions}
                            target={inputBlock}
                            propertyName="systemSource"
                            onSelect={(value: any) => {
                                inputBlock.systemSource = value;
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {!inputBlock.isContextual && !inputBlock.isSystemSource && (
                        <CheckBoxLineComponent label="Display in the Inspector" target={inputBlock} propertyName={"displayInInspector"}></CheckBoxLineComponent>
                    )}
                    {!inputBlock.isContextual && !inputBlock.isSystemSource && (
                        <CheckBoxLineComponent label="Visible on frame" target={inputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>
                    )}
                </LineContainerComponent>
            </div>
        );
    }
}
