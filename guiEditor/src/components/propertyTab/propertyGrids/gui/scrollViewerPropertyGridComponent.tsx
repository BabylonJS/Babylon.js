import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/color3LineComponent";

const fillColorIcon: string = require("../../../../sharedUiComponents/imgs/fillColorIcon.svg");
const sizeIcon: string = require("../../../../sharedUiComponents/imgs/sizeIcon.svg");
const conerRadiusIcon: string = require("../../../../sharedUiComponents/imgs/conerRadiusIcon.svg");;
const strokeWeightIcon: string = require("../../../../sharedUiComponents/imgs/strokeWeightIcon.svg");

interface IScrollViewerPropertyGridComponentProps {
    scrollViewer: ScrollViewer,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
    constructor(props: IScrollViewerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const scrollViewer = this.props.scrollViewer;

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent lockObject={this.props.lockObject} control={scrollViewer} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="RECTANGLE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                <FloatLineComponent iconLabel="Stroke Weight" icon={strokeWeightIcon} lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel="Corner Radius" icon={conerRadiusIcon} lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <hr />
                <TextLineComponent label="SCROLLVIEWER" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                <FloatLineComponent iconLabel={"Wheel precision"} icon={sizeIcon} lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="wheelPrecision" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent iconLabel={"Bar size"} icon={sizeIcon}  lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="barSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </div>
                <Color3LineComponent iconLabel={"Bar color"} icon={fillColorIcon}  lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="barColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent iconLabel={"Bar background"} icon={fillColorIcon}  lockObject={this.props.lockObject} label="" target={scrollViewer} propertyName="barBackground" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}