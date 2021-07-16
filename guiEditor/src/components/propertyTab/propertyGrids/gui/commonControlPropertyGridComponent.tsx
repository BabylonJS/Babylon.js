import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { LineContainerComponent } from "../../../../sharedUiComponents/lines/lineContainerComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { SliderLineComponent } from "../../../../sharedUiComponents/lines/sliderLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextInputLineComponent } from "../../../../sharedUiComponents/lines/textInputLineComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "../../../../sharedUiComponents/lines/optionsLineComponent";

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


interface ICommonControlPropertyGridComponentProps {
    control: Control;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);
    }

    renderGridInformation() {
        const control = this.props.control;

        if (!control.parent) {
            return null;
        }

        const gridParent = control.parent;

        if ((gridParent as any).rowCount === undefined) {
            return null;
        }

        const grid = gridParent as Grid;
        const childCellInfo = grid.getChildCellInfo(control);

        if (childCellInfo === undefined) {
            return null;
        }

        const cellInfos = childCellInfo.split(":");

        return (
            <LineContainerComponent title="GRID">
                <TextLineComponent label={"Row"} value={cellInfos[0]} />
                <TextLineComponent label={"Column"} value={cellInfos[1]} />
            </LineContainerComponent>
        );
    }

    render() {
        const control = this.props.control;

        var horizontalOptions = [
            { label: "Left", value: Control.HORIZONTAL_ALIGNMENT_LEFT },
            { label: "Right", value: Control.HORIZONTAL_ALIGNMENT_RIGHT },
            { label: "Center", value: Control.HORIZONTAL_ALIGNMENT_CENTER },
        ];

        var verticalOptions = [
            { label: "Top", value: Control.VERTICAL_ALIGNMENT_TOP },
            { label: "Bottom", value: Control.VERTICAL_ALIGNMENT_BOTTOM },
            { label: "Center", value: Control.VERTICAL_ALIGNMENT_CENTER },
        ];

        return (
            <div>
                <div className="divider">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={control} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="ZIndex" target={control} propertyName="zIndex" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <hr/>
                <div className="divider">
                    <OptionsLineComponent label="H" options={horizontalOptions} target={control} propertyName="horizontalAlignment" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="V" options={verticalOptions} target={control} propertyName="verticalAlignment" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent icon={positionIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="left" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="top" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent icon={sizeIcon} lockObject={this.props.lockObject} label="W" target={control} propertyName="width" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="H" target={control} propertyName="height" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent icon={verticalMarginIcon} lockObject={this.props.lockObject} label="L" target={control} propertyName="paddingLeft" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="T" target={control} propertyName="paddingTop" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent icon={horizontalMarginIcon} lockObject={this.props.lockObject} label="R" target={control} propertyName="paddingRight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="B" target={control} propertyName="paddingBottom" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <hr/>
                <TextLineComponent label="TRANSFORMATION" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                    <FloatLineComponent icon={positionIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="transformCenterX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="transformCenterY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <FloatLineComponent icon={scaleIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="scaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="scaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <SliderLineComponent icon={rotationIcon} label="R" target={control} propertyName="rotation" minimum={0} maximum={2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr/>
                <TextLineComponent label="APPEARANCE" value=" " color="grey"></TextLineComponent>
                {
                    (control as any).color !== undefined &&
                    <TextInputLineComponent icon={colorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="color" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                {
                    (control as any).background !== undefined &&
                    <TextInputLineComponent icon={fillColorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="background" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                }
                <SliderLineComponent icon={alphaIcon} label="" target={control} propertyName="alpha" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <TextInputLineComponent icon={shadowColorIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <div className="divider">
                    <FloatLineComponent icon={shadowOffsetXIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowOffsetX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent icon={shadowOffsetYIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowOffsetY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <FloatLineComponent icon={shadowBlurIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="shadowBlur" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr/>
                <TextLineComponent label="FONT STYLE" value=" " color="grey"></TextLineComponent>
                <div className="divider">
                    <TextInputLineComponent icon={fontFamilyIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontFamily" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent icon={fontSizeIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent icon={shadowBlurIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontWeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent icon={fontStyleIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontStyle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                {
                    this.renderGridInformation()
                }
            </div>
        );
    }
}