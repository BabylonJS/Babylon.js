
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { FloatLineComponent } from '../../../sharedComponents/floatLineComponent';

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    connection: NodeMaterialConnectionPoint;
}

export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {

    render() {
        return (
            <FloatLineComponent label="Value" target={this.props.connection} propertyName="value"></FloatLineComponent>
        );
    }
}