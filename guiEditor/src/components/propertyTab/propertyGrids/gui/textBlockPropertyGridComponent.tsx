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
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";

interface ITextBlockPropertyGridComponentProps {
    textBlock: TextBlock;
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
        const textBlock = this.props.textBlock;

        var wrappingOptions = [
            { label: "Clip", value: TextWrapping.Clip },
            { label: "Ellipsis", value: TextWrapping.Ellipsis },
            { label: "Word wrap", value: TextWrapping.WordWrap },
        ];

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={textBlock} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="TEXTBLOCK" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent iconLabel={"Text"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={textBlock} propertyName="text" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Resize to fit"} icon={fontFamilyIcon} label="" target={textBlock} propertyName="resizeToFit" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <OptionsLineComponent iconLabel={"Wrapping"} icon={fontFamilyIcon} label="" options={wrappingOptions} target={textBlock} propertyName="textWrapping" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Line spacing"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={textBlock} propertyName="lineSpacing" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="OUTLINE" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent iconLabel={"Outline width"} icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={textBlock} propertyName="outlineWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent iconLabel={"Outline color"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={textBlock} propertyName="outlineColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />

            </div>
        );
    }
}