import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

interface IColorPickerPropertyGridComponentProps {
    colorPickers: ColorPicker[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
    constructor(props: IColorPickerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const colorPickers = this.props.colorPickers;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={colorPickers} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="COLORPICKER" value=" " color="grey"></TextLineComponent>
                <Color3LineComponent label="Color" target={makeTargetsProxy(colorPickers, "", this.props.onPropertyChangedObservable)} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
