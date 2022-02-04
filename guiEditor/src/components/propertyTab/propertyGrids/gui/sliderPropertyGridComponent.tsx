import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Slider } from "babylonjs-gui/2D/controls/sliders/slider";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { ColorLineComponent } from "../../../../sharedUiComponents/lines/colorLineComponent";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

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
    sliders: (Slider | ImageBasedSlider)[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SliderPropertyGridComponent extends React.Component<ISliderPropertyGridComponentProps> {
    constructor(props: ISliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const sliders = this.props.sliders;

        return (
            <div className="pane">
                <hr />
                <TextLineComponent label="SLIDER" value=" " color="grey"></TextLineComponent>
                {sliders.every(slider => slider.typeName === "Slider") && <ColorLineComponent
                    iconLabel={"Border color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="borderColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />}
                <CheckBoxLineComponent
                    iconLabel={"Display thumb"}
                    icon={showThumbIcon}
                    label="DISPLAY THUMB"
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="displayThumb"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Thumb circle"}
                    icon={thumbCircleIcon}
                    label="THUMB CIRCLE"
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="isThumbCircle"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Thumb clamped"}
                    icon={clampSliderValueIcon}
                    label="THUMB CLAMPED"
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="isThumbClamped"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Vertical"}
                    icon={verticalSliderIcon}
                    label="VERTICAL"
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="isVertical"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <div className="ge-divider">
                <TextInputLineComponent
                    iconLabel={"Thumb width"}
                    icon={thumbWidthIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="thumbWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    iconLabel={"Bar offset"}
                    icon={barOffsetIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
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
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="minimum"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Maximum"}
                    icon={sliderValueMaximumIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
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
                    target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                    propertyName="value"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
            </div>
        );
    }
}
