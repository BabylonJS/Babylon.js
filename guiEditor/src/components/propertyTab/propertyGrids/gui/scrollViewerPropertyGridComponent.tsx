import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { ColorLineComponent } from "../../../../sharedUiComponents/lines/colorLineComponent";
import { makeTargetsProxy } from "../../../../sharedUiComponents/lines/targetsProxy";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

interface IScrollViewerPropertyGridComponentProps {
    scrollViewers: ScrollViewer[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
    constructor(props: IScrollViewerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const scrollViewers = this.props.scrollViewers;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={this.props.lockObject}
                    controls={scrollViewers}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel="Stroke Weight"
                        icon={strokeWeightIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel="Corner Radius"
                        icon={conerRadiusIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                        propertyName="cornerRadius"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <hr />
                <TextLineComponent label="SCROLLVIEWER" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <FloatLineComponent
                        iconLabel={"Wheel precision"}
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                        propertyName="wheelPrecision"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel={"Bar size"}
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                        propertyName="barSize"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <ColorLineComponent
                    iconLabel={"Bar color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                    propertyName="barColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Bar background"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(scrollViewers, "", this.props.onPropertyChangedObservable)}
                    propertyName="barBackground"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
