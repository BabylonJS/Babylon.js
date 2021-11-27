import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";

const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");

interface IStackPanelPropertyGridComponentProps {
    stackPanel: StackPanel;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
    constructor(props: IStackPanelPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const stackPanel = this.props.stackPanel;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={stackPanel} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="STACKPANEL" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent
                    iconLabel={"Clip children"}
                    icon={clipContentsIcon}
                    label="CLIP CHILDREN"
                    target={stackPanel}
                    propertyName="clipChildren"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Vertical"}
                    icon={verticalMarginIcon}
                    label="VERTICAL"
                    target={stackPanel}
                    propertyName="isVertical"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
