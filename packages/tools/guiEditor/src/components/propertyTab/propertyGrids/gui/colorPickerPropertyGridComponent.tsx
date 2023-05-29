import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { ColorPicker } from "gui/2D/controls/colorpicker";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import type { GlobalState } from "../../../../globalState";

interface IColorPickerPropertyGridComponentProps {
    colorPickers: ColorPicker[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
    constructor(props: IColorPickerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const colorPickers = this.props.colorPickers;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={colorPickers}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="COLOR PICKER" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label={"Color Picker Value"} />
                    <ColorLineComponent
                        label=""
                        target={makeTargetsProxy(colorPickers, this.props.onPropertyChangedObservable)}
                        propertyName="value"
                        disableAlpha={true}
                        lockObject={this.props.lockObject}
                    />
                </div>
            </div>
        );
    }
}
