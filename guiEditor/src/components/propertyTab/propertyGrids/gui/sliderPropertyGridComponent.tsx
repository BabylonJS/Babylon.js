import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");

interface ISliderPropertyGridComponentProps {
    slider: Slider
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
    constructor(props: ISliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const slider = this.props.slider;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={slider} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="SLIDER" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent iconLabel={"Border color"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="borderColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Display thumb"} icon={fillColorIcon} label="" target={slider} propertyName="displayThumb" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Thumb circle"} icon={fillColorIcon} label="" target={slider} propertyName="isThumbCircle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Vertical"} icon={fillColorIcon} label="" target={slider} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Thumb clamped"} icon={fillColorIcon} label="" target={slider} propertyName="isThumbClamped" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Bar offset"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="barOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Thumb width"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="thumbWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Minimum"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="minimum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Maximum"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="maximum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Value"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}