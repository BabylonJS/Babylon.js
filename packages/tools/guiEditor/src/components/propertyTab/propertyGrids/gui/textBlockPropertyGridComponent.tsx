import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { TextBlock } from "gui/2D/controls/textBlock";
import { TextWrapping } from "gui/2D/controls/textBlock";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import type { GlobalState } from "../../../../globalState";

interface ITextBlockPropertyGridComponentProps {
    textBlocks: TextBlock[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import fontFamilyIcon from "shared-ui-components/imgs/fontFamilyIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import resizeToFitIcon from "shared-ui-components/imgs/resizeToFitIcon.svg";
import wordWrapIcon from "shared-ui-components/imgs/wordWrapIcon.svg";
import lineSpacingIcon from "shared-ui-components/imgs/LineSpacingIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";

export class TextBlockPropertyGridComponent extends React.Component<ITextBlockPropertyGridComponentProps> {
    constructor(props: ITextBlockPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { onPropertyChangedObservable } = this.props;
        const textBlocks = this.props.textBlocks;
        const proxy = makeTargetsProxy(textBlocks, onPropertyChangedObservable);

        const wrappingOptions = [
            { label: "Clip", value: TextWrapping.Clip },
            { label: "Ellipsis", value: TextWrapping.Ellipsis },
            { label: "Word wrap", value: TextWrapping.WordWrap },
        ];

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={textBlocks}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="TEXTBLOCK" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={fontFamilyIcon} label="Text" />
                    <TextInputLineComponent lockObject={this.props.lockObject} label=" " target={proxy} propertyName="text" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={resizeToFitIcon} label="Automatically resize the text block to fit the size of the text" />
                    <CheckBoxLineComponent label="RESIZE TO FIT" target={proxy} propertyName="resizeToFit" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={wordWrapIcon} label="Text Wrapping" />
                    <OptionsLineComponent label=" " options={wrappingOptions} target={proxy} propertyName="textWrapping" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={lineSpacingIcon} label="Line Spacing" />
                    <TextInputLineComponent lockObject={this.props.lockObject} label=" " target={proxy} propertyName="lineSpacing" />
                </div>
                <hr />
                <TextLineComponent label="OUTLINE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label="Outline Width" />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=" "
                        target={proxy}
                        propertyName="outlineWidth"
                        arrows
                        min={0}
                        unit={<UnitButton unit="PX" locked />}
                        step="0.01"
                    />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label="Outline Color" />
                    <ColorLineComponent lockObject={this.props.lockObject} label=" " target={proxy} propertyName="outlineColor" />
                </div>
            </div>
        );
    }
}
