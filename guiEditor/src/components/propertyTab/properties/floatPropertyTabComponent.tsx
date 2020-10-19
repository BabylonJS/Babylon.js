
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
            <FloatLineComponent globalState={this.props.globalState} label="Value" target={this.props.inputBlock} propertyName="value" onChange={() => {
                if (this.props.inputBlock.isConstant) {
                    this.props.globalState.onRebuildRequiredObservable.notifyObservers();    
                }
                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
            }}></FloatLineComponent>
        );
    }
}