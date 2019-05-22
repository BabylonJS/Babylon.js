
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { Vector2LineComponent } from '../../../sharedComponents/vector2LineComponent';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';

interface IVector2PropertyTabComponentProps {
    globalState: GlobalState;
    connection: NodeMaterialConnectionPoint;
}

export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {

    render() {
        return (
            <Vector2LineComponent label="Value" target={this.props.connection} propertyName="value"></Vector2LineComponent>
        );
    }
}