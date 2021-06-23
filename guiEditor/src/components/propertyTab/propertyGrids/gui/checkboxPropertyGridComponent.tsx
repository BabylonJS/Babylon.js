import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

interface ICheckboxPropertyGridComponentProps {
    checkbox: Checkbox;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
    constructor(props: ICheckboxPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const checkbox = this.props.checkbox;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={checkbox} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr></hr>
                <TextLineComponent label="CHECKBOX" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent lockObject={this.props.lockObject} label="Check size ratio" target={checkbox} propertyName="checkSizeRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent label="Checked" target={checkbox} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}