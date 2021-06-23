import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { RadioButton } from "babylonjs-gui/2D/controls/radioButton";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

interface IRadioButtonPropertyGridComponentProps {
    radioButton: RadioButton,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
    constructor(props: IRadioButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const radioButton = this.props.radioButton;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={radioButton} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr></hr>
                <TextLineComponent label="RADIO BUTTON" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={radioButton} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Check size ratio" target={radioButton} propertyName="checkSizeRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent lockObject={this.props.lockObject} label="Group" target={radioButton} propertyName="group" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent label="Checked" target={radioButton} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}