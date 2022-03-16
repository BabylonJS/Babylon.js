import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { StackPanel } from "gui/2D/controls/stackPanel";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import verticalMarginIcon from "shared-ui-components/imgs/verticalMarginIcon.svg";

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
        const { stackPanels, lockObject, onPropertyChangedObservable } = this.props;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={stackPanels} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="STACKPANEL" value=" " color="grey"></TextLineComponent>
                <ContainerPropertyGridComponent containers={stackPanels} onPropertyChangedObservable={onPropertyChangedObservable} />

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
                    onChange={() => stackPanels.forEach((panel) => panel._markAsDirty())}
                />
            </div>
        );
    }
}
