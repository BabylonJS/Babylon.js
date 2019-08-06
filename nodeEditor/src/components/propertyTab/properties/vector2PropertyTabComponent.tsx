
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { Vector2LineComponent } from '../../../sharedComponents/vector2LineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

interface IVector2PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Vector2PropertyTabComponent extends React.Component<IVector2PropertyTabComponentProps> {

    render() {
        return (
            <Vector2LineComponent label="Value" target={this.props.inputBlock} propertyName="value"></Vector2LineComponent>
        );
    }
}