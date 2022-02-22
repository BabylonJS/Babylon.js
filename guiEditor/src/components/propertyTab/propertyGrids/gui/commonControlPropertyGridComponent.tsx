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
import { makeTargetsProxy, conflictingValuesPlaceholder } from "../../../../sharedUiComponents/lines/targetsProxy";
import { CoordinateHelper, DimensionProperties } from "../../../../diagram/coordinateHelper";
import { Vector2 } from "babylonjs/Maths/math";

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

type ControlProperty = keyof Control | "_paddingLeft" | "_paddingRight" | "_paddingTop" | "_paddingBottom";

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {

    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);

        const controls = this.props.controls;
        for (let control of controls) {
            const transformed = this._getTransformedReferenceCoordinate(control);
            if (!control.metadata) {
                control.metadata = {};
            }
            control.metadata._previousCenter = transformed;
        }
    }

    private _getTransformedReferenceCoordinate(control : Control) {
        const nodeMatrix = CoordinateHelper.getNodeMatrix(control);
        const transformed = new Vector2(1, 1);
        nodeMatrix.transformCoordinates(1, 1, transformed);
        return transformed;
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

        const showTextProperties = (firstControl instanceof Container || firstControl.typeName === "TextBlock");

        const proxy = makeTargetsProxy(controls, this.props.onPropertyChangedObservable);
        const getValue = (propertyName: ControlProperty) => {
            const values = (controls.map(control => control[propertyName]._value));
            const firstValue = values[0];
            if (values.every((value: any) => value === firstValue)) {
                const units = getUnitString(propertyName);
                if (units === "%") {
                    return (firstValue * 100).toFixed(2);
                } else if (units === "PX") {
                    return firstValue.toFixed(2);
                } else {
                    return conflictingValuesPlaceholder;
                }
            } else {
                return conflictingValuesPlaceholder;
            }
        };
        const getUnitString = (propertyName: ControlProperty) => {
            const units = (controls.map(control => control[propertyName]._unit));
            const firstUnit = units[0];
            if (units.every((unit: any) => unit === firstUnit)) {
                if (firstUnit === ValueAndUnit.UNITMODE_PIXEL) {
                    return "PX";
                } else {
                    return "%";
                }
            } else {
                return conflictingValuesPlaceholder;
            }
        };
        const convertUnits = (unit: string, property: DimensionProperties) => {
            for(const control of controls) {
                if (unit === "PX") {
                    CoordinateHelper.convertToPercentage(control, [property], this.props.onPropertyChangedObservable);
                } else {
                    CoordinateHelper.convertToPixels(control, [property], this.props.onPropertyChangedObservable);
                }
                this.forceUpdate();
            }
        }
        const updateTransformCentersAndPositions = () => {
            for (let control of controls) {
                let transformed = this._getTransformedReferenceCoordinate(control);
                if (control.metadata._previousCenter) {
                    // transform
                    const diff = transformed.subtract(control.metadata._previousCenter);
                    control.leftInPixels -= diff.x;
                    control.topInPixels -= diff.y;

                    transformed = this._getTransformedReferenceCoordinate(control);
                }

                control.metadata._previousCenter = transformed;
            }
            this.forceUpdate();
        };

        const updateTransformCenters = () => {
            for (let control of controls) {
                let transformed = this._getTransformedReferenceCoordinate(control);

                control.metadata._previousCenter = transformed;
            }
        };

        return (
            <div>
                <div className="ge-divider alignment-bar">
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
                        delayInput={true}
                        value={getValue("_left")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("left", newValue);
                            updateTransformCenters();
                        }}
                        unit={getUnitString("_left")}
                        onUnitClicked={unit => convertUnits(unit, "left")}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="Y"
                        delayInput={true}
                        value={getValue("_top")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("top", newValue);
                            updateTransformCenters();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit={getUnitString("_top")}
                        onUnitClicked={unit => convertUnits(unit, "top")}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Scale"}
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label="W"
                        delayInput={true}
                        value={getValue("_width")}
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
                            this._checkAndUpdateValues("width", newValue);
                            updateTransformCenters();
                        }}
                        unit={getUnitString("_width")}
                        onUnitClicked={unit => convertUnits(unit, "width")}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="H"
                        delayInput={true}
                        value={getValue("_height")}
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
                            this._checkAndUpdateValues("height", newValue);
                            updateTransformCenters();
                        }}
                        unit={getUnitString("_height")}
                        onUnitClicked={unit => convertUnits(unit, "height")}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Padding"}
                        icon={verticalMarginIcon}
                        lockObject={this.props.lockObject}
                        label="T"
                        delayInput={true}
                        value={getValue("_paddingTop")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingTop", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit={getUnitString("_paddingTop")}
                        onUnitClicked={unit => convertUnits(unit, "paddingTop")}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="B"
                        delayInput={true}
                        value={getValue("_paddingBottom")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingBottom", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit={getUnitString("_paddingBottom")}
                        onUnitClicked={unit => convertUnits(unit, "paddingBottom")}
                    />
                </div>
                <div className="ge-divider">
                    <TextInputLineComponent
                        numbersOnly={true}
                        iconLabel={"Horizontal Margins"}
                        icon={horizontalMarginIcon}
                        lockObject={this.props.lockObject}
                        label="L"
                        delayInput={true}
                        value={getValue("_paddingLeft")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingLeft", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit={getUnitString("_paddingLeft")}
                        onUnitClicked={unit => convertUnits(unit, "paddingLeft")}
                    />
                    <TextInputLineComponent
                        numbersOnly={true}
                        lockObject={this.props.lockObject}
                        label="R"
                        delayInput={true}
                        value={getValue("_paddingRight")}
                        onChange={(newValue) => {
                            this._checkAndUpdateValues("paddingRight", newValue);
                            this._markChildrenAsDirty();
                        }}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit={getUnitString("_paddingRight")}
                        onUnitClicked={unit => convertUnits(unit, "paddingRight")}
                    />
                </div>
                <CheckBoxLineComponent
                    iconLabel={"Padding does not affect the parameters of this control, only the descendants of this control."}
                    icon={descendantsOnlyPaddingIcon}
                    label="PAD ONLY DESCENDENTS"
                    target={proxy}
                    propertyName="descendentsOnlyPadding"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="TRANSFORMATION" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Transform Center"}
                        icon={positionIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={proxy}
                        propertyName="transformCenterX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={updateTransformCentersAndPositions}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={proxy}
                        propertyName="transformCenterY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={updateTransformCentersAndPositions}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Scale"}
                        icon={scaleIcon}
                        lockObject={this.props.lockObject}
                        label="X"
                        target={proxy}
                        propertyName="scaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={updateTransformCenters}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={proxy}
                        propertyName="scaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={updateTransformCenters}
                    />
                </div>
                <SliderLineComponent
                    iconLabel={"Rotation"}
                    lockObject={this.props.lockObject}
                    icon={rotationIcon}
                    label="R"
                    target={proxy}
                    decimalCount={2}
                    propertyName="rotation"
                    minimum={0}
                    maximum={2 * Math.PI}
                    step={0.01}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onChange={updateTransformCenters}
                />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="APPEARANCE" value=" " color="grey"></TextLineComponent>
                {controls.every(control => control.color !== undefined && control.typeName !== "Image" && control.typeName !== "ImageBasedSlider" && control.typeName !== "ColorPicker") && (
                    <ColorLineComponent
                        iconLabel={"Color"}
                        icon={colorIcon}
                        lockObject={this.props.lockObject}
                        label="Outline Color"
                        target={proxy}
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
                        target={proxy}
                        propertyName="background"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                )}
                <SliderLineComponent
                    lockObject={this.props.lockObject}
                    iconLabel={"Alpha"}
                    icon={alphaIcon}
                    label=" "
                    target={proxy}
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
                    target={proxy}
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
                        target={proxy}
                        propertyName="shadowOffsetX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit="PX"
                        unitLocked={true}
                    />
                    <FloatLineComponent
                        iconLabel={"Shadow Offset Y"}
                        icon={shadowOffsetYIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        propertyName="shadowOffsetY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        unit="PX"
                        unitLocked={true}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Shadow Blur"}
                        icon={shadowBlurIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        propertyName="shadowBlur"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                {showTextProperties && <>
                    <hr className="ge" />
                    <TextLineComponent tooltip="" label="FONT STYLE" value=" " color="grey"></TextLineComponent>
                    <div className="ge-divider-single">
                        <TextInputLineComponent
                            iconLabel={"Font Family"}
                            icon={fontFamilyIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={proxy}
                            propertyName="fontFamily"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                    <div className="ge-divider-single">
                        <TextInputLineComponent
                            iconLabel={"Font Size"}
                            icon={fontSizeIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={proxy}
                            numbersOnly={true}
                            propertyName="fontSize"
                            onChange={(newValue) => this._checkAndUpdateValues("fontSize", newValue)}
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                    <div className="ge-divider-single">
                        <TextInputLineComponent
                            iconLabel={"Font Weight"}
                            icon={shadowBlurIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={proxy}
                            propertyName="fontWeight"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                    <div className="ge-divider-single">
                        <TextInputLineComponent
                            iconLabel={"Font Style"}
                            icon={fontStyleIcon}
                            lockObject={this.props.lockObject}
                            label=""
                            target={proxy}
                            propertyName="fontStyle"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    </div>
                </>}
            </div>
        );
    }
}
