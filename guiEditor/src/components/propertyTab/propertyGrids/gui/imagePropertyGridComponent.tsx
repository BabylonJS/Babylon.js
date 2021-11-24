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

const stretchFillIcon: string = require("../../../../sharedUiComponents/imgs/stretchFillIcon.svg");
const imageLinkIcon: string = require("../../../../sharedUiComponents/imgs/imageLinkIcon.svg");
const cropIcon: string = require("../../../../sharedUiComponents/imgs/cropIcon.svg");
const cellIDIcon: string = require("../../../../sharedUiComponents/imgs/cellIDIcon.svg");
const autoResizeIcon: string = require("../../../../sharedUiComponents/imgs/autoResizeIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");

interface IImagePropertyGridComponentProps {
    image: Image;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
    constructor(props: IImagePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const image = this.props.image;

        var stretchOptions = [
            { label: "None", value: Image.STRETCH_NONE },
            { label: "Fill", value: Image.STRETCH_FILL },
            { label: "Uniform", value: Image.STRETCH_UNIFORM },
            { label: "Extend", value: Image.STRETCH_EXTEND },
            { label: "NinePatch", value: Image.STRETCH_NINE_PATCH },
        ];

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={image} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="IMAGE" value=" " color="grey"></TextLineComponent>
                <TextInputLineComponent
                    iconLabel={"Source"}
                    icon={imageLinkIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={image}
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Crop"}
                        icon={cropIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        target={image}
                        propertyName="sourceLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="T"
                        target={image}
                        propertyName="sourceTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="R"
                        target={image}
                        icon={cropIcon}
                        iconLabel={"Crop"}
                        propertyName="sourceWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="B"
                        target={image}
                        propertyName="sourceHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <CheckBoxLineComponent
                    iconLabel={"Autoscale"}
                    icon={autoResizeIcon}
                    label="AUTOSCALE"
                    target={image}
                    propertyName="autoScale"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <OptionsLineComponent
                    iconLabel={"Stretch"}
                    icon={stretchFillIcon}
                    label=""
                    options={stretchOptions}
                    target={image}
                    propertyName="stretch"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onSelect={(value) => this.setState({ mode: value })}
                />
                <hr />
                <TextLineComponent label="ANIMATION SHEET" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider-short">
                <FloatLineComponent
                    iconLabel={"Cell Id"}
                    icon={cellIDIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    isInteger={true}
                    target={image}
                    propertyName="cellId"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label="W"
                        target={image}
                        propertyName="cellWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="H"
                        target={image}
                        propertyName="cellHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
            </div>
        );
    }
}
