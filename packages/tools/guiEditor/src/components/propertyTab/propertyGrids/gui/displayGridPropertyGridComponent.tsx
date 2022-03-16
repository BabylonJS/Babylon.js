import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { DisplayGrid } from "gui/2D/controls/displayGrid";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import conerRadiusIcon from "shared-ui-components/imgs/conerRadiusIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";

interface IDisplayGridPropertyGridComponentProps {
    displayGrids: DisplayGrid[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class DisplayGridPropertyGridComponent extends React.Component<IDisplayGridPropertyGridComponentProps> {
    constructor(props: IDisplayGridPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const displayGrids = this.props.displayGrids;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} controls={displayGrids} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="DISPLAY GRID" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Cell Size"}
                        icon={sizeIcon}
                        min={1}
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        label="W"
                        target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                        propertyName="cellWidth"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        min={1}
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        label="H"
                        target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                        propertyName="cellHeight"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <FloatLineComponent
                    iconLabel={"Minor Line Tickness"}
                    icon={strokeWeightIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                    propertyName="minorLineTickness"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Minor Line Color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                    propertyName="minorLineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Major Line Tickness"}
                    icon={strokeWeightIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                    propertyName="majorLineTickness"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Major Line Color"}
                    icon={colorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                    propertyName="majorLineColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <FloatLineComponent
                    iconLabel={"Major Line Frequency"}
                    icon={conerRadiusIcon}
                    min={1}
                    isInteger={true}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(displayGrids, this.props.onPropertyChangedObservable)}
                    propertyName="majorLineFrequency"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
