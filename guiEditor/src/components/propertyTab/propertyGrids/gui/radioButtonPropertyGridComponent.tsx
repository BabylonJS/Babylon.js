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

const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");
const checkboxIcon: string = require("../../../../sharedUiComponents/imgs/checkboxIconDark.svg");
const scaleIcon: string = require("../../../../sharedUiComponents/imgs/scaleIcon.svg");

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
                <hr/>
                <TextLineComponent label="RADIO BUTTON" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                <FloatLineComponent iconLabel="Stroke Weight" icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={radioButton} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel="Check Size Ratio" icon={scaleIcon} lockObject={this.props.lockObject} label="" target={radioButton} propertyName="checkSizeRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <TextInputLineComponent lockObject={this.props.lockObject} label="Group" target={radioButton} propertyName="group" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel="Is Checked" icon={checkboxIcon} label="" target={radioButton} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}