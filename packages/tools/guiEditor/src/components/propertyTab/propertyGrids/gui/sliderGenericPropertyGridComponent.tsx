import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Slider } from "gui/2D/controls/sliders/slider";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";
import type { GlobalState } from "../../../../globalState";

interface ISliderGenericPropertyGridComponentProps {
    sliders: Slider[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class SliderGenericPropertyGridComponent extends React.Component<ISliderGenericPropertyGridComponentProps> {
    constructor(props: ISliderGenericPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const sliders = this.props.sliders;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={sliders}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <SliderPropertyGridComponent sliders={sliders} lockObject={this.props.lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
