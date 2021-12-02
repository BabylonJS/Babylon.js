import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";

interface ISliderGenericPropertyGridComponentProps {
    slider: Slider;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SliderGenericPropertyGridComponent extends React.Component<ISliderGenericPropertyGridComponentProps> {
    constructor(props: ISliderGenericPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const slider = this.props.slider;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={slider} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderPropertyGridComponent slider={slider} lockObject={this.props.lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
