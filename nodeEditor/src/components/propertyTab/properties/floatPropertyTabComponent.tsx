
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { FloatLineComponent } from '../../../sharedComponents/floatLineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

interface IFloatPropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class FloatPropertyTabComponent extends React.Component<IFloatPropertyTabComponentProps> {

    render() {
        return (
            <FloatLineComponent label="Value" target={this.props.inputBlock} propertyName="value"></FloatLineComponent>
        );
    }
}