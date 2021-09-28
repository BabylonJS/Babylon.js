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
import { DataStorage } from "babylonjs/Misc/dataStorage";

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


interface ICommonControlPropertyGridComponentProps {
    control: Control;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
    private _width = this.props.control.width;
    private _height = this.props.control.height;
    private _responsive: boolean = false;
    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);
        this._responsive = DataStorage.ReadBoolean("Responsive", true);
    }

    private _updateAlignment(alignment: string, value: number) {
        const control = this.props.control;
        if (control.typeName === "TextBlock" && (this.props.control as TextBlock).resizeToFit === false) {
            (this.props.control as any)["text" + alignment.charAt(0).toUpperCase() + alignment.slice(1)] = value;
        }
        else {
            (this.props.control as any)[alignment] = value;
        }
        this.forceUpdate();
    }

    private _checkAndUpdateValues(propertyName: string, value: string) {
        //check if it contains either a px or a % sign
        let percentage = this._responsive;
        let negative = value.charAt(0) === '-';
        if (value.charAt(value.length - 1) === '%') {
            percentage = true;
        }
        else if (value.charAt(value.length - 1) === 'x' && value.charAt(value.length - 2) === 'p') {
            percentage = false;
        }

        let newValue = value.match(/([\d\.\,]+)/g)?.[0];
        if (!newValue) {
            newValue = '0';
        }
        newValue = (negative ? '-' : '') + newValue;
        newValue += percentage ? '%' : 'px';

        (this.props.control as any)[propertyName] = newValue;
        this.forceUpdate();
    }

    render() {
        const control = this.props.control;
        var horizontalAlignment = this.props.control.horizontalAlignment;
        var verticalAlignment = this.props.control.verticalAlignment;
        if (control.typeName === "TextBlock" && (this.props.control as TextBlock).resizeToFit === false) {
            horizontalAlignment = (this.props.control as TextBlock).textHorizontalAlignment;
            verticalAlignment = (this.props.control as TextBlock).textVerticalAlignment;
        }
        this._width = this.props.control.width;
        this._height = this.props.control.height;

        return (
            <div>
                <div className="divider">
                    <CommandButtonComponent tooltip="Left" icon={hAlignLeftIcon} shortcut="" isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_LEFT}
                        onClick={() => { this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_LEFT); }} />
                    <CommandButtonComponent tooltip="Center" icon={hAlignCenterIcon} shortcut="" isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER}
                        onClick={() => { this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_CENTER); }} />
                    <CommandButtonComponent tooltip="Right" icon={hAlignRightIcon} shortcut="" isActive={horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_RIGHT}
                        onClick={() => { this._updateAlignment("horizontalAlignment", Control.HORIZONTAL_ALIGNMENT_RIGHT); }} />
                    <CommandButtonComponent tooltip="Top" icon={vAlignTopIcon} shortcut="" isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_TOP}
                        onClick={() => { this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_TOP); }} />
                    <CommandButtonComponent tooltip="Center" icon={vAlignCenterIcon} shortcut="" isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER}
                        onClick={() => { this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_CENTER); }} />
                    <CommandButtonComponent tooltip="Center" icon={vAlignBottomIcon} shortcut="" isActive={verticalAlignment === Control.VERTICAL_ALIGNMENT_BOTTOM}
                        onClick={() => { this._updateAlignment("verticalAlignment", Control.VERTICAL_ALIGNMENT_BOTTOM); }} />
                </div>
                <div className="divider">
                    <TextInputLineComponent numbersOnly={true} iconLabel={"Position"} icon={positionIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="left" onChange={(newValue) => this._checkAndUpdateValues("left", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent numbersOnly={true} lockObject={this.props.lockObject} label="Y" target={control} propertyName="top" onChange={(newValue) => this._checkAndUpdateValues("top", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent numbersOnly={true} iconLabel={"Scale"} icon={sizeIcon} lockObject={this.props.lockObject} label="W" target={this} propertyName="_width" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {

                            if (control.typeName === "Image") {
                                (control as Image).autoScale = false;
                            }
                            else if (this.props.control.typeName === "ColorPicker") {
                                if (newValue === '0' || newValue === '-') {
                                    newValue = "1";
                                }
                            }
                            this._width = newValue;
                            this._checkAndUpdateValues("width", this._width.toString());
                        }
                        } />
                    <TextInputLineComponent numbersOnly={true} lockObject={this.props.lockObject} label="H" target={this} propertyName="_height" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            if (control.typeName === "Image") {
                                (control as Image).autoScale = false;
                            }
                            else if (this.props.control.typeName === "ColorPicker") {
                                if (newValue === "0" || newValue === "-") {
                                    newValue = "1";
                                }
                            }
                            this._height = newValue;
                            this._checkAndUpdateValues("height", this._height.toString());
                        }
                        } />
                </div>
                <div className="divider">
                    <TextInputLineComponent numbersOnly={true} iconLabel={"Vertical Margins"} icon={verticalMarginIcon} lockObject={this.props.lockObject} label="B" target={control} propertyName="paddingBottom" onChange={(newValue) => this._checkAndUpdateValues("paddingBottom", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent numbersOnly={true} lockObject={this.props.lockObject} label="T" target={control} propertyName="paddingTop" onChange={(newValue) => this._checkAndUpdateValues("paddingTop", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent numbersOnly={true} iconLabel={"Horizontal Margins"} icon={horizontalMarginIcon} lockObject={this.props.lockObject} label="L" target={control} propertyName="paddingLeft" onChange={(newValue) => this._checkAndUpdateValues("paddingLeft", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent numbersOnly={true} lockObject={this.props.lockObject} label="R" target={control} propertyName="paddingRight" onChange={(newValue) => this._checkAndUpdateValues("paddingRight", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <hr className="ge" />
                <TextLineComponent tooltip="" label="TRANSFORMATION" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                    <FloatLineComponent iconLabel={"Trasnsform Center"} icon={positionIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="transformCenterX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="transformCenterY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <FloatLineComponent iconLabel={"Scale"} icon={scaleIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="scaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="scaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <SliderLineComponent icon={rotationIcon} label="R" target={control} decimalCount={2} propertyName="rotation" minimum={0} maximum={2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="APPEARANCE" value=" " color="grey"></TextLineComponent>
                {
                    (control as any).color !== undefined &&
                    <TextInputLineComponent iconLabel={"Color"} icon={colorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="color" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            if (newValue === "") { control.color = "Transparent" }
                        }} />
                }
                {
                    (control as any).background !== undefined &&
                    <TextInputLineComponent iconLabel={"Background"} icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="background" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={(newValue) => {
                            if (newValue === "") { (control as any).background = "Transparent" }
                        }} />
                }
                <SliderLineComponent iconLabel={"Alpha"} icon={alphaIcon} label="" target={control} propertyName="alpha" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent iconLabel={"Shadow Color"} icon={shadowColorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <div className="divider">
                    <FloatLineComponent iconLabel={"Shadow Offset X"} icon={shadowOffsetXIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowOffsetX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent iconLabel={"Shadow Offset Y"} icon={shadowOffsetYIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowOffsetY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <FloatLineComponent iconLabel={"Shadow Blur"} icon={shadowBlurIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowBlur" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr className="ge" />
                <TextLineComponent tooltip="" label="FONT STYLE" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Font Family"} icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontFamily" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent iconLabel={"Font Size"} icon={fontSizeIcon} lockObject={this.props.lockObject} label="" target={control} numbersOnly={true} propertyName="fontSize" onChange={(newValue) => this._checkAndUpdateValues("fontSize", newValue)} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Font Weight"} icon={shadowBlurIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontWeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent iconLabel={"Font Style"} icon={fontStyleIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontStyle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
            </div>
        );
    }
}