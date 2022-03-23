import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { Ellipse } from "gui/2D/controls/ellipse";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";

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
        const proxy = makeTargetsProxy(ellipses, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={ellipses} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="ELLIPSE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Stroke Weight"} />
                    <FloatLineComponent
                        lockObject={lockObject}
                        label=""
                        target={proxy}
                        propertyName="thickness"
                        unit={"PX"}
                        unitLocked={true}
                        arrows={true}
                        min={0}
                        digits={2}
                        />
                </div>
                <ContainerPropertyGridComponent containers={ellipses} onPropertyChangedObservable={onPropertyChangedObservable} />
            </div>
        );
    }
}
