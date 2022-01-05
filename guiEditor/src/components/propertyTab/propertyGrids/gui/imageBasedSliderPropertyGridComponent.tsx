import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";

const thumbImageLinkIcon: string = require("../../../../sharedUiComponents/imgs/thumbImageLinkIcon.svg");
const valueBarImageLinkIcon: string = require("../../../../sharedUiComponents/imgs/valueBarImageLinkIcon.svg");
const sliderBackgroundImageIcon: string = require("../../../../sharedUiComponents/imgs/sliderBackgroundImageIcon.svg");

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
                    icon={thumbImageLinkIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Thumb Image Link"
                    target={imageBasedSlider.thumbImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={valueBarImageLinkIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Value Bar Image Link"
                    target={imageBasedSlider.valueBarImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={sliderBackgroundImageIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Background Image Link"
                    target={imageBasedSlider.backgroundImage}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <SliderPropertyGridComponent slider={imageBasedSlider} lockObject={this.props.lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
