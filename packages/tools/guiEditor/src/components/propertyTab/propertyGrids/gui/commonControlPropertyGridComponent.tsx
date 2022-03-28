import * as React from "react";
import type { Observable, Observer } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { Control } from "gui/2D/controls/control";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { CommandButtonComponent } from "../../../commandButtonComponent";
import type { Image } from "gui/2D/controls/image";
import type { TextBlock } from "gui/2D/controls/textBlock";
import { Container } from "gui/2D/controls/container";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { ValueAndUnit } from "gui/2D/valueAndUnit";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy, conflictingValuesPlaceholder } from "shared-ui-components/lines/targetsProxy";
import type { DimensionProperties } from "../../../../diagram/coordinateHelper";
import { CoordinateHelper } from "../../../../diagram/coordinateHelper";
import { Vector2 } from "core/Maths/math";

import type { Nullable } from "core/types";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";

import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import verticalMarginIcon from "shared-ui-components/imgs/verticalMarginIcon.svg";
import positionIcon from "shared-ui-components/imgs/positionIcon.svg";
import fontFamilyIcon from "shared-ui-components/imgs/fontFamilyIcon.svg";
import alphaIcon from "shared-ui-components/imgs/alphaIcon.svg";
import fontSizeIcon from "shared-ui-components/imgs/fontSizeIcon.svg";
import fontStyleIcon from "shared-ui-components/imgs/fontStyleIcon.svg";
import fontWeightIcon from "shared-ui-components/imgs/fontWeightIcon.svg";
import rotationIcon from "shared-ui-components/imgs/rotationIcon.svg";
import pivotIcon from "shared-ui-components/imgs/pivotIcon.svg";
import scaleIcon from "shared-ui-components/imgs/scaleIcon.svg";
import shadowBlurIcon from "shared-ui-components/imgs/shadowBlurIcon.svg";
import horizontalMarginIcon from "shared-ui-components/imgs/horizontalMarginIcon.svg";
import shadowColorIcon from "shared-ui-components/imgs/shadowColorIcon.svg";
import shadowOffsetXIcon from "shared-ui-components/imgs/shadowOffsetXIcon.svg";
import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";

import hAlignCenterIcon from "shared-ui-components/imgs/hAlignCenterIcon.svg";
import hAlignLeftIcon from "shared-ui-components/imgs/hAlignLeftIcon.svg";
import hAlignRightIcon from "shared-ui-components/imgs/hAlignRightIcon.svg";
import vAlignCenterIcon from "shared-ui-components/imgs/vAlignCenterIcon.svg";
import vAlignTopIcon from "shared-ui-components/imgs/vAlignTopIcon.svg";
import vAlignBottomIcon from "shared-ui-components/imgs/vAlignBottomIcon.svg";
import descendantsOnlyPaddingIcon from "shared-ui-components/imgs/descendantsOnlyPaddingIcon.svg";
import { StackPanel } from "gui/2D/controls/stackPanel";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";

interface ICommonControlPropertyGridComponentProps {
    controls: Control[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    hideDimensions?: boolean;
}

type ControlProperty = keyof Control | "_paddingLeft" | "_paddingRight" | "_paddingTop" | "_paddingBottom" | "_fontSize";

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
    private _onPropertyChangedObserver: Nullable<Observer<PropertyChangedEvent>> | undefined;

    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);

        const controls = this.props.controls;
        for (const control of controls) {
            const transformed = this._getTransformedReferenceCoordinate(control);
            if (!control.metadata) {
                control.metadata = {};
            }
            control.metadata._previousCenter = transformed;
        }

        this._onPropertyChangedObserver = this.props.onPropertyChangedObservable?.add((event) => {
            const isTransformEvent = event.property === "transformCenterX" || event.property === "transformCenterY";
            for (const control of controls) {
                let transformed = this._getTransformedReferenceCoordinate(control);
                if (isTransformEvent && control.metadata._previousCenter) {
                    // Calculate the difference between current center and previous center
                    const diff = transformed.subtract(control.metadata._previousCenter);
                    control.leftInPixels -= diff.x;
                    control.topInPixels -= diff.y;

                    // Update center in reference to left and top positions
                    transformed = this._getTransformedReferenceCoordinate(control);
                }

                control.metadata._previousCenter = transformed;
            }
            this.forceUpdate();
        });
    }

    private _getTransformedReferenceCoordinate(control: Control) {
        const nodeMatrix = CoordinateHelper.GetNodeMatrix(control);
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
            const vau = (control as any)["_" + propertyName];
            let percentage = (vau as ValueAndUnit).isPercentage;

            // now checking if the new string contains either a px or a % sign in case we need to change the unit.
            const negative = value.charAt(0) === "-";
            if (value.charAt(value.length - 1) === "%") {
                percentage = true;
            } else if (value.charAt(value.length - 1) === "x" && value.charAt(value.length - 2) === "p") {
                percentage = false;
            }

            if (control.parent?.typeName === "StackPanel") {
                percentage = false;
            }

            let newValue = value.match(/([\d.,]+)/g)?.[0];
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
        for (const control of this.props.controls) {
            if (control instanceof Container)
                (control as Container)._children.forEach((child) => {
                    child._markAsDirty();
                });
        }
    }

    componentWillUnmount() {
        if (this._onPropertyChangedObserver) {
            this.props.onPropertyChangedObservable?.remove(this._onPropertyChangedObserver);
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
        if (controls.every((control) => control.typeName === "TextBlock" && (control as TextBlock).resizeToFit === false)) {
            horizontalAlignment = (firstControl as TextBlock).textHorizontalAlignment;
            verticalAlignment = (firstControl as TextBlock).textVerticalAlignment;
        }

        const showTextProperties = firstControl instanceof Container || firstControl.typeName === "TextBlock";

        const proxy = makeTargetsProxy(controls, this.props.onPropertyChangedObservable);
        const getValue = (propertyName: ControlProperty) => {
            const values = controls.map((control) => control[propertyName]._value);
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
            const units = controls.map((control) => control[propertyName]._unit);
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
        const increment = (propertyName: DimensionProperties, amount: number, minimum?: number, maximum?: number) => {
            for (const control of controls) {
                const initialValue = control[propertyName];
                const initialUnit = (control as any)["_" + propertyName]._unit;
                let newValue: number = (control as any)[`${propertyName}InPixels`] + amount;
                if (minimum !== undefined && newValue < minimum) newValue = minimum;
                if (maximum !== undefined && newValue > maximum) newValue = maximum;
                (control as any)[`${propertyName}InPixels`] = newValue;
                if (initialUnit === ValueAndUnit.UNITMODE_PERCENTAGE) {
                    CoordinateHelper.ConvertToPercentage(control, [propertyName]);
                }
                this.props.onPropertyChangedObservable?.notifyObservers({
                    object: control,
                    property: propertyName,
                    initialValue: initialValue,
                    value: control[propertyName],
                });
            }
        };
        const convertUnits = (unit: string, property: DimensionProperties) => {
            for (const control of controls) {
                if (unit === "PX") {
                    CoordinateHelper.ConvertToPercentage(control, [property], this.props.onPropertyChangedObservable);
                } else {
                    CoordinateHelper.ConvertToPixels(control, [property]);
                }
                this.forceUpdate();
            }
        };

        const fontStyleOptions = [
            { label: "regular", value: 0 },
            { label: "italic", value: 1 },
            { label: "oblique", value: 2 },
        ];

        const horizontalDisabled = controls[0]?.parent?.getClassName() === "StackPanel" && !(controls[0]?.parent as StackPanel).isVertical;
        const verticalDisabled = controls[0]?.parent?.getClassName() === "StackPanel" && (controls[0]?.parent as StackPanel).isVertical;

        return (
            <div>
                {!this.props.hideDimensions && (
                    <>
                        <div className="ge-divider alignment-bar">
                            <CommandButtonComponent
                                tooltip="Left"
                                icon={hAlignLeftIcon}
                                shortcut=""
                                isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_LEFT}
                                onClick={() => {
                                    this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_LEFT);
                                }}
                                disabled={horizontalDisabled}
                            />
                            <CommandButtonComponent
                                tooltip="Center"
                                icon={hAlignCenterIcon}
                                shortcut=""
                                isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER}
                                onClick={() => {
                                    this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_CENTER);
                                }}
                                disabled={horizontalDisabled}
                            />
                            <CommandButtonComponent
                                tooltip="Right"
                                icon={hAlignRightIcon}
                                shortcut=""
                                isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_RIGHT}
                                onClick={() => {
                                    this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_RIGHT);
                                }}
                                disabled={horizontalDisabled}
                            />
                            <CommandButtonComponent
                                tooltip="Top"
                                icon={vAlignTopIcon}
                                shortcut=""
                                isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_TOP}
                                onClick={() => {
                                    this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_TOP);
                                }}
                                disabled={verticalDisabled}
                            />
                            <CommandButtonComponent
                                tooltip="Center"
                                icon={vAlignCenterIcon}
                                shortcut=""
                                isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER}
                                onClick={() => {
                                    this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_CENTER);
                                }}
                                disabled={verticalDisabled}
                            />
                            <CommandButtonComponent
                                tooltip="Bottom"
                                icon={vAlignBottomIcon}
                                shortcut=""
                                isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_BOTTOM}
                                onClick={() => {
                                    this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_BOTTOM);
                                }}
                                disabled={verticalDisabled}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={positionIcon} label={"Position"} />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="X"
                                delayInput={true}
                                value={getValue("_left")}
                                onChange={(newValue) => this._checkAndUpdateValues("left", newValue)}
                                unit={getUnitString("_left")}
                                onUnitClicked={(unit) => convertUnits(unit, "left")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("left", amount)}
                            />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="Y"
                                delayInput={true}
                                value={getValue("_top")}
                                onChange={(newValue) => this._checkAndUpdateValues("top", newValue)}
                                unit={getUnitString("_top")}
                                onUnitClicked={(unit) => convertUnits(unit, "top")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("top", amount)}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={sizeIcon} label={"Size"} />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="W"
                                delayInput={true}
                                value={getValue("_width")}
                                onChange={(newValue) => {
                                    for (const control of controls) {
                                        if (control.typeName === "Image") {
                                            (control as Image).autoScale = false;
                                        } else if (control instanceof Container) {
                                            (control as Container).adaptWidthToChildren = false;
                                        } else if (control.typeName === "ColorPicker") {
                                            if (newValue === "0" || newValue === "-") {
                                                newValue = "1";
                                            }
                                        }
                                    }
                                    this._checkAndUpdateValues("width", newValue);
                                }}
                                unit={getUnitString("_width")}
                                onUnitClicked={(unit) => convertUnits(unit, "width")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("width", amount)}
                            />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="H"
                                delayInput={true}
                                value={getValue("_height")}
                                onChange={(newValue) => {
                                    for (const control of controls) {
                                        if (control.typeName === "Image") {
                                            (control as Image).autoScale = false;
                                        } else if (control instanceof Container) {
                                            (control as Container).adaptHeightToChildren = false;
                                        } else if (control.typeName === "ColorPicker") {
                                            if (newValue === "0" || newValue === "-") {
                                                newValue = "1";
                                            }
                                        }
                                    }
                                    this._checkAndUpdateValues("height", newValue);
                                }}
                                unit={getUnitString("_height")}
                                onUnitClicked={(unit) => convertUnits(unit, "height")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("height", amount)}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={verticalMarginIcon} label={"Vertical Padding"} />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="T"
                                delayInput={true}
                                value={getValue("_paddingTop")}
                                onChange={(newValue) => {
                                    this._checkAndUpdateValues("paddingTop", newValue);
                                    this._markChildrenAsDirty();
                                }}
                                unit={getUnitString("_paddingTop")}
                                onUnitClicked={(unit) => convertUnits(unit, "paddingTop")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("paddingTop", amount, 0)}
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
                                unit={getUnitString("_paddingBottom")}
                                onUnitClicked={(unit) => convertUnits(unit, "paddingBottom")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("paddingBottom", amount, 0)}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={horizontalMarginIcon} label={"Horizontal Padding"} />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="L"
                                delayInput={true}
                                value={getValue("_paddingLeft")}
                                onChange={(newValue) => {
                                    this._checkAndUpdateValues("paddingLeft", newValue);
                                    this._markChildrenAsDirty();
                                }}
                                unit={getUnitString("_paddingLeft")}
                                onUnitClicked={(unit) => convertUnits(unit, "paddingLeft")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("paddingLeft", amount)}
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
                                onUnitClicked={(unit) => convertUnits(unit, "paddingRight")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("paddingRight", amount)}
                            />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={descendantsOnlyPaddingIcon} label={"Makes padding affect only the descendants of this control"} />
                            <CheckBoxLineComponent label="ONLY PAD DESCENDANTS" target={proxy} propertyName="descendentsOnlyPadding" />
                        </div>
                        <hr className="ge" />
                    </>
                )}
                <TextLineComponent tooltip="" label="TRANSFORMATION" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={scaleIcon} label={"Scale"} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="X" target={proxy} propertyName="scaleX" arrows={true} digits={2} step="0.0005" />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={proxy} propertyName="scaleY" arrows={true} digits={2} step="0.0005" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={pivotIcon} label={"Transform Center"} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="X" target={proxy} propertyName="transformCenterX" arrows={true} digits={2} step="0.0005" />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={proxy} propertyName="transformCenterY" arrows={true} digits={2} step="0.0005" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={rotationIcon} label={"Rotation"} />
                    <SliderLineComponent
                        iconLabel={"Rotation"}
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        decimalCount={2}
                        propertyName="rotation"
                        minimum={0}
                        maximum={2 * Math.PI}
                        step={0.01}
                    />
                </div>
                <hr className="ge" />
                <TextLineComponent tooltip="" label="APPEARANCE" value=" " color="grey" />
                {controls.every(
                    (control) => control.color !== undefined && control.typeName !== "Image" && control.typeName !== "ImageBasedSlider" && control.typeName !== "ColorPicker"
                ) && (
                    <div className="ge-divider">
                        <IconComponent icon={colorIcon} label={"Outline Color"} />
                        <ColorLineComponent lockObject={this.props.lockObject} label="Outline Color" target={proxy} propertyName="color" />
                    </div>
                )}
                {controls.every((control) => (control as any).background !== undefined) && (
                    <div className="ge-divider">
                        <IconComponent icon={fillColorIcon} label={"Background Color"} />
                        <ColorLineComponent lockObject={this.props.lockObject} label="Background Color" target={proxy} propertyName="background" />
                    </div>
                )}
                <div className="ge-divider">
                    <IconComponent icon={alphaIcon} label={"Alpha"} />
                    <SliderLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="alpha" minimum={0} maximum={1} step={0.01} />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={shadowColorIcon} label={"Shadow Color"} />
                    <ColorLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="shadowColor" disableAlpha={true} />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={shadowOffsetXIcon} label={"Shadow Offset"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="X"
                        target={proxy}
                        propertyName="shadowOffsetX"
                        unit="PX"
                        unitLocked={true}
                        arrows={true}
                        step="0.1"
                        digits={2}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={proxy}
                        propertyName="shadowOffsetY"
                        unit="PX"
                        unitLocked={true}
                        arrows={true}
                        step="0.1"
                        digits={2}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={shadowBlurIcon} label={"Shadow Blur"} />
                    <FloatLineComponent lockObject={this.props.lockObject} label=" " target={proxy} propertyName="shadowBlur" arrows={true} min={0} digits={2} />
                </div>
                {showTextProperties && (
                    <>
                        <hr className="ge" />
                        <TextLineComponent tooltip="" label="FONT STYLE" value=" " color="grey"></TextLineComponent>
                        <div className="ge-divider">
                            <IconComponent icon={fontFamilyIcon} label={"Font Family"} />
                            <TextInputLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="fontFamily" />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={fontWeightIcon} label={"Font Weight"} />
                            <TextInputLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="fontWeight" />
                        </div>
                        <div className="ge-divider">
                            <IconComponent icon={fontStyleIcon} label={"Font Style"} />
                            <OptionsLineComponent
                                label=""
                                target={proxy}
                                propertyName="fontStyle"
                                options={fontStyleOptions}
                                onSelect={(newValue) => {
                                    proxy.fontStyle = ["", "italic", "oblique"][newValue];
                                }}
                                extractValue={() => {
                                    switch (proxy.fontStyle) {
                                        case "italic":
                                            return 1;
                                        case "oblique":
                                            return 2;
                                        default:
                                            return 0;
                                    }
                                }}
                            />
                        </div>
                        <div className="ge-divider double">
                            <IconComponent icon={fontSizeIcon} label={"Font Size"} />
                            <TextInputLineComponent
                                lockObject={this.props.lockObject}
                                label=""
                                numbersOnly={true}
                                value={getValue("_fontSize")}
                                onChange={(newValue) => this._checkAndUpdateValues("fontSize", newValue)}
                                unit={getUnitString("_fontSize")}
                                onUnitClicked={(unit) => convertUnits(unit, "fontSize")}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("fontSize", amount, 0)}
                            />
                        </div>
                    </>
                )}
            </div>
        );
    }
}
