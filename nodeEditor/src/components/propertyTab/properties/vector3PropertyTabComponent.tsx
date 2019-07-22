
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { Vector3LineComponent } from '../../../sharedComponents/vector3LineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

interface IVector3PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Vector3PropertyTabComponent extends React.Component<IVector3PropertyTabComponentProps> {

    render() {
        return (
            <Vector3LineComponent label="Value" target={this.props.inputBlock} propertyName="value"></Vector3LineComponent>
        );
    }
}