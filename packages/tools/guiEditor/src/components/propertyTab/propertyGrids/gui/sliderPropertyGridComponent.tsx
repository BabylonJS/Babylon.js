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
import widthIcon from "shared-ui-components/imgs/widthIcon.svg";
import clampSliderValueIcon from "shared-ui-components/imgs/clampSliderValueIcon.svg";
import showThumbIcon from "shared-ui-components/imgs/showThumbIcon.svg";
import barOffsetIcon from "shared-ui-components/imgs/barOffsetIcon.svg";
import thumbCircleIcon from "shared-ui-components/imgs/thumbCircleIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";

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
        const { sliders, onPropertyChangedObservable } = this.props;
        const proxy = makeTargetsProxy(sliders, onPropertyChangedObservable);

        return (
            <div className="pane">
                <hr />
                <TextLineComponent label="SLIDER" value=" " color="grey"></TextLineComponent>
                {sliders.every((slider) => slider.typeName === "Slider") && (
                    <div className="ge-divider">
                        <IconComponent icon={colorIcon} label="Border Color" />
                        <ColorLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="borderColor" />
                    </div>
                )}
                <div className="ge-divider">
                    <IconComponent icon={verticalSliderIcon} label="Vertical" />
                    <CheckBoxLineComponent label="VERTICAL" target={proxy} propertyName="isVertical" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={barOffsetIcon} label="Bar Offset" />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="barOffset" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={sliderValueMinimumIcon} label="Minimum Value" />
                    <FloatLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="minimum" arrows={true} />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={sliderValueMaximumIcon} label="Maximum Value" />
                    <FloatLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="maximum" arrows={true} />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={sliderValueIcon} label="Initial Value" />
                    <FloatLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="value" arrows={true} />
                </div>
                <hr />
                <TextLineComponent label="THUMB" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={showThumbIcon} label="Display Thumb" />
                    <CheckBoxLineComponent label="DISPLAY THUMB" target={proxy} propertyName="displayThumb" onValueChanged={() => this.forceUpdate()} />
                </div>
                {proxy.displayThumb && (
                    <>
                        <div className="ge-divider">
                            <IconComponent icon={thumbCircleIcon} label="Thumb Circular" />
                            <CheckBoxLineComponent label="CIRCULAR" target={proxy} propertyName="isThumbCircle" />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={clampSliderValueIcon} label="Thumb Clamped to Edges" />
                            <CheckBoxLineComponent label="CLAMPED" target={proxy} propertyName="isThumbClamped" />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={widthIcon} label="Width" />
                            <TextInputLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="thumbWidth" />
                        </div>
                    </>
                )}
            </div>
        );
    }
}
