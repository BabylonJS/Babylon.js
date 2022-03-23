import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { InputText } from "gui/2D/controls/inputText";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
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
import { IconComponent } from "shared-ui-components/lines/iconComponent";

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
                <div className="ge-divider">
                    <IconComponent icon={fontFamilyIcon} label="Text" />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="text"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fontFamilyIcon} label="Prompt Text" />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="promptMessage"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={sizeIcon} label="Max Width" />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="maxWidth"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label="Highlight Color" />
                    <ColorLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="textHighlightColor"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={alphaIcon} label="Highlight Opacity" />
                    <SliderLineComponent
                        label=" "
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="highligherOpacity"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={verticalMarginIcon} label="When Input is Focus, Select All" />
                    <CheckBoxLineComponent
                        label="ON FOCUS, SELECT ALL"
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="onFocusSelectAll"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={colorIcon} label="Background Color when Focused" />
                    <ColorLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="focusedBackground"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={verticalMarginIcon} label="Margin" />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="margin"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={sizeIcon} label="Automatically Stretch Width" />
                    <CheckBoxLineComponent
                        label="AUTO STRETCH"
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="autoStretchWidth"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={strokeWeightIcon} label="Border Thickness" />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fontFamilyIcon} label="Placeholder Text" />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="placeholderText"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label="Placeholder Color" />
                    <ColorLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={makeTargetsProxy(inputTexts, this.props.onPropertyChangedObservable)}
                        propertyName="placeholderColor"
                    />
                </div>
            </div>
        );
    }
}
