import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { Rectangle } from "babylonjs-gui/2D/controls/rectangle";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";
import { ContainerPropertyGridComponent } from "./containerPropertyGridComponent";

const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

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
        const {rectangles, lockObject, onPropertyChangedObservable} = this.props;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={lockObject} controls={rectangles} onPropertyChangedObservable={onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Stroke Weight"
                        icon={strokeWeightIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(rectangles, onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                        unit="PX"
                        unitLocked={true}
                    />
                </div>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Corner Radius"
                        icon={conerRadiusIcon}
                        lockObject={lockObject}
                        label=""
                        target={makeTargetsProxy(rectangles, onPropertyChangedObservable)}
                        propertyName="cornerRadius"
                        onPropertyChangedObservable={onPropertyChangedObservable}
                        unit="PX"
                        unitLocked={true}
                    />
                </div>
                <ContainerPropertyGridComponent containers={rectangles} onPropertyChangedObservable={onPropertyChangedObservable}/>
            </div>
        );
    }
}
