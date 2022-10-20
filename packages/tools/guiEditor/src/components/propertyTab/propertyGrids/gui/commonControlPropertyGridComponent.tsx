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
import linkedMeshOffsetIcon from "shared-ui-components/imgs/linkedMeshOffsetIcon.svg";

import hAlignCenterIcon from "shared-ui-components/imgs/hAlignCenterIcon.svg";
import hAlignLeftIcon from "shared-ui-components/imgs/hAlignLeftIcon.svg";
import hAlignRightIcon from "shared-ui-components/imgs/hAlignRightIcon.svg";
import vAlignCenterIcon from "shared-ui-components/imgs/vAlignCenterIcon.svg";
import vAlignTopIcon from "shared-ui-components/imgs/vAlignTopIcon.svg";
import vAlignBottomIcon from "shared-ui-components/imgs/vAlignBottomIcon.svg";
import descendantsOnlyPaddingIcon from "shared-ui-components/imgs/descendantsOnlyPaddingIcon.svg";
import type { StackPanel } from "gui/2D/controls/stackPanel";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { IInspectableOptions } from "core/Misc/iInspectable";

import { WorkbenchComponent } from "../../../../diagram/workbench";
import type { GlobalState } from "../../../../globalState";
import { MessageDialog } from "shared-ui-components/components/MessageDialog";

interface ICommonControlPropertyGridComponentProps {
    controls: Control[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    hideDimensions?: boolean;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}
interface ICommonControlPropertyGridComponentState {
    fontFamilyOptions: IInspectableOptions[];
    value: number;
    invalidFonts: string[];
    invalidFontAlertName?: string;
}

type ControlProperty = keyof Control | "_paddingLeft" | "_paddingRight" | "_paddingTop" | "_paddingBottom" | "_fontSize" | "_linkOffsetX" | "_linkOffsetY";

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps, ICommonControlPropertyGridComponentState> {
    private _onPropertyChangedObserver: Nullable<Observer<PropertyChangedEvent>> | undefined;
    private _onFontsParsedObserver: Nullable<Observer<void>> | undefined;

    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);
        this.state = {
            fontFamilyOptions: JSON.parse(String(window.sessionStorage.getItem("fonts"))) ?? [
                { label: "Custom Font", value: 0 },
                { label: "Arial", value: 1 },
                { label: "Verdana", value: 2 },
                { label: "Helvetica", value: 3 },
                { label: "Trebuchet MS", value: 4 },
                { label: "Times New Roman", value: 5 },
                { label: "Georgia", value: 6 },
                { label: "Garamond", value: 7 },
                { label: "Courier New", value: 8 },
                { label: "Brush Script MT", value: 9 },
            ],
            value: 0,
            invalidFonts: JSON.parse(String(window.sessionStorage.getItem("invalidFonts"))) ?? [],
            invalidFontAlertName: undefined,
        };

        const controls = this.props.controls;
        for (const control of controls) {
            const transformed = this._getTransformedReferenceCoordinate(control);
            if (!control.metadata) {
                control.metadata = {};
            }
            control.metadata._previousCenter = transformed;
        }
        this._onFontsParsedObserver = this.props.onFontsParsedObservable?.add(() => {
            this._checkFontsInLayout();
        });
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

                if (control.getClassName() === "TextBlock" && (event.property === "width" || event.property === "height")) {
                    (control as TextBlock).resizeToFit = false;
                }
            }
        });
    }

    componentWillMount() {
        this._checkFontsInLayout();
    }

    private _checkFontsInLayout() {
        const correctFonts: IInspectableOptions[] = [];
        correctFonts.push({ label: "Custom Font", value: 0 });
        for (const font of this.state.fontFamilyOptions.values()) {
            if (document.fonts.check(`12px "${font.label}"`) && font.label != "Custom Font") {
                correctFonts.push(font);
            }
        }
        const correctLabels = correctFonts.map((element) => element.label.trim().toLowerCase());

        const moreFonts = WorkbenchComponent.addedFonts;
        let invalidFontAlertName = undefined;
        const invalidFontsArray = this.state.invalidFonts.slice();
        for (let i = 0; i < moreFonts.length; i++) {
            const fontName = moreFonts[i].trim().toLowerCase();
            if (!correctLabels.includes(fontName) && document.fonts.check(`12px "${fontName}"`)) {
                correctFonts.push({ label: fontName, value: correctFonts.length + 1 });
                correctLabels.push(fontName);
            } else if (invalidFontsArray.indexOf(fontName) === -1 && !document.fonts.check(`12px "${fontName}"`)) {
                invalidFontAlertName = moreFonts[i];
                invalidFontsArray.push(fontName);
            }
        }
        this.setState({
            fontFamilyOptions: correctFonts,
            invalidFonts: invalidFontsArray,
            invalidFontAlertName,
        });
        window.sessionStorage.setItem("fonts", JSON.stringify(correctFonts));
        window.sessionStorage.setItem("invalidFonts", JSON.stringify(invalidFontsArray));
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

            const initialValue = (control as any)[propertyName];
            (control as any)[propertyName] = newValue;
            this.props.onPropertyChangedObservable?.notifyObservers({
                object: control,
                property: propertyName,
                initialValue: initialValue,
                value: (control as any)[propertyName],
            });
        }
    }

    private _markChildrenAsDirty() {
        for (const control of this.props.controls) {
            if (control instanceof Container)
                (control as Container)._children.forEach((child) => {
                    child._markAsDirty();
                });
        }
    }

    public addVal = (newVal: { label: string; value: number }, prevVal: number) => {
        if (newVal.label === "") {
            return;
        }
        if (this.props.globalState) {
            this.props.globalState.usePrevSelected = true;
        }

        (async () => {
            await document.fonts.ready;
            let displayVal = false;
            const fonts = this.state.fontFamilyOptions;
            if (!(fonts.find((element: IInspectableOptions) => element.label.toLowerCase() === newVal.label.toLowerCase()) === undefined)) {
                setTimeout(() => {
                    if (this.props.globalState) {
                        this.props.globalState.hostWindow.alert("This font is already available");
                    }
                }, 100);

                return;
            } else {
                if (!document.fonts.check(`12px "${newVal.label}"`)) {
                    //Settimeout used due to race conditions with other events
                    setTimeout(() => {
                        if (this.props.globalState) {
                            alert("This font is not supported in the browser");
                        }
                    }, 100);

                    return;
                } else {
                    fonts.push(newVal);
                    this.setState({
                        fontFamilyOptions: [...fonts],
                    });
                    displayVal = true;
                }
            }

            window.sessionStorage.setItem("fonts", JSON.stringify(this.state.fontFamilyOptions));

            if (displayVal) {
                this.selectCustomVal();
            } else {
                this.keepPrevVal(prevVal);
            }
        })();
    };

    selectCustomVal() {
        const proxy = makeTargetsProxy(this.props.controls, this.props.onPropertyChangedObservable);
        const fonts = this.state.fontFamilyOptions;

        proxy.fontFamily = fonts.at(fonts.length - 1)?.label ?? "";

        this.setState({ value: fonts.length });
        window.sessionStorage.setItem("fonts", JSON.stringify(this.state.fontFamilyOptions));
    }
    keepPrevVal(prevVal: number) {
        const proxy = makeTargetsProxy(this.props.controls, this.props.onPropertyChangedObservable);

        proxy.fontFamily = this.state.fontFamilyOptions.filter(({ value }) => value === prevVal).map(({ label }) => label)[0];

        this.setState({ value: prevVal });
    }

    componentWillUnmount() {
        if (this._onPropertyChangedObserver) {
            this.props.onPropertyChangedObservable?.remove(this._onPropertyChangedObserver);
        }
        if (this._onFontsParsedObserver) {
            this.props.onFontsParsedObservable?.remove(this._onFontsParsedObserver);
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

        const showTextProperties =
            firstControl instanceof Container || firstControl.typeName === "TextBlock" || firstControl.typeName === "InputText" || firstControl.typeName === "InputPassword";

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
                    CoordinateHelper.ConvertToPixels(control, [property], this.props.onPropertyChangedObservable);
                }
            }
        };

        const fontStyleOptions = [
            { label: "regular", value: 0 },
            { label: "italic", value: 1 },
            { label: "oblique", value: 2 },
        ];

        let horizontalDisabled = false,
            verticalDisabled = false,
            widthUnitsLocked = false,
            heightUnitsLocked = false;

        const parent = controls[0].parent;

        const fonts = this.state.fontFamilyOptions;

        if (parent?.getClassName() === "StackPanel" || parent?.getClassName() === "VirtualKeyboard") {
            if ((parent as StackPanel).isVertical) {
                verticalDisabled = true;
                heightUnitsLocked = true;
            } else {
                horizontalDisabled = true;
                widthUnitsLocked = true;
            }
        }
        return (
            <div>
                {this.state.invalidFontAlertName && (
                    <MessageDialog
                        message={"The font " + this.state.invalidFontAlertName + " is unable to load"}
                        isError={true}
                        onClose={() => {
                            this.setState({ invalidFontAlertName: undefined });
                        }}
                    />
                )}
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
                                unit={<UnitButton unit={getUnitString("_left")} onClick={(unit) => convertUnits(unit, "left")} />}
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
                                unit={<UnitButton unit={getUnitString("_top")} onClick={(unit) => convertUnits(unit, "top")} />}
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
                                unit={<UnitButton unit={getUnitString("_width")} locked={widthUnitsLocked} onClick={(unit) => convertUnits(unit, "width")} />}
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
                                unit={<UnitButton unit={getUnitString("_height")} locked={heightUnitsLocked} onClick={(unit) => convertUnits(unit, "height")} />}
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
                                unit={<UnitButton unit={getUnitString("_paddingTop")} onClick={(unit) => convertUnits(unit, "paddingTop")} />}
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
                                unit={<UnitButton unit={getUnitString("_paddingBottom")} onClick={(unit) => convertUnits(unit, "paddingBottom")} />}
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
                                unit={<UnitButton unit={getUnitString("_paddingLeft")} onClick={(unit) => convertUnits(unit, "paddingLeft")} />}
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
                                unit={<UnitButton unit={getUnitString("_paddingRight")} onClick={(unit) => convertUnits(unit, "paddingRight")} />}
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
                {parent?.name === "root" && (
                    <>
                        <TextLineComponent label="LINK OFFSET" value=" " color="grey"></TextLineComponent>
                        <div className="ge-divider double">
                            <IconComponent icon={linkedMeshOffsetIcon} label={"Link offset"} />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="X"
                                delayInput={true}
                                value={getValue("_linkOffsetX")}
                                onChange={(newValue) => this._checkAndUpdateValues("linkOffsetX", newValue)}
                                unit={<UnitButton unit={getUnitString("_linkOffsetX")} onClick={(unit) => convertUnits(unit, "linkOffsetX")} />}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("linkOffsetX", amount)}
                            />
                            <TextInputLineComponent
                                numbersOnly={true}
                                lockObject={this.props.lockObject}
                                label="Y"
                                delayInput={true}
                                value={getValue("_linkOffsetY")}
                                onChange={(newValue) => this._checkAndUpdateValues("linkOffsetY", newValue)}
                                unit={<UnitButton unit={getUnitString("_linkOffsetY")} onClick={(unit) => convertUnits(unit, "linkOffsetY")} />}
                                arrows={true}
                                arrowsIncrement={(amount) => increment("linkOffsetY", amount)}
                            />
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
                        unit={<UnitButton unit="RAD" locked />}
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
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        step="0.1"
                        digits={2}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Y"
                        target={proxy}
                        propertyName="shadowOffsetY"
                        unit={<UnitButton unit="PX" locked />}
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

                            <OptionsLineComponent
                                label=""
                                target={proxy}
                                propertyName="fontFamily"
                                valueProp={this.state.value}
                                options={fonts}
                                addVal={this.addVal}
                                fromFontDropdown={true}
                                fallbackValue={1}
                                onSelect={(newValue) => {
                                    const fontFamily = this.state.fontFamilyOptions.filter(({ value }) => value === newValue).map(({ label }) => label);
                                    proxy.fontFamily = fontFamily[0];
                                }}
                                extractValue={() => {
                                    if (this.state.invalidFonts.indexOf(proxy.fontFamily)) {
                                        return 1;
                                    }
                                    const matchingFonts = this.state.fontFamilyOptions.filter(({ label }) => label.trim().toLowerCase() === proxy.fontFamily.trim().toLowerCase());
                                    if (matchingFonts.length > 0 && matchingFonts[0].label) {
                                        return matchingFonts[0].value;
                                    } else {
                                        return -1;
                                    }
                                }}
                            />
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
                                fromFontDropdown={false}
                                onSelect={(newValue) => {
                                    proxy.fontStyle = ["", "italic", "oblique"][newValue as number];
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
                                unit={<UnitButton unit={getUnitString("_fontSize")} onClick={(unit) => convertUnits(unit, "fontSize")} />}
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
