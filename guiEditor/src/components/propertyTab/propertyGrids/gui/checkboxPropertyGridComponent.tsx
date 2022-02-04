import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Checkbox } from "babylonjs-gui/2D/controls/checkbox";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");

interface ICheckboxPropertyGridComponentProps {
    checkboxes: Checkbox[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
    constructor(props: ICheckboxPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const checkboxes = this.props.checkboxes;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={checkboxes} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="CHECKBOX" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent
                    iconLabel={"Check size ratio"}
                    icon={sizeIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(checkboxes, this.props.onPropertyChangedObservable)}
                    propertyName="checkSizeRatio"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Checked"}
                    icon={fillColorIcon}
                    label="CHECKED"
                    target={makeTargetsProxy(checkboxes, this.props.onPropertyChangedObservable)}
                    propertyName="isChecked"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
