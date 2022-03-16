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
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

const verticalMarginIcon: string = require("../../../../sharedUiComponents/imgs/verticalMarginIcon.svg");

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
        const {stackPanels, lockObject, onPropertyChangedObservable} = this.props;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={stackPanels} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="STACKPANEL" value=" " color="grey"></TextLineComponent>
                <ContainerPropertyGridComponent containers={stackPanels} onPropertyChangedObservable={onPropertyChangedObservable}/>

                <CheckBoxLineComponent
                    iconLabel={"Vertical"}
                    icon={verticalMarginIcon}
                    label="VERTICAL"
                    target={makeTargetsProxy(stackPanels, onPropertyChangedObservable)}
                    propertyName="isVertical"
                    onPropertyChangedObservable={onPropertyChangedObservable}
                />
                <FloatLineComponent
                    lockObject={lockObject}
                    label=""
                    icon={verticalMarginIcon}
                    iconLabel="spacing"
                    target={makeTargetsProxy(stackPanels, onPropertyChangedObservable)}
                    propertyName="spacing"
                    defaultValue={0}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onChange={() => stackPanels.forEach(panel => panel._markAsDirty())}
                />
            </div>
        );
    }
}
