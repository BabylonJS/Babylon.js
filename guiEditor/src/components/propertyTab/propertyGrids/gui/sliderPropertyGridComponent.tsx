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
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";

const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const scaleIcon: string = require("../../../../sharedUiComponents/imgs/scaleIcon.svg");
const horizontalMarginIcon: string = require("../../../../sharedUiComponents/imgs/horizontalMarginIcon.svg");;
const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");
const vAlignCenterIcon: string = require("../../../../sharedUiComponents/imgs/vAlignCenterIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");

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
                <Color3LineComponent iconLabel={"Border color"} icon={colorIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="borderColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Display thumb"} icon={clipContentsIcon} label="" target={slider} propertyName="displayThumb" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Thumb circle"} icon={clipContentsIcon} label="" target={slider} propertyName="isThumbCircle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Vertical"} icon={vAlignCenterIcon} label="" target={slider} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent iconLabel={"Thumb clamped"} icon={clipContentsIcon} label="" target={slider} propertyName="isThumbClamped" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Bar offset"} icon={clipContentsIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="barOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Thumb width"} icon={sizeIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="thumbWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Minimum"} icon={scaleIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="minimum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Maximum"} icon={scaleIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="maximum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Value"} icon={horizontalMarginIcon} lockObject={this.props.lockObject} label="" target={slider} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}