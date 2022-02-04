import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { InputText } from "babylonjs-gui/2D/controls/inputText";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { SliderLineComponent } from "../../../../sharedUiComponents/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";
import { ColorLineComponent } from "../../../../sharedUiComponents/lines/colorLineComponent";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");
const fontFamilyIcon: string = require("../../../../sharedUiComponents/imgs/fontFamilyIcon.svg");
const alphaIcon: string = require("../../../../sharedUiComponents/imgs/alphaIcon.svg");
const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");

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
                    target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable, false)}
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
