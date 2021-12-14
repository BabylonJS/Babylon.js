import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";

const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");
const verticalSliderIcon: string = require("../../../../sharedUiComponents/imgs/verticalSliderIcon.svg");
const sliderValueIcon: string = require("../../../../sharedUiComponents/imgs/sliderValueIcon.svg");
const sliderValueMaximumIcon: string = require("../../../../sharedUiComponents/imgs/sliderValueMaximumIcon.svg");
const sliderValueMinimumIcon: string = require("../../../../sharedUiComponents/imgs/sliderValueMinimumIcon.svg");
const thumbWidthIcon: string = require("../../../../sharedUiComponents/imgs/thumbWidthIcon.svg");
const clampSliderValueIcon: string = require("../../../../sharedUiComponents/imgs/clampSliderValueIcon.svg");
const showThumbIcon: string = require("../../../../sharedUiComponents/imgs/showThumbIcon.svg");
const barOffsetIcon: string = require("../../../../sharedUiComponents/imgs/barOffsetIcon.svg");
const thumbCircleIcon: string = require("../../../../sharedUiComponents/imgs/thumbCircleIcon.svg");

interface ISliderPropertyGridComponentProps {
    slider: Slider | ImageBasedSlider;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
    constructor(props: ISliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const slider = this.props.slider;

        return (
            <div className="pane">
                <hr />
                <TextLineComponent label="SLIDER" value=" " color="grey"></TextLineComponent>
                {slider.typeName === "Slider" && <Color3LineComponent
                    iconLabel={"Border color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="borderColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />}
                <CheckBoxLineComponent
                    iconLabel={"Display thumb"}
                    icon={showThumbIcon}
                    label="DISPLAY THUMB"
                    target={slider}
                    propertyName="displayThumb"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Thumb circle"}
                    icon={thumbCircleIcon}
                    label="THUMB CIRCLE"
                    target={slider}
                    propertyName="isThumbCircle"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Thumb clamped"}
                    icon={clampSliderValueIcon}
                    label="THUMB CLAMPED"
                    target={slider}
                    propertyName="isThumbClamped"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Vertical"}
                    icon={verticalSliderIcon}
                    label="VERTICAL"
                    target={slider}
                    propertyName="isVertical"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <div className="ge-divider">
                <TextInputLineComponent
                    iconLabel={"Thumb width"}
                    icon={thumbWidthIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="thumbWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Bar offset"}
                    icon={barOffsetIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="barOffset"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
                <div className="ge-divider">
                <FloatLineComponent
                    iconLabel={"Minimum"}
                    icon={sliderValueMinimumIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="minimum"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Maximum"}
                    icon={sliderValueMaximumIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="maximum"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
                <div className="ge-divider-short">
                <FloatLineComponent
                    iconLabel={"Value"}
                    icon={sliderValueIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={slider}
                    propertyName="value"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
            </div>
        );
    }
}
