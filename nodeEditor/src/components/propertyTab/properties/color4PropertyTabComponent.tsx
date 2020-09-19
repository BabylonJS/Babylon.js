
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { Color4LineComponent } from '../../../sharedComponents/color4LineComponent';

interface IColor4PropertyTabComponentProps {
    globalState: GlobalState;
    inputBlock: InputBlock;
}

export class Color4PropertyTabComponent extends React.Component<IColor4PropertyTabComponentProps> {

    render() {
        return (
            <Color4LineComponent globalState={this.props.globalState} label="Value" target={this.props.inputBlock} propertyName="value" onChange={() => {
                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
            }}></Color4LineComponent>
        );
    }
}