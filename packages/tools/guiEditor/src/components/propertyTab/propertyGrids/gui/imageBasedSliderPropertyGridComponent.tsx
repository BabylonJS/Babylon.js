import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ImageBasedSlider } from "gui/2D/controls/sliders/imageBasedSlider";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { SliderPropertyGridComponent } from "./sliderPropertyGridComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import thumbImageLinkIcon from "shared-ui-components/imgs/thumbImageLinkIcon.svg";
import valueBarImageLinkIcon from "shared-ui-components/imgs/valueBarImageLinkIcon.svg";
import sliderBackgroundImageIcon from "shared-ui-components/imgs/sliderBackgroundImageIcon.svg";

interface IImageBasedSliderPropertyGridComponentProps {
    imageBasedSliders: ImageBasedSlider[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
    constructor(props: IImageBasedSliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const imageBasedSliders = this.props.imageBasedSliders;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={imageBasedSliders}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="IMAGE LINKS" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    icon={thumbImageLinkIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Thumb Image Link"
                    target={makeTargetsProxy(
                        imageBasedSliders.map((slider) => slider.thumbImage),
                        this.props.onPropertyChangedObservable
                    )}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={valueBarImageLinkIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Value Bar Image Link"
                    target={makeTargetsProxy(
                        imageBasedSliders.map((slider) => slider.valueBarImage),
                        this.props.onPropertyChangedObservable
                    )}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <TextInputLineComponent
                    icon={sliderBackgroundImageIcon}
                    lockObject={this.props.lockObject}
                    iconLabel="Background Image Link"
                    target={makeTargetsProxy(
                        imageBasedSliders.map((slider) => slider.backgroundImage),
                        this.props.onPropertyChangedObservable
                    )}
                    label=""
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <SliderPropertyGridComponent sliders={imageBasedSliders} lockObject={this.props.lockObject} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
