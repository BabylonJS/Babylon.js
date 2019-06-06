
import * as React from "react";
import { Vector2PropertyTabComponent } from '../../propertyTab/properties/vector2PropertyTabComponent';
import { Vector3PropertyTabComponent } from '../../propertyTab/properties/vector3PropertyTabComponent';
import { CheckBoxLineComponent } from '../../../sharedComponents/checkBoxLineComponent';
import { GlobalState } from '../../../globalState';
import { InputNodeModel } from './inputNodeModel';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { OptionsLineComponent } from '../../../sharedComponents/optionsLineComponent';
import { NodeMaterialWellKnownValues } from 'babylonjs/Materials/Node/nodeMaterialWellKnownValues';
import { Vector2, Vector3, Matrix } from 'babylonjs/Maths/math';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { Color3PropertyTabComponent } from '../../propertyTab/properties/color3PropertyTabComponent';
import { FloatPropertyTabComponent } from '../../propertyTab/properties/floatPropertyTabComponent';

interface IInputPropertyTabComponentProps {
    globalState: GlobalState;
    inputNode: InputNodeModel;
}

export class InputPropertyTabComponentProps extends React.Component<IInputPropertyTabComponentProps> {

    constructor(props: IInputPropertyTabComponentProps) {
        super(props)
    }

    renderValue(globalState: GlobalState) {
        let connection = this.props.inputNode.connection!;
        switch (connection.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                return (
                    <FloatPropertyTabComponent globalState={globalState} connection={connection} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2PropertyTabComponent globalState={globalState} connection={connection} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color3PropertyTabComponent globalState={globalState} connection={connection} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
                return (
                    <Vector3PropertyTabComponent globalState={globalState} connection={connection} />
                );
        }
        return null;
    }

    setDefaultValue() {
        let connection = this.props.inputNode.connection!;
        switch (connection.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                connection.value = 0;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                connection.value = Vector2.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
                connection.value = Vector3.Zero();
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                connection.value = Matrix.Identity();
                break;
        }
    }

    render() {
        let connection = this.props.inputNode.connection!;

        var wellKnownOptions = [
            { label: "World", value: NodeMaterialWellKnownValues.World },
            { label: "WorldxView", value: NodeMaterialWellKnownValues.WorldView },
            { label: "WorldxViewxProjection", value: NodeMaterialWellKnownValues.WorldViewProjection },
            { label: "View", value: NodeMaterialWellKnownValues.View },
            { label: "ViewxProjection", value: NodeMaterialWellKnownValues.ViewProjection },
            { label: "Projection", value: NodeMaterialWellKnownValues.Projection },
            { label: "Automatic", value: NodeMaterialWellKnownValues.Automatic },
        ];

        var attributeOptions = [
            { label: "position", value: "position" },
            { label: "normal", value: "normal" },
            { label: "tangent", value: "tangent" },
            { label: "color", value: "color" },
            { label: "uv", value: "uv" },
            { label: "uv2", value: "uv2" },
        ];

        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        function getBaseType(type: NodeMaterialBlockConnectionPointTypes): string {
            switch (type) {
                case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
                case NodeMaterialBlockConnectionPointTypes.Vector4OrColor4:
                case NodeMaterialBlockConnectionPointTypes.Vector3OrVector4:
                case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3OrVector4OrColor4:
                    return "Vector";
                case NodeMaterialBlockConnectionPointTypes.Color3:
                case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
                case NodeMaterialBlockConnectionPointTypes.Color4: {
                    return "Color";
                }
                default: {
                    return NodeMaterialBlockConnectionPointTypes[type];
                }
            }
        }

        return (
            <div>
                <TextLineComponent label="Type" value={getBaseType(connection.type)} />
                <CheckBoxLineComponent label="Is mesh attribute" onSelect={value => {
                    if (!value) {
                        connection.isUniform = true;
                    } else {
                        connection.isAttribute = true;
                    }
                    this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    this.forceUpdate();
                }} isSelected={() => connection!.isAttribute} />
                {
                    connection.isAttribute &&
                    <OptionsLineComponent label="Attribute" valuesAreStrings={true} options={attributeOptions} target={connection} propertyName="name" onSelect={(value: any) => {
                        connection.setAsAttribute(value);
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />
                }
                {
                    connection.isUniform &&
                    <CheckBoxLineComponent label="Is well known value" onSelect={value => {
                        if (value) {
                            connection!.setAsWellKnownValue(NodeMaterialWellKnownValues.World);
                        } else {
                            connection!.setAsWellKnownValue(null);
                            this.setDefaultValue();
                        }
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        this.forceUpdate();
                    }} isSelected={() => connection!.isWellKnownValue} />
                }
                {
                    connection.isUniform && !connection.isWellKnownValue &&
                    this.renderValue(this.props.globalState)
                }
                {
                    connection.isUniform && connection.isWellKnownValue &&
                    <OptionsLineComponent label="Well known value" options={wellKnownOptions} target={connection} propertyName="wellKnownValue" onSelect={(value: any) => {
                        connection.setAsWellKnownValue(value);
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />
                }
            </div>
        );
    }
}