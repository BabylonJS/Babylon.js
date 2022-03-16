import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { TextBlock, TextWrapping } from "gui/2D/controls/textBlock";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

interface ITextBlockPropertyGridComponentProps {
    textBlocks: TextBlock[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import fontFamilyIcon from "shared-ui-components/imgs/fontFamilyIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";

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
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
                    propertyName="text"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Resize to fit"}
                    icon={fontFamilyIcon}
                    label="RESIZE TO FIT"
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
                    propertyName="resizeToFit"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <OptionsLineComponent
                    iconLabel={"Wrapping"}
                    icon={fontFamilyIcon}
                    label=""
                    options={wrappingOptions}
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
                    propertyName="textWrapping"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Line spacing"}
                    icon={fontFamilyIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
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
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
                    propertyName="outlineWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Outline color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(textBlocks, this.props.onPropertyChangedObservable)}
                    propertyName="outlineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
