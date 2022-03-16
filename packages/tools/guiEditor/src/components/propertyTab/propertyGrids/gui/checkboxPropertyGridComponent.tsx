import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Checkbox } from "gui/2D/controls/checkbox";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";

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
