import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { Control } from "babylonjs-gui/2D/controls/control";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";

interface IControlPropertyGridComponentProps {
    controls: Control[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ControlPropertyGridComponent extends React.Component<IControlPropertyGridComponentProps> {
    constructor(props: IControlPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const controls = this.props.controls;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={controls} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}
