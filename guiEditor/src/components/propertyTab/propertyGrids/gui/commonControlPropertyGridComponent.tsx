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
import { CommandButtonComponent } from "../../../commandButtonComponent";
import { Image } from "babylonjs-gui/2D/controls/image";

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

        return (
            <div>
                <div className="divider">
                    <CommandButtonComponent tooltip="Left" icon={hAlignLeftIcon} shortcut="" isActive={control.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_LEFT} onClick={() => { control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT; this.forceUpdate();}} />
                    <CommandButtonComponent tooltip="Center" icon={hAlignCenterIcon} shortcut="" isActive={control.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_CENTER} onClick={() => { control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER; this.forceUpdate(); }} />
                    <CommandButtonComponent tooltip="Right" icon={hAlignRightIcon} shortcut="" isActive={control.horizontalAlignment === Control.HORIZONTAL_ALIGNMENT_RIGHT} onClick={() => { control.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT; this.forceUpdate(); }} />
                    <CommandButtonComponent tooltip="Top" icon={vAlignTopIcon} shortcut="" isActive={control.verticalAlignment === Control.VERTICAL_ALIGNMENT_TOP} onClick={() => { control.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP; this.forceUpdate(); }} />
                    <CommandButtonComponent tooltip="Center" icon={vAlignCenterIcon} shortcut="" isActive={control.verticalAlignment === Control.VERTICAL_ALIGNMENT_CENTER} onClick={() => { control.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER; this.forceUpdate(); }} />
                    <CommandButtonComponent tooltip="Center" icon={vAlignBottomIcon} shortcut="" isActive={control.verticalAlignment === Control.VERTICAL_ALIGNMENT_BOTTOM} onClick={() => { control.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM; this.forceUpdate();}} />
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Position"} icon={positionIcon} lockObject={this.props.lockObject} label="X" target={control} propertyName="left" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Y" target={control} propertyName="top" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Scale"} icon={sizeIcon} lockObject={this.props.lockObject} label="W" target={control} propertyName="width" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {
                            if (control.typeName === "Image") {
                                (control as Image).autoScale = false;
                            };
                        }
                    }/>
                    <TextInputLineComponent lockObject={this.props.lockObject} label="H" target={control} propertyName="height" onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => {
                            if (control.typeName === "Image") {
                                (control as Image).autoScale = false;
                            };
                        }
                    }/>
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Vertical Margins"} icon={verticalMarginIcon} lockObject={this.props.lockObject} label="B" target={control} propertyName="paddingBottom" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="T" target={control} propertyName="paddingTop" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Horizontal Margins"} icon={horizontalMarginIcon} lockObject={this.props.lockObject} label="L" target={control} propertyName="paddingLeft" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="R" target={control} propertyName="paddingRight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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
                <SliderLineComponent icon={rotationIcon} label="R" target={control} propertyName="rotation" minimum={0} maximum={2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
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
                            if (newValue === "") {  (control as any).background = "Transparent" }
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
                    <TextInputLineComponent iconLabel={"Font Size"} icon={fontSizeIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <div className="divider">
                    <TextInputLineComponent iconLabel={"Font Weight"} icon={shadowBlurIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontWeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent iconLabel={"Font Style"} icon={fontStyleIcon} lockObject={this.props.lockObject} label="" target={control} propertyName="fontStyle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                {
                    this.renderGridInformation()
                }
            </div>
        );
    }
}