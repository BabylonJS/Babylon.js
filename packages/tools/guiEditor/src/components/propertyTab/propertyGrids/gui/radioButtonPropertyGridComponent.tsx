import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { RadioButton } from "gui/2D/controls/radioButton";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import checkboxIcon from "shared-ui-components/imgs/checkboxIconDark.svg";
import scaleIcon from "shared-ui-components/imgs/scaleIcon.svg";

interface IRadioButtonPropertyGridComponentProps {
    radioButtons: RadioButton[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class RadioButtonPropertyGridComponent extends React.Component<IRadioButtonPropertyGridComponentProps> {
    constructor(props: IRadioButtonPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const radioButtons = this.props.radioButtons;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={radioButtons}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="RADIO BUTTON" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Stroke Weight"
                        icon={strokeWeightIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel="Check Size Ratio"
                        icon={scaleIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                        propertyName="checkSizeRatio"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <TextInputLineComponent
                    iconLabel="Group"
                    icon={strokeWeightIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                    propertyName="group"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel="Is Checked"
                    icon={checkboxIcon}
                    label="CHECKED"
                    target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                    propertyName="isChecked"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
