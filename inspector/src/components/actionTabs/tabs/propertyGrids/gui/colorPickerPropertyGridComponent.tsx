import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Color3LineComponent } from "../../../../../sharedUiComponents/lines/color3LineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';

interface IColorPickerPropertyGridComponentProps {
    globalState: GlobalState;
    colorPicker: ColorPicker;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
    constructor(props: IColorPickerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const colorPicker = this.props.colorPicker;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} control={colorPicker} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="COLORPICKER">
                    <Color3LineComponent label="Color" target={colorPicker} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}