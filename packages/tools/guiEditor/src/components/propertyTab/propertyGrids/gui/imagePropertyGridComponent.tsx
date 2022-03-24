import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Image } from "gui/2D/controls/image";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import stretchFillIcon from "shared-ui-components/imgs/stretchFillIcon.svg";
import imageLinkIcon from "shared-ui-components/imgs/imageLinkIcon.svg";
import cropIcon from "shared-ui-components/imgs/cropIcon.svg";
import cellIDIcon from "shared-ui-components/imgs/cellIDIcon.svg";
import autoResizeIcon from "shared-ui-components/imgs/autoResizeIcon.svg";
import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import animationSheetIcon from "shared-ui-components/imgs/animationSheetIcon.svg";

interface IImagePropertyGridComponentProps {
    images: Image[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ImagePropertyGridComponent extends React.Component<IImagePropertyGridComponentProps> {
    constructor(props: IImagePropertyGridComponentProps) {
        super(props);
    }

    toggleAnimations(on: boolean) {
        for (const image of this.props.images) {
            if (on) {
                image.cellId = 0;
                image.cellWidth = image.imageWidth;
                image.cellHeight = image.imageHeight;
            } else {
                image.cellId = -1;
            }
        }
    }

    getMaxCells() {
        let maxCells = Number.MAX_SAFE_INTEGER;
        for (const image of this.props.images) {
            if (image.cellWidth === 0 || image.cellHeight === 0) continue;
            const cols = Math.ceil(image.imageWidth / image.cellWidth);
            const rows = Math.ceil(image.imageHeight / image.cellHeight);
            const max = cols * rows - 1;
            if (max < maxCells) maxCells = max;
        }
        return maxCells;
    }

    updateCellSize() {
        const maxCells = this.getMaxCells();
        for (const image of this.props.images) {
            if (image.cellId > maxCells) {
                image.cellId = maxCells;
            }
        }
        this.forceUpdate();
    }

    render() {
        const images = this.props.images;
        const image = images[0]; // for nine slice

        const proxy = makeTargetsProxy(images, this.props.onPropertyChangedObservable);

        const stretchOptions = [
            { label: "None", value: Image.STRETCH_NONE },
            { label: "Fill", value: Image.STRETCH_FILL },
            { label: "Uniform", value: Image.STRETCH_UNIFORM },
            { label: "Extend", value: Image.STRETCH_EXTEND },
            { label: "NinePatch", value: Image.STRETCH_NINE_PATCH },
        ];

        const animationSheet = images.every((image) => image.cellId !== -1);
        const maxCells = this.getMaxCells();
        const maxCellWidth = Math.max(...images.map((image) => image.imageWidth));
        const maxCellHeight = Math.max(...images.map((image) => image.imageHeight));

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
                    target={proxy}
                    propertyName="source"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Crop"}
                        icon={cropIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        target={proxy}
                        propertyName="sourceLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="T"
                        target={proxy}
                        propertyName="sourceTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="R"
                        target={proxy}
                        icon={cropIcon}
                        iconLabel={"Crop"}
                        propertyName="sourceWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="B"
                        target={proxy}
                        propertyName="sourceHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <CheckBoxLineComponent
                    iconLabel={"Autoscale"}
                    icon={autoResizeIcon}
                    label="AUTOSCALE"
                    target={proxy}
                    propertyName="autoScale"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <OptionsLineComponent
                    iconLabel={"Stretch"}
                    icon={stretchFillIcon}
                    label=""
                    options={stretchOptions}
                    target={proxy}
                    propertyName="stretch"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onSelect={(value) => this.setState({ mode: value })}
                />
                {images.length === 1 && image.stretch === Image.STRETCH_NINE_PATCH && (
                    <>
                        <div className="ge-divider">
                            <FloatLineComponent
                                iconLabel={"Slice"}
                                icon={cropIcon}
                                lockObject={this.props.lockObject}
                                label="L"
                                target={image}
                                propertyName="sliceLeft"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onChange={() => {
                                    image.populateNinePatchSlicesFromImage = false;
                                    this.forceUpdate();
                                }}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="R"
                                target={image}
                                propertyName="sliceRight"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onChange={() => {
                                    image.populateNinePatchSlicesFromImage = false;
                                    this.forceUpdate();
                                }}
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
                                onChange={() => {
                                    image.populateNinePatchSlicesFromImage = false;
                                    this.forceUpdate();
                                }}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="B"
                                target={image}
                                propertyName="sliceBottom"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onChange={() => {
                                    image.populateNinePatchSlicesFromImage = false;
                                    this.forceUpdate();
                                }}
                            />
                        </div>
                        <CheckBoxLineComponent
                            iconLabel={"populateNinePatchSlicesFromImage"}
                            icon={autoResizeIcon}
                            label="SLICE FROM IMAGE"
                            target={image}
                            propertyName="populateNinePatchSlicesFromImage"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            onValueChanged={() => {
                                this.forceUpdate();
                                image._markAsDirty();
                            }}
                        />
                    </>
                )}
                <hr />
                <CheckBoxLineComponent
                    iconLabel={"animationSheet"}
                    icon={animationSheetIcon}
                    label="ANIMATION SHEET"
                    target={makeTargetsProxy(images, this.props.onPropertyChangedObservable, (target: Image) => target.cellId !== -1)}
                    onValueChanged={() => {
                        this.toggleAnimations(!animationSheet);
                        this.forceUpdate();
                    }}
                />
                {animationSheet && (
                    <>
                        <div className="ge-divider double">
                            <FloatLineComponent
                                iconLabel={"Cell Id"}
                                icon={cellIDIcon}
                                lockObject={this.props.lockObject}
                                label=""
                                isInteger={true}
                                target={proxy}
                                propertyName="cellId"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                min={0}
                                max={maxCells}
                            />
                        </div>
                        <div className="ge-divider">
                            <FloatLineComponent
                                icon={sizeIcon}
                                lockObject={this.props.lockObject}
                                label="W"
                                target={proxy}
                                propertyName="cellWidth"
                                isInteger={true}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onChange={() => this.updateCellSize()}
                                min={1}
                                max={maxCellWidth}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="H"
                                target={proxy}
                                propertyName="cellHeight"
                                isInteger={true}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                onChange={() => this.updateCellSize()}
                                min={1}
                                max={maxCellHeight}
                            />
                        </div>
                    </>
                )}
            </div>
        );
    }
}
