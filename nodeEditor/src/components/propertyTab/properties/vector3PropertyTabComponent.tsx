
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { Vector3LineComponent } from '../../../sharedComponents/vector3LineComponent';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    connection: NodeMaterialConnectionPoint;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {

    render() {
        return (
            <Vector3LineComponent label="Value" target={this.props.connection} propertyName="value"></Vector3LineComponent>
        );
    }
}