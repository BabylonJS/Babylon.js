import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { TextBlock, TextWrapping } from "babylonjs-gui/2D/controls/textBlock";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "../../../../sharedUiComponents/lines/optionsLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { ColorLineComponent } from "../../../../sharedUiComponents/lines/colorLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

interface ITextBlockPropertyGridComponentProps {
    textBlocks: TextBlock[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const fontFamilyIcon: string = require("../../../../sharedUiComponents/imgs/fontFamilyIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
    constructor(props: ITextBlockPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const textBlocks = this.props.textBlocks;

        const wrappingOptions = [
            { label: "Clip", value: TextWrapping.Clip },
            { label: "Ellipsis", value: TextWrapping.Ellipsis },
            { label: "Word wrap", value: TextWrapping.WordWrap },
        ];

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={textBlocks} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="TEXTBLOCK" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    iconLabel={"Text"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, "", this.props.onPropertyChangedObservable)}
                    propertyName="text"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Resize to fit"}
                    icon={fontFamilyIcon}
                    label="RESIZE TO FIT"
                    target={makeTargetsProxy(textBlocks, false, this.props.onPropertyChangedObservable)}
                    propertyName="resizeToFit"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <OptionsLineComponent
                    iconLabel={"Wrapping"}
                    icon={fontFamilyIcon}
                    label=""
                    options={wrappingOptions}
                    target={makeTargetsProxy(textBlocks, "", this.props.onPropertyChangedObservable)}
                    propertyName="textWrapping"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Line spacing"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, 0, this.props.onPropertyChangedObservable)}
                    propertyName="lineSpacing"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="OUTLINE" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent
                    iconLabel={"Outline width"}
                    icon={strokeWeightIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, 0, this.props.onPropertyChangedObservable)}
                    propertyName="outlineWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Outline color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, "", this.props.onPropertyChangedObservable)}
                    propertyName="outlineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
