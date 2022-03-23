import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Rectangle } from "gui/2D/controls/rectangle";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import cornerRadiusIcon from "shared-ui-components/imgs/conerRadiusIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

interface IRectanglePropertyGridComponentProps {
    rectangles: Rectangle[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class RectanglePropertyGridComponent extends React.Component<IRectanglePropertyGridComponentProps> {
    constructor(props: IRectanglePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { rectangles, lockObject, onPropertyChangedObservable } = this.props;
        const proxy = makeTargetsProxy(rectangles, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={rectangles} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Stroke Weight"} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="thickness" unit="PX" unitLocked arrows min={0} digits={2} />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={cornerRadiusIcon} label={"Corner Radius"} />
                    <FloatLineComponent lockObject={lockObject} label="" target={proxy} propertyName="cornerRadius" unit="PX" unitLocked arrows min={0} digits={2} />
                </div>
                <ContainerPropertyGridComponent containers={rectangles} onPropertyChangedObservable={onPropertyChangedObservable} />
            </div>
        );
    }
}
