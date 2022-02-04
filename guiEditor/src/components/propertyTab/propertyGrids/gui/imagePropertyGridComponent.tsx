import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Image } from "babylonjs-gui/2D/controls/image";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { OptionsLineComponent } from "../../../../sharedUiComponents/lines/optionsLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const stretchFillIcon: string = require("../../../../sharedUiComponents/imgs/stretchFillIcon.svg");
const imageLinkIcon: string = require("../../../../sharedUiComponents/imgs/imageLinkIcon.svg");
const cropIcon: string = require("../../../../sharedUiComponents/imgs/cropIcon.svg");
const cellIDIcon: string = require("../../../../sharedUiComponents/imgs/cellIDIcon.svg");
const autoResizeIcon: string = require("../../../../sharedUiComponents/imgs/autoResizeIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");

interface IImagePropertyGridComponentProps {
    images: Image[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
    constructor(props: IImagePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const images = this.props.images;
        const image = images[0]; // for nine slice

        var stretchOptions = [
            { label: "None", value: Image.STRETCH_NONE },
            { label: "Fill", value: Image.STRETCH_FILL },
            { label: "Uniform", value: Image.STRETCH_UNIFORM },
            { label: "Extend", value: Image.STRETCH_EXTEND },
            { label: "NinePatch", value: Image.STRETCH_NINE_PATCH },
        ];

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={images} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="IMAGE" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    iconLabel={"Source"}
                    icon={imageLinkIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Crop"}
                        icon={cropIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        propertyName="sourceLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="T"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        propertyName="sourceTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="R"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        icon={cropIcon}
                        iconLabel={"Crop"}
                        propertyName="sourceWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="B"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        propertyName="sourceHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <CheckBoxLineComponent
                    iconLabel={"Autoscale"}
                    icon={autoResizeIcon}
                    label="AUTOSCALE"
                    target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                    propertyName="autoScale"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <OptionsLineComponent
                    iconLabel={"Stretch"}
                    icon={stretchFillIcon}
                    label=""
                    options={stretchOptions}
                    target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                    propertyName="stretch"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onSelect={(value) => this.setState({ mode: value })}
                />
                {images.length === 1 && image.stretch === Image.STRETCH_NINE_PATCH && <>
                    <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Slice"}
                        icon={cropIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        target={image}
                        propertyName="sliceLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {image.populateNinePatchSlicesFromImage = false; this.forceUpdate()} }
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="R"
                        target={image}
                        propertyName="sliceRight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {image.populateNinePatchSlicesFromImage = false; this.forceUpdate()} }
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="T"
                        target={image}
                        icon={cropIcon}
                        iconLabel={"Slice"}
                        propertyName="sliceTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {image.populateNinePatchSlicesFromImage = false; this.forceUpdate()} }
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="B"
                        target={image}
                        propertyName="sliceBottom"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {image.populateNinePatchSlicesFromImage = false; this.forceUpdate()} }
                    />
                </div>
                <CheckBoxLineComponent
                    iconLabel={"populateNinePatchSlicesFromImage"}
                    icon={autoResizeIcon}
                    label="SLICE FROM IMAGE"
                    target={image}
                    propertyName="populateNinePatchSlicesFromImage"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onValueChanged={() =>{ this.forceUpdate(); image._markAsDirty();} }
                />
                </>
                }
                <hr />
                <TextLineComponent label="ANIMATION SHEET" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider-short">
                <FloatLineComponent
                    iconLabel={"Cell Id"}
                    icon={cellIDIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    isInteger={true}
                    target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                    propertyName="cellId"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label="W"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        propertyName="cellWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="H"
                        target={makeTargetsProxy(images, this.props.onPropertyChangedObservable)}
                        propertyName="cellHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
            </div>
        );
    }
}
