import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LineContainerComponent } from "../../../../sharedUiComponents/lines/lineContainerComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ImageBasedSlider } from "babylonjs-gui/2D/controls/sliders/imageBasedSlider";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";

interface IImageBasedSliderPropertyGridComponentProps {
    imageBasedSlider: ImageBasedSlider,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ImageBasedSliderPropertyGridComponent extends React.Component<IImageBasedSliderPropertyGridComponentProps> {
    constructor(props: IImageBasedSliderPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const imageBasedSlider = this.props.imageBasedSlider;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent  lockObject={this.props.lockObject} control={imageBasedSlider} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent title="IMAGE BASED SLIDER">
                    <CheckBoxLineComponent label="Display thumb" target={imageBasedSlider} propertyName="displayThumb" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Vertical" target={imageBasedSlider} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Thumb clamped" target={imageBasedSlider} propertyName="isThumbClamped" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Bar offset" target={imageBasedSlider} propertyName="barOffset" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Thumb width" target={imageBasedSlider} propertyName="thumbWidth" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Minimum" target={imageBasedSlider} propertyName="minimum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Maximum" target={imageBasedSlider} propertyName="maximum" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Value" target={imageBasedSlider} propertyName="value" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}