import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../lockObject";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { GlobalState } from '../../../../globalState';

interface ICheckboxPropertyGridComponentProps {
    globalState: GlobalState;
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
                <CommonControlPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} control={checkbox} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="CHECKBOX">
                    <FloatLineComponent lockObject={this.props.lockObject} label="Check size ratio" target={checkbox} propertyName="checkSizeRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Checked" target={checkbox} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}