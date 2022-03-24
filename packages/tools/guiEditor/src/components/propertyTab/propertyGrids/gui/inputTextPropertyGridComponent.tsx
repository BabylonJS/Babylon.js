import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { InputText } from "gui/2D/controls/inputText";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import verticalMarginIcon from "shared-ui-components/imgs/verticalMarginIcon.svg";
import fontFamilyIcon from "shared-ui-components/imgs/fontFamilyIcon.svg";
import alphaIcon from "shared-ui-components/imgs/alphaIcon.svg";
import colorIcon from "shared-ui-components/imgs/colorIcon.svg";

interface IInputTextPropertyGridComponentProps {
    inputTexts: InputText[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
    constructor(props: IInputTextPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const inputTexts = this.props.inputTexts;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={inputTexts} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="INPUT TEXT" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    iconLabel={"Text"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="text"
                />
                <TextInputLineComponent
                    iconLabel={"Prompt"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="promptMessage"
                />
                <TextInputLineComponent
                    iconLabel={"Max width"}
                    icon={sizeIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="maxWidth"
                />
                <ColorLineComponent
                    iconLabel={"Highlight color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="textHighlightColor"
                />
                <SliderLineComponent
                    iconLabel={"Highligher opacity"}
                    icon={alphaIcon}
                    label=""
                    minimum={0}
                    maximum={1}
                    step={0.01}
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="highligherOpacity"
                />
                <CheckBoxLineComponent
                    iconLabel={"On focus select all"}
                    icon={verticalMarginIcon}
                    label="ON FOCUS SELECT ALL"
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="onFocusSelectAll"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Focused background"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="focusedBackground"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Margin"}
                    icon={verticalMarginIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="margin"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Auto stretch width"}
                    icon={sizeIcon}
                    label="AUTO STRETCH"
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="autoStretchWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Thickness"}
                    icon={strokeWeightIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="thickness"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Placeholder text"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="placeholderText"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Placeholder color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                    propertyName="placeholderColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
