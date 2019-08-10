
import * as React from "react";
import { Vector2PropertyTabComponent } from '../../propertyTab/properties/vector2PropertyTabComponent';
import { Vector3PropertyTabComponent } from '../../propertyTab/properties/vector3PropertyTabComponent';
import { CheckBoxLineComponent } from '../../../sharedComponents/checkBoxLineComponent';
import { GlobalState } from '../../../globalState';
import { InputNodeModel } from './inputNodeModel';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { OptionsLineComponent } from '../../../sharedComponents/optionsLineComponent';
import { NodeMaterialWellKnownValues } from 'babylonjs/Materials/Node/nodeMaterialWellKnownValues';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { Color3PropertyTabComponent } from '../../propertyTab/properties/color3PropertyTabComponent';
import { FloatPropertyTabComponent } from '../../propertyTab/properties/floatPropertyTabComponent';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { StringTools } from '../../../stringTools';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';

interface IInputPropertyTabComponentProps {
    globalState: GlobalState;
    inputNode: InputNodeModel;
}

export class InputPropertyTabComponentProps extends React.Component<IInputPropertyTabComponentProps> {

    constructor(props: IInputPropertyTabComponentProps) {
        super(props)
    }

    renderValue(globalState: GlobalState) {
        let inputBlock = this.props.inputNode.inputBlock;
        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return (
                    <FloatPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
        }

        return null;
    }

    setDefaultValue() {
        let inputBlock = this.props.inputNode.inputBlock;
        inputBlock.setDefaultValue();
    }

    render() {
        let inputBlock = this.props.inputNode.inputBlock;

        var wellKnownOptions: {label: string, value: NodeMaterialWellKnownValues}[] = [];
        var attributeOptions: {label: string, value: string}[] = [];
        var animationOptions: {label: string, value: AnimatedInputBlockTypes}[] = [];

        switch(inputBlock.type) {      
            case NodeMaterialBlockConnectionPointTypes.Float:
                animationOptions = [
                    { label: "None", value: AnimatedInputBlockTypes.None },
                    { label: "Time", value: AnimatedInputBlockTypes.Time },
                ];
                break;      
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                wellKnownOptions = [
                    { label: "World", value: NodeMaterialWellKnownValues.World },
                    { label: "WorldxView", value: NodeMaterialWellKnownValues.WorldView },
                    { label: "WorldxViewxProjection", value: NodeMaterialWellKnownValues.WorldViewProjection },
                    { label: "View", value: NodeMaterialWellKnownValues.View },
                    { label: "ViewxProjection", value: NodeMaterialWellKnownValues.ViewProjection },
                    { label: "Projection", value: NodeMaterialWellKnownValues.Projection }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                wellKnownOptions = [
                    { label: "Fog color", value: NodeMaterialWellKnownValues.FogColor }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                attributeOptions = [
                    { label: "color", value: "color" }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                attributeOptions = [
                    { label: "uv", value: "uv" },
                    { label: "uv2", value: "uv2" },
                ];
                break;                
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                wellKnownOptions = [
                    { label: "Camera position", value: NodeMaterialWellKnownValues.CameraPosition }
                ];
                attributeOptions = [
                    { label: "position", value: "position" },
                    { label: "normal", value: "normal" },
                    { label: "tangent", value: "tangent" },        
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                    attributeOptions = [
                        { label: "matricesIndices", value: "matricesIndices" },
                        { label: "matricesWeights", value: "matricesWeights" }
                    ];
                    break;                
        }

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent label="Name" propertyName="name" target={inputBlock} onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                    <TextLineComponent label="Type" value={StringTools.GetBaseType(inputBlock.type)} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                    {
                        attributeOptions.length > 0 &&
                        <CheckBoxLineComponent label="Is mesh attribute" onSelect={value => {
                            if (!value) {
                                inputBlock.isUniform = true;
                                this.setDefaultValue();
                            } else {
                                inputBlock.setAsAttribute(attributeOptions[0].value);
                            }
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }} isSelected={() => inputBlock.isAttribute} />
                    }
                    {
                        inputBlock.isAttribute &&
                        <OptionsLineComponent label="Attribute" valuesAreStrings={true} options={attributeOptions} target={inputBlock} propertyName="name" onSelect={(value: any) => {
                            inputBlock.setAsAttribute(value);
                            this.forceUpdate();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        inputBlock.isUniform && wellKnownOptions.length > 0 &&
                        <CheckBoxLineComponent label="Is well known value" onSelect={value => {
                            if (value) {
                                inputBlock.setAsWellKnownValue(wellKnownOptions[0].value);
                            } else {
                                inputBlock.setAsWellKnownValue(null);
                                this.setDefaultValue();
                            }
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }} isSelected={() => inputBlock.isWellKnownValue} />
                    }
                    {
                        inputBlock.isUniform && animationOptions.length > 0 &&
                        <OptionsLineComponent label="Animation type" options={animationOptions} target={inputBlock} propertyName="animationType" onSelect={(value: any) => {
                            this.forceUpdate();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }                    
                    {
                        inputBlock.isUniform && !inputBlock.isWellKnownValue && inputBlock.animationType === AnimatedInputBlockTypes.None &&
                        this.renderValue(this.props.globalState)
                    }
                    {
                        inputBlock.isUniform && inputBlock.isWellKnownValue &&
                        <OptionsLineComponent label="Well known value" options={wellKnownOptions} target={inputBlock} propertyName="wellKnownValue" onSelect={(value: any) => {
                            inputBlock.setAsWellKnownValue(value);
                            this.forceUpdate();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }
                </LineContainerComponent>
            </div>
        );
    }
}