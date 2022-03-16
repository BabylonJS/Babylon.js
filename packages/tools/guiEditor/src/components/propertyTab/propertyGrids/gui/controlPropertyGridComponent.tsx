import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { Control } from "gui/2D/controls/control";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

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
