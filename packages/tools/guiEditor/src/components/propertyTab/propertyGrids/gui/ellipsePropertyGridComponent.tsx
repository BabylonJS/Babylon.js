import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Ellipse } from "babylonjs-gui/2D/controls/ellipse";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

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
        const {ellipses, onPropertyChangedObservable, lockObject} = this.props;

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
                <ContainerPropertyGridComponent containers={ellipses} onPropertyChangedObservable={onPropertyChangedObservable}/>
            </div>
        );
    }
}
