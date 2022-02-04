import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { StackPanel } from "babylonjs-gui/2D/controls/stackPanel";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");
const clipContentsIcon: string = require("../../../../sharedUiComponents/imgs/clipContentsIcon.svg");

interface IStackPanelPropertyGridComponentProps {
    stackPanels: StackPanel[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class StackPanelPropertyGridComponent extends React.Component<IStackPanelPropertyGridComponentProps> {
    constructor(props: IStackPanelPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const stackPanels = this.props.stackPanels;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={stackPanels} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="STACKPANEL" value=" " color="grey"></TextLineComponent>
                <CheckBoxLineComponent
                    iconLabel={"Clip children"}
                    icon={clipContentsIcon}
                    label="CLIP CHILDREN"
                    target={makeTargetsProxy(stackPanels, this.props.onPropertyChangedObservable)}
                    propertyName="clipChildren"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <CheckBoxLineComponent
                    iconLabel={"Vertical"}
                    icon={verticalMarginIcon}
                    label="VERTICAL"
                    target={makeTargetsProxy(stackPanels, this.props.onPropertyChangedObservable)}
                    propertyName="isVertical"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    lockObject={this.props.lockObject}
                    label=""
                    icon={verticalMarginIcon}
                    iconLabel="spacing"
                    target={makeTargetsProxy(stackPanels, this.props.onPropertyChangedObservable)}
                    propertyName="spacing"
                    defaultValue={0}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onChange={() => stackPanels.forEach(panel => panel._markAsDirty())}
                />
            </div>
        );
    }
}
