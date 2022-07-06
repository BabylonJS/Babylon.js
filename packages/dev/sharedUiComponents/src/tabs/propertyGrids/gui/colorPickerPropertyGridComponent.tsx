import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../../../tabs/propertyGrids/gui/commonControlPropertyGridComponent";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import type { ColorPicker } from "gui/2D/controls/colorpicker";
import { Color3LineComponent } from "../../../lines/color3LineComponent";
import type { LockObject } from "../lockObject";

interface IColorPickerPropertyGridComponentProps {
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
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={colorPicker} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="COLORPICKER">
                    <Color3LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={colorPicker}
                        propertyName="value"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
