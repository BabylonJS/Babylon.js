import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { ColorPicker } from "babylonjs-gui/2D/controls/colorpicker";
import { Color3LineComponent } from "../../../lines/color3LineComponent";

interface IColorPickerPropertyGridComponentProps {
    colorPicker: ColorPicker,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ColorPickerPropertyGridComponent extends React.Component<IColorPickerPropertyGridComponentProps> {
    constructor(props: IColorPickerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const colorPicker = this.props.colorPicker;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent control={colorPicker} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="COLORPICKER">
                    <Color3LineComponent label="Color" target={colorPicker} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}