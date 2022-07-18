import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { Control } from "gui/2D/controls/control";
import type { Grid } from "gui/2D/controls/grid";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import type { LockObject } from "../../../tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";
import { makeTargetsProxy } from "../../../lines/targetsProxy";

interface ICommonControlPropertyGridComponentProps {
    controls?: Control[];
    control?: Control;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonControlPropertyGridComponent extends React.Component<ICommonControlPropertyGridComponentProps> {
    constructor(props: ICommonControlPropertyGridComponentProps) {
        super(props);
    }

    renderGridInformation(control: Control) {
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
        let controls: Control[];
        if (this.props.controls) {
            controls = this.props.controls;
        } else if (this.props.control) {
            controls = [this.props.control];
        } else {
            return;
        }
        const control = controls[0];

        const horizontalOptions = [
            { label: "Left", value: Control.HORIZONTAL_ALIGNMENT_LEFT },
            { label: "Right", value: Control.HORIZONTAL_ALIGNMENT_RIGHT },
            { label: "Center", value: Control.HORIZONTAL_ALIGNMENT_CENTER },
        ];

        const verticalOptions = [
            { label: "Top", value: Control.VERTICAL_ALIGNMENT_TOP },
            { label: "Bottom", value: Control.VERTICAL_ALIGNMENT_BOTTOM },
            { label: "Center", value: Control.VERTICAL_ALIGNMENT_CENTER },
        ];

        return (
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Class" value={control.getClassName()} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={control.uniqueId.toString()} />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Alpha"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="alpha"
                        minimum={0}
                        maximum={1}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {(control as any).color !== undefined && (
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            label="Color"
                            target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                            propertyName="color"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {(control as any).background !== undefined && (
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            label="Background"
                            target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                            propertyName="background"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ZIndex"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="zIndex"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {this.renderGridInformation(control)}
                <LineContainerComponent title="ALIGNMENT">
                    <OptionsLineComponent
                        label="Horizontal"
                        options={horizontalOptions}
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="horizontalAlignment"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLineComponent
                        label="Vertical"
                        options={verticalOptions}
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="verticalAlignment"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="POSITION">
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Left"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="left"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Top"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="top"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Width"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="width"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Height"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="height"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding left"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="paddingLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding top"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="paddingTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding right"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="paddingRight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding bottom"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="paddingBottom"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSFORMATION" closed={true}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ScaleX"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="scaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ScaleY"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="scaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Rotation"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="rotation"
                        minimum={0}
                        maximum={2 * Math.PI}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Transform center X"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="transformCenterX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Transform center Y"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="transformCenterY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="FONT" closed={true}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Family"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="fontFamily"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Size"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="fontSize"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Weight"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="fontWeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Style"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="fontStyle"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="SHADOWS" closed={true}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="shadowColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Offset X"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="shadowOffsetX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Offset Y"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="shadowOffsetY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Blur"
                        target={makeTargetsProxy(controls, this.props.onPropertyChangedObservable)}
                        propertyName="shadowBlur"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
