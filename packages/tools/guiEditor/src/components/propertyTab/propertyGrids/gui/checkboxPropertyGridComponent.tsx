import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Checkbox } from "gui/2D/controls/checkbox";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import checkBoxIconDark from "shared-ui-components/imgs/checkboxIconDark.svg";
import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface ICheckboxPropertyGridComponentProps {
    checkboxes: Checkbox[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class CheckboxPropertyGridComponent extends React.Component<ICheckboxPropertyGridComponentProps> {
    constructor(props: ICheckboxPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const checkboxes = this.props.checkboxes;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={checkboxes}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="CHECKBOX" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={sizeIcon} label={"Check Size Ratio"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(checkboxes, this.props.onPropertyChangedObservable)}
                        propertyName="checkSizeRatio"
                        min={0}
                        max={1}
                        arrows={true}
                        step="0.01"
                        digits={2}
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={checkBoxIconDark} label={"Is Checkbox Checked"} />
                    <CheckBoxLineComponent
                        label="CHECKED"
                        target={makeTargetsProxy(checkboxes, this.props.onPropertyChangedObservable)}
                        propertyName="isChecked"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Thickness"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        target={makeTargetsProxy(checkboxes, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        label=""
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        min={0}
                        digits={2}
                    />
                </div>
            </div>
        );
    }
}
