import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";

const thumbImageLinkIcon: string = require("../../../../sharedUiComponents/imgs/thumbImageLinkIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");

interface IImageBasedSliderPropertyGridComponentProps {
    imageBasedSlider: ImageBasedSlider;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
    constructor(props: IImageBasedSliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const imageBasedSlider = this.props.imageBasedSlider;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    control={imageBasedSlider}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="IMAGE LINKS" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    icon={clipContentsIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Thumb Image Link"
                    target={imageBasedSlider.thumbImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={clipContentsIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Value Bar Image Link"
                    target={imageBasedSlider.valueBarImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={clipContentsIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Background Image Link"
                    target={imageBasedSlider.backgroundImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="SLIDER" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent
                    label="Display thumb"
                    target={imageBasedSlider}
                    propertyName="displayThumb"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent label="Vertical" target={imageBasedSlider} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <CheckBoxLineComponent
                    label="Thumb clamped"
                    target={imageBasedSlider}
                    propertyName="isThumbClamped"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    lockObject={this.props.lockObject}
                    label="Bar offset"
                    target={imageBasedSlider}
                    propertyName="barOffset"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    lockObject={this.props.lockObject}
                    label="Thumb width"
                    target={imageBasedSlider}
                    propertyName="thumbWidth"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    lockObject={this.props.lockObject}
                    label="Minimum"
                    target={imageBasedSlider}
                    propertyName="minimum"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    lockObject={this.props.lockObject}
                    label="Maximum"
                    target={imageBasedSlider}
                    propertyName="maximum"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    lockObject={this.props.lockObject}
                    label="Value"
                    target={imageBasedSlider}
                    propertyName="value"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
