import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lines/lineContainerComponent";
import { TextLineComponent } from "../../../lines/textLineComponent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { Grid } from "babylonjs-gui/2D/controls/grid";
import { SliderLineComponent } from "../../../lines/sliderLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { LockObject } from "../../../tabs/propertyGrids/lockObject";
import { OptionsLineComponent } from "../../../lines/optionsLineComponent";

interface ICommonControlPropertyGridComponentProps {
    controls: Control[];
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
        const controls = this.props.controls;
        const control = this.props.controls[0];

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
                <LineContainerComponent title="GENERAL">
                    <TextLineComponent label="Class" value={control.getClassName()} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        targets={controls}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={control.uniqueId.toString()} />
                    <SliderLineComponent
                        label="Alpha"
                        targets={controls}
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
                            targets={controls}
                            propertyName="color"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    {(control as any).background !== undefined && (
                        <TextInputLineComponent
                            lockObject={this.props.lockObject}
                            label="Background"
                            targets={controls}
                            propertyName="background"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                    )}
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ZIndex"
                        targets={controls}
                        propertyName="zIndex"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                {this.renderGridInformation(control)}
                <LineContainerComponent title="ALIGNMENT">
                    <OptionsLineComponent
                        label="Horizontal"
                        options={horizontalOptions}
                        targets={controls}
                        propertyName="horizontalAlignment"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLineComponent
                        label="Vertical"
                        options={verticalOptions}
                        targets={controls}
                        propertyName="verticalAlignment"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="POSITION">
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Left"
                        targets={controls}
                        propertyName="left"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Top"
                        targets={controls}
                        propertyName="top"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Width"
                        targets={controls}
                        propertyName="width"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Height"
                        targets={controls}
                        propertyName="height"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding left"
                        targets={controls}
                        propertyName="paddingLeft"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding top"
                        targets={controls}
                        propertyName="paddingTop"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding right"
                        targets={controls}
                        propertyName="paddingRight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Padding bottom"
                        targets={controls}
                        propertyName="paddingBottom"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="TRANSFORMATION" closed={true}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ScaleX"
                        targets={controls}
                        propertyName="scaleX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="ScaleY"
                        targets={controls}
                        propertyName="scaleY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        label="Rotation"
                        targets={controls}
                        propertyName="rotation"
                        minimum={0}
                        maximum={2 * Math.PI}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Transform center X"
                        targets={controls}
                        propertyName="transformCenterX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Transform center Y"
                        targets={controls}
                        propertyName="transformCenterY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="FONT" closed={true}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Family"
                        targets={controls}
                        propertyName="fontFamily"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Size"
                        targets={controls}
                        propertyName="fontSize"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Weight"
                        targets={controls}
                        propertyName="fontWeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Style"
                        targets={controls}
                        propertyName="fontStyle"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="SHADOWS" closed={true}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        targets={controls}
                        propertyName="shadowColor"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Offset X"
                        targets={controls}
                        propertyName="shadowOffsetX"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Offset Y"
                        targets={controls}
                        propertyName="shadowOffsetY"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Blur"
                        targets={controls}
                        propertyName="shadowBlur"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
