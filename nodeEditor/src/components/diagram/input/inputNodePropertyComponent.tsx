
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
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
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

        var wellKnownOptions = [
            { label: "World", value: NodeMaterialWellKnownValues.World },
            { label: "WorldxView", value: NodeMaterialWellKnownValues.WorldView },
            { label: "WorldxViewxProjection", value: NodeMaterialWellKnownValues.WorldViewProjection },
            { label: "View", value: NodeMaterialWellKnownValues.View },
            { label: "ViewxProjection", value: NodeMaterialWellKnownValues.ViewProjection },
            { label: "Projection", value: NodeMaterialWellKnownValues.Projection },
            { label: "Camera position", value: NodeMaterialWellKnownValues.CameraPosition },
            { label: "Fog color", value: NodeMaterialWellKnownValues.FogColor },
        ];

        var attributeOptions = [
            { label: "position", value: "position" },
            { label: "normal", value: "normal" },
            { label: "tangent", value: "tangent" },
            { label: "color", value: "color" },
            { label: "uv", value: "uv" },
            { label: "uv2", value: "uv2" },
        ];

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Type" value={StringTools.GetBaseType(this.props.inputNode.outputType)} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Is mesh attribute" onSelect={value => {
                        if (!value) {
                            inputBlock.isUniform = true;
                            this.setDefaultValue();
                        } else {
                            inputBlock.isAttribute = true;
                        }
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        this.forceUpdate();
                    }} isSelected={() => inputBlock.isAttribute} />
                    {
                        inputBlock.isAttribute &&
                        <OptionsLineComponent label="Attribute" valuesAreStrings={true} options={attributeOptions} target={inputBlock} propertyName="name" onSelect={(value: any) => {
                            inputBlock.setAsAttribute(value);
                            this.forceUpdate();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        inputBlock.isUniform &&
                        <CheckBoxLineComponent label="Is well known value" onSelect={value => {
                            if (value) {
                                inputBlock.setAsWellKnownValue(NodeMaterialWellKnownValues.World);
                            } else {
                                inputBlock.setAsWellKnownValue(null);
                                this.setDefaultValue();
                            }
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }} isSelected={() => inputBlock.isWellKnownValue} />
                    }
                    {
                        inputBlock.isUniform && !inputBlock.isWellKnownValue &&
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