import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Ellipse } from "gui/2D/controls/ellipse";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";

interface IEllipsePropertyGridComponentProps {
    ellipses: Ellipse[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class EllipsePropertyGridComponent extends React.Component<IEllipsePropertyGridComponentProps> {
    constructor(props: IEllipsePropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { ellipses, onPropertyChangedObservable, lockObject } = this.props;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={ellipses} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="ELLIPSE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Stroke Weight"
                        icon={strokeWeightIcon}
                        lockObject={lockObject}
                        label=""
                        target={makeTargetsProxy(ellipses, onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                        unit={"PX"}
                        unitLocked={true}
                    />
                </div>
                <ContainerPropertyGridComponent containers={ellipses} onPropertyChangedObservable={onPropertyChangedObservable} />
            </div>
        );
    }
}
