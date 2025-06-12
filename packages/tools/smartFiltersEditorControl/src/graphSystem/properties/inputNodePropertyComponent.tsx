import * as react from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent.js";
import { GeneralPropertyTabComponent, GenericPropertyComponent } from "./genericNodePropertyComponent.js";
import type { IPropertyComponentProps } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "@babylonjs/shared-ui-components/lines/optionsLineComponent.js";
import type { IInspectableOptions } from "@babylonjs/core/Misc/iInspectable.js";
import { ConnectionPointType, type AnyInputBlock } from "@babylonjs/smart-filters";
import { Color3PropertyTabComponent } from "../../components/propertyTab/properties/color3PropertyTabComponent.js";
import { Color4PropertyTabComponent } from "../../components/propertyTab/properties/color4PropertyTabComponent.js";
import { ImageSourcePropertyTabComponent } from "../../components/propertyTab/properties/imageSourcePropertyTabComponent.js";
import { FloatPropertyTabComponent } from "../../components/propertyTab/properties/floatPropertyTabComponent.js";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager";
import { Vector2PropertyTabComponent } from "../../components/propertyTab/properties/vector2PropertyTabComponent.js";
import { LazyTextInputLineComponent } from "../../sharedComponents/lazyTextInputLineComponent.js";

const booleanOptions: IInspectableOptions[] = [
    {
        label: "True",
        value: 1,
    },
    {
        label: "False",
        value: 0,
    },
];

export class InputPropertyComponent extends react.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        // If this InputBlock has our reserved _propStore, it means it uses @editableProperty to define its properties
        // So we will assume that the developer of that InputBlock intends to use the GenericPropertyComponent
        if (this.props.nodeData.data._propStore) {
            return <GenericPropertyComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />;
        }

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <InputPropertyTabComponent
                        stateManager={this.props.stateManager}
                        inputBlock={this.props.nodeData.data}
                    ></InputPropertyTabComponent>
                </LineContainerComponent>
                <LineContainerComponent title="APP METADATA">
                    <div id="appMetadata">
                        <LazyTextInputLineComponent
                            key={this.props.nodeData.uniqueId}
                            lockObject={this.props.stateManager.lockObject}
                            label="appMetadata"
                            multilines={true}
                            target={this.props.nodeData.data}
                            propertyName="appMetadata"
                            formatValue={(value: any) => {
                                return value ? JSON.stringify(value) : "";
                            }}
                            extractValue={(value: string) => {
                                return value ? JSON.parse(value) : undefined;
                            }}
                            onExtractValueFailed={() => {
                                this.props.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(
                                    "Invalid JSON"
                                );
                            }}
                        ></LazyTextInputLineComponent>
                    </div>
                </LineContainerComponent>
            </div>
        );
    }
}

export type InputPropertyComponentProps = {
    stateManager: StateManager;
    inputBlock: AnyInputBlock;
};

/**
 * Given an input block, returns the appropriate property component for the block's type
 */
export class InputPropertyTabComponent extends react.Component<InputPropertyComponentProps> {
    // private _onValueChangedObserver: Nullable<Observer<AnyInputBlock>> = null;
    constructor(props: InputPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        // const inputBlock = this.props.nodeData.data as AnyInputBlock;
        // this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
        //     this.forceUpdate();
        //     this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
        // });
    }

    override componentWillUnmount() {
        // const inputBlock = this.props.nodeData.data as AnyInputBlock;
        // if (this._onValueChangedObserver) {
        //     inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
        //     this._onValueChangedObserver = null;
        // }
    }

    setDefaultValue() {
        // const inputBlock = this.props.nodeData.data as InputBlock;
        // inputBlock.setDefaultValue();
    }

    override render() {
        const inputBlock = this.props.inputBlock;

        // Use the default property component
        switch (inputBlock.type) {
            case ConnectionPointType.Boolean: {
                const dummyTarget = {
                    value: true,
                };
                return (
                    <OptionsLine
                        key={inputBlock.uniqueId}
                        label="Value"
                        target={dummyTarget}
                        propertyName="value"
                        options={booleanOptions}
                        noDirectUpdate
                        extractValue={() => {
                            return inputBlock.runtimeValue.value ? 1 : 0;
                        }}
                        onSelect={(newSelectionValue: string | number) => {
                            inputBlock.runtimeValue.value = newSelectionValue === 1;
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
                        }}
                    ></OptionsLine>
                );
            }
            case ConnectionPointType.Float: {
                return (
                    <FloatPropertyTabComponent
                        key={inputBlock.uniqueId}
                        inputBlock={inputBlock}
                        stateManager={this.props.stateManager}
                    />
                );
            }
            case ConnectionPointType.Texture:
                {
                    return (
                        <ImageSourcePropertyTabComponent
                            key={inputBlock.uniqueId}
                            inputBlock={inputBlock}
                            stateManager={this.props.stateManager}
                        />
                    );
                }
                break;
            // case NodeMaterialBlockConnectionPointTypes.Vector2:
            //     return <Vector2PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case ConnectionPointType.Color3:
                return (
                    <>
                        <Color3PropertyTabComponent
                            key={inputBlock.uniqueId}
                            stateManager={this.props.stateManager}
                            inputBlock={inputBlock}
                        />
                    </>
                );
            case ConnectionPointType.Color4:
                return (
                    <>
                        <Color4PropertyTabComponent
                            key={inputBlock.uniqueId}
                            stateManager={this.props.stateManager}
                            inputBlock={inputBlock}
                        />
                    </>
                );
            // case NodeMaterialBlockConnectionPointTypes.Vector3:
            //     return <Vector3PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            // case NodeMaterialBlockConnectionPointTypes.Vector4:
            //     return <Vector4PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            // case NodeMaterialBlockConnectionPointTypes.Matrix:
            //     return <MatrixPropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} inputBlock={inputBlock} />;
            case ConnectionPointType.Vector2:
                return (
                    <Vector2PropertyTabComponent
                        key={inputBlock.uniqueId}
                        inputBlock={inputBlock}
                        lockObject={this.props.stateManager.lockObject}
                        stateManager={this.props.stateManager}
                    />
                );
        }

        return <></>;
    }
}
