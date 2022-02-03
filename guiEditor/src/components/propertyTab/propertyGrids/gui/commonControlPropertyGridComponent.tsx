import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { SliderLineComponent } from "../../../../sharedUiComponents/lines/sliderLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { CommandButtonComponent } from "../../../commandButtonComponent";
import { Image } from "babylonjs-gui/2D/controls/image";
import { TextBlock } from "babylonjs-gui/2D/controls/textBlock";
import { Container } from "babylonjs-gui/2D/controls/container";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { ValueAndUnit } from "babylonjs-gui/2D/valueAndUnit";
import { ColorLineComponent } from "../../../../sharedUiComponents/lines/colorLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");
const positionIcon: string = require("../../../../sharedUiComponents/imgs/positionIcon.svg");
const fontFamilyIcon: string = require("../../../../sharedUiComponents/imgs/fontFamilyIcon.svg");
const alphaIcon: string = require("../../../../sharedUiComponents/imgs/alphaIcon.svg");
const fontSizeIcon: string = require("../../../../sharedUiComponents/imgs/fontSizeIcon.svg");
const fontStyleIcon: string = require("../../../../sharedUiComponents/imgs/fontStyleIcon.svg");
const rotationIcon: string = require("../../../../sharedUiComponents/imgs/rotationIcon.svg");
const scaleIcon: string = require("../../../../sharedUiComponents/imgs/scaleIcon.svg");
const shadowBlurIcon: string = require("../../../../sharedUiComponents/imgs/shadowBlurIcon.svg");
const horizontalMarginIcon: string = require("../../../../sharedUiComponents/imgs/horizontalMarginIcon.svg");
const shadowColorIcon: string = require("../../../../sharedUiComponents/imgs/shadowColorIcon.svg");
const shadowOffsetXIcon: string = require("../../../../sharedUiComponents/imgs/shadowOffsetXIcon.svg");
const shadowOffsetYIcon: string = require("../../../../sharedUiComponents/imgs/shadowOffsetYIcon.svg");
const colorIcon: string = require("../../../../sharedUiComponents/imgs/colorIcon.svg");
const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");

const hAlignCenterIcon: string = require("../../../../sharedUiComponents/imgs/hAlignCenterIcon.svg");
const hAlignLeftIcon: string = require("../../../../sharedUiComponents/imgs/hAlignLeftIcon.svg");
const hAlignRightIcon: string = require("../../../../sharedUiComponents/imgs/hAlignRightIcon.svg");
const vAlignCenterIcon: string = require("../../../../sharedUiComponents/imgs/vAlignCenterIcon.svg");
const vAlignTopIcon: string = require("../../../../sharedUiComponents/imgs/vAlignTopIcon.svg");
const vAlignBottomIcon: string = require("../../../../sharedUiComponents/imgs/vAlignBottomIcon.svg");
const descendantsOnlyPaddingIcon: string = require("../../../../sharedUiComponents/imgs/descendantsOnlyPaddingIcon.svg");

interface ICommonControlPropertyGridComponentProps {
    controls: Control[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
    private _width : String | Number = 0;
    private _height : String | Number = 0;

    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);
    }

    private _updateAlignment(alignment: string, value: number) {
        for (const control of this.props.controls) {
            if (control.typeName === "TextBlock" && (control as TextBlock).resizeToFit === false) {
                (control as any)["text" + alignment.charAt(0).toUpperCase() + alignment.slice(1)] = value;
            } else {
                (control as any)[alignment] = value;
            }
        }
        this.forceUpdate();
    }

    private _checkAndUpdateValues(propertyName: string, value: string) {

        for (const control of this.props.controls) {
            // checking the previous value unit to see what it was.
            const vau = (control as any)["_" +propertyName];
            let percentage = (vau as ValueAndUnit).isPercentage;
            
            // now checking if the new string contains either a px or a % sign in case we need to change the unit.
            let negative = value.charAt(0) === "-";
            if (value.charAt(value.length - 1) === "%") {
                percentage = true;
            } else if (value.charAt(value.length - 1) === "x" && value.charAt(value.length - 2) === "p") {
                percentage = false;
            }

            if (control.parent?.typeName === "StackPanel") {
                percentage = false;
            }

            let newValue = value.match(/([\d\.\,]+)/g)?.[0];
            if (!newValue) {
                newValue = "0";
            }
            newValue = (negative ? "-" : "") + newValue;
            newValue += percentage ? "%" : "px";

            (control as any)[propertyName] = newValue;
        }
        this.forceUpdate();
    }

    private _markChildrenAsDirty() {
        for(const control of this.props.controls) {
            if (control instanceof Container)
                (control as Container)._children.forEach(child => {
                    child._markAsDirty();
            });
        }
    }

    render() {
        const controls = this.props.controls;
        const firstControl = controls[0];
        let horizontalAlignment = firstControl.horizontalAlignment;
        let verticalAlignment = firstControl.verticalAlignment;
        for (const control of controls) {
            if (control.horizontalAlignment !== horizontalAlignment) {
                horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            }
            if (control.verticalAlignment !== verticalAlignment) {
                verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            }
        }
        if (controls.every(control => control.typeName === "TextBlock" && (control as TextBlock).resizeToFit === false)) {
            horizontalAlignment = (firstControl as TextBlock).textHorizontalAlignment;
            verticalAlignment = (firstControl as TextBlock).textVerticalAlignment;
        }
        this._width = firstControl.width;
        this._height = firstControl.height;
        for (const control of controls) {
            if (control.width !== this._width) {
                this._width = "";
            }
            if (control.height !== this._height) {
                this._height = "";
            }
        }

        const showTextProperties = (firstControl instanceof Container || firstControl.typeName === "TextBlock");

        return (
            <div>
                <div className="ge-divider">
                    <CommandButtonComponent
                        tooltip="Left"
                        icon={hAlignLeftIcon}
                        shortcut=""
                        isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_LEFT}
                        onClick={() => {
                            this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_LEFT);
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Center"
                        icon={hAlignCenterIcon}
                        shortcut=""
                        isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER}
                        onClick={() => {
                            this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_CENTER);
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Right"
                        icon={hAlignRightIcon}
                        shortcut=""
                        isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_RIGHT}
                        onClick={() => {
                            this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_RIGHT);
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Top"
                        icon={vAlignTopIcon}
                        shortcut=""
                        isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_TOP}
                        onClick={() => {
                            this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_TOP);
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Center"
                        icon={vAlignCenterIcon}
                        shortcut=""
                        isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER}
                        onClick={() => {
                            this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_CENTER);
                        }}
                    />
                    <CommandButtonComponent
                        tooltip="Bottom"
                        icon={vAlignBottomIcon}
                        shortcut=""
                        isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_BOTTOM}
                        onClick={() => {
                            this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_BOTTOM);
                        }}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Position"}
                        icon={positionIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        delayInput={true}
                        propertyName="left"
                        onChange={(newValue) => this._checkAndUpdateValues("left", newValue)}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        delayInput={true}
                        propertyName="top"
                        onChange={(newValue) => this._checkAndUpdateValues("top", newValue)}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Scale"}
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label="W"
                        target={this}
                        delayInput={true}
                        propertyName="_width"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            for(const control of controls) {
                                if (control.typeName === "Image") {
                                    (control as Image).autoScale = false;
                                }
                                else if (control instanceof Container) {
                                    (control as Container).adaptWidthToChildren = false;
                                }
                                else if (control.typeName === "ColorPicker") {
                                    if (newValue === "0" || newValue === "-") {
                                        newValue = "1";
                                    }
                                }
                            }
                            this._width = newValue;
                            this._checkAndUpdateValues("width", this._width.toString());
                        }}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="H"
                        target={this}
                        delayInput={true}
                        propertyName="_height"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            for(const control of controls) {
                                if (control.typeName === "Image") {
                                    (control as Image).autoScale = false;
                                }
                                else if (control instanceof Container) {
                                    (control as Container).adaptHeightToChildren = false;
                                }
                                else if (control.typeName === "ColorPicker") {
                                    if (newValue === "0" || newValue === "-") {
                                        newValue = "1";
                                    }
                                }
                            }
                            this._height = newValue;
                            this._checkAndUpdateValues("height", this._height.toString());
                        }}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Padding"}
                        icon={verticalMarginIcon}
                        lockObject={this.props.lockObject}
                        label="B"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="paddingBottom"
                        delayInput={true}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingBottom", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="T"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="paddingTop"
                        delayInput={true}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingTop", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Horizontal Margins"}
                        icon={horizontalMarginIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="paddingLeft"
                        delayInput={true}
                        onChange={(newValue) => { this._checkAndUpdateValues("paddingLeft", newValue); this._markChildrenAsDirty(); }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="R"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        delayInput={true}
                        propertyName="paddingRight"
                        onChange={(newValue) => { this._checkAndUpdateValues("paddingRight", newValue); this._markChildrenAsDirty(); }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider-shot">
                    <CheckBoxLineComponent
                        iconLabel={"Padding does not affect the parameters of this control, only the descendants of this control."}
                        icon={descendantsOnlyPaddingIcon}
                        label=""
                        target={makeTargetsProxy(controls, false, this.props.onPropertyChangedObservable)}
                        propertyName="descendentsOnlyPadding"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <hr className="ge" />
                <TextLineComponent tooltip="" label="TRANSFORMATION" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Transform Center"}
                        icon={positionIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={makeTargetsProxy(controls, 0.5, this.props.onPropertyChangedObservable)}
                        propertyName="transformCenterX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={makeTargetsProxy(controls, 0.5, this.props.onPropertyChangedObservable)}
                        propertyName="transformCenterY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Scale"}
                        icon={scaleIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="scaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="scaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <SliderLineComponent
                    iconLabel={"Rotation"}
                    lockObject={this.props.lockObject}
                    icon={rotationIcon}
                    label="R"
                    target={makeTargetsProxy(controls, 0, this.props.onPropertyChangedObservable)}
                    decimalCount={2}
                    propertyName="rotation"
                    minimum={0}
                    maximum={2 * Math.PI}
                    step={0.01}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="APPEARANCE" value=" " color="grey"></TextLineComponent>
                {controls.every(control => control.color !== undefined && control.typeName !== "Image" && control.typeName !== "ImageBasedSlider" && control.typeName !== "ColorPicker") && (
                    <ColorLineComponent
                        iconLabel={"Color"}
                        icon={colorIcon}
                        lockObject={this.props.lockObject}
                        label="Outline Color"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="color"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                {controls.every(control => (control as any).background !== undefined) && (
                    <ColorLineComponent
                        iconLabel={"Background"}
                        icon={fillColorIcon}
                        lockObject={this.props.lockObject}
                        label="Background Color"
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="background"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                <SliderLineComponent
                    lockObject={this.props.lockObject}
                    iconLabel={"Alpha"}
                    icon={alphaIcon}
                    label=""
                    target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                    propertyName="alpha"
                    minimum={0}
                    maximum={1}
                    step={0.01}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Shadow Color"}
                    icon={shadowColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                    propertyName="shadowColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    disableAlpha={true}
                />
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Shadow Offset X"}
                        icon={shadowOffsetXIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="shadowOffsetX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel={"Shadow Offset Y"}
                        icon={shadowOffsetYIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="shadowOffsetY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <div className="ge-divider-short">
                    <FloatLineComponent
                        iconLabel={"Shadow Blur"}
                        icon={shadowBlurIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                        propertyName="shadowBlur"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                {showTextProperties && <>
                    <hr className="ge" />
                    <TextLineComponent tooltip="" label="FONT STYLE" value=" " color="grey"></TextLineComponent>
                    <div className="ge-divider">
                        <TextInputLineComponent
                            iconLabel={"Font Family"}
                            icon={fontFamilyIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                            propertyName="fontFamily"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <TextInputLineComponent
                            iconLabel={"Font Size"}
                            icon={fontSizeIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                            numbersOnly={true}
                            propertyName="fontSize"
                            onChange={(newValue) => this._checkAndUpdateValues("fontSize", newValue)}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                    <div className="ge-divider">
                        <TextInputLineComponent
                            iconLabel={"Font Weight"}
                            icon={shadowBlurIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                            propertyName="fontWeight"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <TextInputLineComponent
                            iconLabel={"Font Style"}
                            icon={fontStyleIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={makeTargetsProxy(controls, "", this.props.onPropertyChangedObservable)}
                            propertyName="fontStyle"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                </>}
            </div>
        );
    }
}
