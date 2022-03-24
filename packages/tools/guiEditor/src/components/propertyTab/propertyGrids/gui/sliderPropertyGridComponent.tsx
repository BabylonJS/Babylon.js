import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Slider } from "gui/2D/controls/sliders/slider";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import type { ImageBasedSlider } from "gui/2D/controls/sliders/imageBasedSlider";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import verticalSliderIcon from "shared-ui-components/imgs/verticalSliderIcon.svg";
import sliderValueIcon from "shared-ui-components/imgs/sliderValueIcon.svg";
import sliderValueMaximumIcon from "shared-ui-components/imgs/sliderValueMaximumIcon.svg";
import sliderValueMinimumIcon from "shared-ui-components/imgs/sliderValueMinimumIcon.svg";
import thumbWidthIcon from "shared-ui-components/imgs/thumbWidthIcon.svg";
import clampSliderValueIcon from "shared-ui-components/imgs/clampSliderValueIcon.svg";
import showThumbIcon from "shared-ui-components/imgs/showThumbIcon.svg";
import barOffsetIcon from "shared-ui-components/imgs/barOffsetIcon.svg";
import thumbCircleIcon from "shared-ui-components/imgs/thumbCircleIcon.svg";

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
                {sliders.every((slider) => slider.typeName === "Slider") && (
                    <ColorLineComponent
                        iconLabel={"Border color"}
                        icon={colorIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(sliders, this.props.onPropertyChangedObservable)}
                        propertyName="borderColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
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
                <div className="ge-divider double">
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
