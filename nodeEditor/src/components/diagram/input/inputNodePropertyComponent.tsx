
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

        return (
            <div>
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