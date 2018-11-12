import * as React from "react";
import { Observable } from "babylonjs";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";

interface IControlPropertyGridComponentProps {
    control: Control,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
    constructor(props: IControlPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const control = this.props.control;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent control={control} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}