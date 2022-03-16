import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Slider } from "gui/2D/controls/sliders/slider";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";

interface ISliderGenericPropertyGridComponentProps {
    sliders: Slider[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SliderGenericPropertyGridComponent extends React.Component<ISliderGenericPropertyGridComponentProps> {
    constructor(props: ISliderGenericPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const sliders = this.props.sliders;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={sliders} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <SliderPropertyGridComponent sliders={sliders} lockObject={this.props.lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
