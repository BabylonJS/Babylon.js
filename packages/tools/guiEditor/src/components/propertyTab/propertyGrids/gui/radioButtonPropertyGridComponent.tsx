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
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface IRadioButtonPropertyGridComponentProps {
    radioButtons: RadioButton[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
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
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="RADIO BUTTON" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Stroke Weight"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        unit={<UnitButton unit="PX" locked />}
                        arrows
                        min={0}
                        digits={2}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={scaleIcon} label={"Check Size Ratio"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                        propertyName="checkSizeRatio"
                        unit={<UnitButton unit="PX" locked />}
                        arrows
                        min={0}
                        digits={2}
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={strokeWeightIcon} label={"Name of Group"} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)}
                        propertyName="group"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={checkboxIcon} label={"Is Checked"} />
                    <CheckBoxLineComponent label="CHECKED" target={makeTargetsProxy(radioButtons, this.props.onPropertyChangedObservable)} propertyName="isChecked" />
                </div>
            </div>
        );
    }
}
