import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import type { LockObject } from "../../../tabs/propertyGrids/lockObject";
import type { Checkbox } from "gui/2D/controls/checkbox";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";

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
                <LineContainerComponent title="CHECKBOX">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Check size ratio"
                        target={checkbox}
                        propertyName="checkSizeRatio"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Checked" target={checkbox} propertyName="isChecked" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}
