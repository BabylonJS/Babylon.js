
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
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2PropertyTabComponent globalState={globalState} connection={connection} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
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

        /**
         * Gets the base math type of node material block connection point.
         * @param type Type to parse.
         */
        function getBaseType(type: NodeMaterialBlockConnectionPointTypes): string {
            switch (type) {
                case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3:
                case NodeMaterialBlockConnectionPointTypes.Color3: {
                    return NodeMaterialBlockConnectionPointTypes[NodeMaterialBlockConnectionPointTypes.Vector3];
                }
                case NodeMaterialBlockConnectionPointTypes.Vector4OrColor4:
                case NodeMaterialBlockConnectionPointTypes.Vector3OrVector4:
                case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
                case NodeMaterialBlockConnectionPointTypes.Vector3OrColor3OrVector4OrColor4:
                case NodeMaterialBlockConnectionPointTypes.Color4: {
                    return NodeMaterialBlockConnectionPointTypes[NodeMaterialBlockConnectionPointTypes.Vector4];
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
                    connection!.isAttribute = value;
                    this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    this.forceUpdate();
                }} isSelected={() => connection!.isAttribute} />
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