import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { LockObject } from "../lockObject";
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";
import { GlobalState } from '../../../../globalState';

interface ICommonControlPropertyGridComponentProps {
    globalState: GlobalState;
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
            <LineContainerComponent globalState={this.props.globalState} title="GRID">
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
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextLineComponent label="Class" value={control.getClassName()} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={control} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={control.uniqueId.toString()} />
                    <SliderLineComponent label="Alpha" target={control} propertyName="alpha" minimum={0} maximum={1} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        (control as any).color !== undefined &&
                        <TextInputLineComponent lockObject={this.props.lockObject} label="Color" target={control} propertyName="color" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    {
                        (control as any).background !== undefined &&
                        <TextInputLineComponent lockObject={this.props.lockObject} label="Background" target={control} propertyName="background" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                </LineContainerComponent>
                {
                    this.renderGridInformation()
                }
                <LineContainerComponent globalState={this.props.globalState} title="ALIGNMENT">
                    <OptionsLineComponent label="Horizontal" options={horizontalOptions} target={control} propertyName="horizontalAlignment" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Vertical" options={verticalOptions} target={control} propertyName="verticalAlignment" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="POSITION">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Left" target={control} propertyName="left" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Top" target={control} propertyName="top" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Width" target={control} propertyName="width" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Height" target={control} propertyName="height" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Padding left" target={control} propertyName="paddingLeft" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Padding top" target={control} propertyName="paddingTop" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Padding right" target={control} propertyName="paddingRight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Padding bottom" target={control} propertyName="paddingBottom" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TRANSFORMATION" closed={true}>
                    <FloatLineComponent lockObject={this.props.lockObject} label="ScaleX" target={control} propertyName="scaleX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="ScaleY" target={control} propertyName="scaleY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Rotation" target={control} propertyName="rotation" minimum={0} maximum={2 * Math.PI} step={0.01} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Transform center X" target={control} propertyName="transformCenterX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Transform center Y" target={control} propertyName="transformCenterY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="FONT" closed={true}>
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Family" target={control} propertyName="fontFamily" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Size" target={control} propertyName="fontSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Weight" target={control} propertyName="fontWeight" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Style" target={control} propertyName="fontStyle" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="SHADOWS" closed={true}>
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Color" target={control} propertyName="shadowColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Offset X" target={control} propertyName="shadowOffsetX" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Offset Y" target={control} propertyName="shadowOffsetY" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Blur" target={control} propertyName="shadowBlur" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}