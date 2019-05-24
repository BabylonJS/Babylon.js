
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { Color3LineComponent } from '../../../sharedComponents/color3LineComponent';

interface IColor3PropertyTabComponentProps {
    globalState: GlobalState;
    connection: NodeMaterialConnectionPoint;
}

export class Color3PropertyTabComponent extends React.Component<IColor3PropertyTabComponentProps> {

    render() {
        return (
            <Color3LineComponent label="Value" target={this.props.connection} propertyName="value"></Color3LineComponent>
        );
    }
}