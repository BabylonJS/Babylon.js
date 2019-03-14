import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "./commonControlPropertyGridComponent";
import { LockObject } from "../lockObject";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { GlobalState } from '../../../../globalState';

interface IStackPanelPropertyGridComponentProps {
    globalState: GlobalState;
    stackPanel: StackPanel,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
    constructor(props: IStackPanelPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const stackPanel = this.props.stackPanel;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent globalState={this.props.globalState} lockObject={this.props.lockObject} control={stackPanel} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <LineContainerComponent globalState={this.props.globalState} title="STACKPANEL">
                    <CheckBoxLineComponent label="Clip children" target={stackPanel} propertyName="clipChildren" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Vertical" target={stackPanel} propertyName="isVertical" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}