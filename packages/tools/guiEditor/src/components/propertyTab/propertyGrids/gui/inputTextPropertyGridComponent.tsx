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
import widthIcon from "shared-ui-components/imgs/widthIcon.svg";
import alphaIcon from "shared-ui-components/imgs/alphaIcon.svg";
import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import textIcon from "shared-ui-components/imgs/textIcon.svg";
import textInputIcon from "shared-ui-components/imgs/textInputIcon.svg";
import autoStretchWidthIcon from "shared-ui-components/imgs/autoStretchWidthIcon.svg";
import marginsIcon from "shared-ui-components/imgs/marginsIcon.svg";
import selectAllIcon from "shared-ui-components/imgs/selectAllIcon.svg";
import highlightIcon from "shared-ui-components/imgs/highlightIcon.svg";
import textPlaceholderIcon from "shared-ui-components/imgs/textPlaceholderIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface IInputTextPropertyGridComponentProps {
    inputTexts: InputText[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class InputTextPropertyGridComponent extends React.Component<IInputTextPropertyGridComponentProps> {
    constructor(props: IInputTextPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { inputTexts, onPropertyChangedObservable, lockObject } = this.props;
        const proxy = makeTargetsProxy(inputTexts, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={lockObject}
                    controls={inputTexts}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="INPUT TEXT" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={textIcon} label="Text" />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} propertyName="text" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={textInputIcon} label="Prompt Text" />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} propertyName="promptMessage" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={widthIcon} label="Max Width" />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} propertyName="maxWidth" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={marginsIcon} label="Margins" />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} propertyName="margin" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label="Border Thickness" />
                    <FloatLineComponent lockObject={lockObject} label="" target={proxy} propertyName="thickness" unit={<UnitButton unit="PX" locked />} arrows min={0} digits={2} />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={autoStretchWidthIcon} label="Automatically Stretch Width" />
                    <CheckBoxLineComponent label="AUTO STRETCH" target={proxy} propertyName="autoStretchWidth" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={selectAllIcon} label="When Input is Focus, Select All" />
                    <CheckBoxLineComponent label="ON FOCUS, SELECT ALL" target={proxy} propertyName="onFocusSelectAll" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={highlightIcon} label="Highlight Color" />
                    <ColorLineComponent lockObject={lockObject} label="" target={proxy} propertyName="textHighlightColor" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={alphaIcon} label="Highlight Opacity" />
                    <SliderLineComponent lockObject={lockObject} label="" minimum={0} maximum={1} step={0.01} target={proxy} propertyName="highligherOpacity" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label="Background Color when Focused" />
                    <ColorLineComponent lockObject={lockObject} label="" target={proxy} propertyName="focusedBackground" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={textPlaceholderIcon} label="Placeholder Text" />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} propertyName="placeholderText" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={colorIcon} label="Placeholder Color" />
                    <ColorLineComponent lockObject={lockObject} label="" target={proxy} propertyName="placeholderColor" />
                </div>
            </div>
        );
    }
}
