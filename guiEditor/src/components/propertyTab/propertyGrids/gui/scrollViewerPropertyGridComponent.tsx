import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../sharedUiComponents/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "../../../../sharedUiComponents/tabs/propertyGrids/lockObject";
import { ScrollViewer } from "babylonjs-gui/2D/controls/scrollViewers/scrollViewer";
import { FloatLineComponent } from "../../../../sharedUiComponents/lines/floatLineComponent";
import { TextLineComponent } from "../../../../sharedUiComponents/lines/textLineComponent";
import { Color3LineComponent } from "../../../../sharedUiComponents/lines/Color3LineComponent";

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
                <FloatLineComponent lockObject={this.props.lockObject} label="Thickness" target={scrollViewer} propertyName="thickness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Corner radius" target={scrollViewer} propertyName="cornerRadius" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <hr />
                <TextLineComponent label="SCROLLVIEWER" value=" " color="grey"></TextLineComponent>
                <FloatLineComponent lockObject={this.props.lockObject} label="Bar size" target={scrollViewer} propertyName="barSize" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent lockObject={this.props.lockObject} label="Bar color" target={scrollViewer} propertyName="barColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <Color3LineComponent lockObject={this.props.lockObject} label="Bar background" target={scrollViewer} propertyName="barBackground" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                <FloatLineComponent lockObject={this.props.lockObject} label="Wheel precision" target={scrollViewer} propertyName="wheelPrecision" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
            </div>
        );
    }
}