import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../lockObject";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { GlobalState } from '../../../../globalState';

interface IEllipsePropertyGridComponentProps {
    globalState: GlobalState;
    ellipse: Ellipse,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
    constructor(props: IEllipsePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const ellipse = this.props.ellipse;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} control={ellipse} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="ELLIPSE">
                    <CheckBoxLineComponent label="Clip children" target={ellipse} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={ellipse} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}