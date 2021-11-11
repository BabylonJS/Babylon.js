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
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");
const fontFamilyIcon: string = require("../../../../sharedUiComponents/imgs/fontFamilyIcon.svg");
const alphaIcon: string = require("../../../../sharedUiComponents/imgs/alphaIcon.svg");
const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");


interface IInputTextPropertyGridComponentProps {
    inputText: InputText;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
    constructor(props: IInputTextPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const inputText = this.props.inputText;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={inputText} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="INPUT TEXT" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent iconLabel={"Text"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Prompt"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="promptMessage" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Max width"} icon={sizeIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="maxWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent iconLabel={"Highlight color"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="textHighlightColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderLineComponent iconLabel={"Highligher opacity"} icon={alphaIcon} label="" minimum={0} maximum={1} step={0.01} target={inputText} propertyName="highligherOpacity" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"On focus select all"} icon={verticalMarginIcon} label="" target={inputText} propertyName="onFocusSelectAll" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Focused background"} icon={colorIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="focusedBackground" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Margin"} icon={verticalMarginIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="margin" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Auto stretch width"} icon={sizeIcon} label="" target={inputText} propertyName="autoStretchWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Thickness"} icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Placeholder text"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="placeholderText" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent iconLabel={"Placeholder color"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={inputText} propertyName="placeholderColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}