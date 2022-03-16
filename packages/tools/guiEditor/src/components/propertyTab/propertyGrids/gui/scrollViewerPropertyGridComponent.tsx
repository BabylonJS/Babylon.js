import * as React from "react";
import { Observable } from "core/Misc/observable";
import { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { ScrollViewer } from "gui/2D/controls/scrollViewers/scrollViewer";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import sizeIcon from "shared-ui-components/imgs/sizeIcon.svg";
import conerRadiusIcon from "shared-ui-components/imgs/conerRadiusIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";

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
                        target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
                        propertyName="thickness"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel="Corner Radius"
                        icon={conerRadiusIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
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
                        target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
                        propertyName="wheelPrecision"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        iconLabel={"Bar size"}
                        icon={sizeIcon}
                        lockObject={this.props.lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
                        propertyName="barSize"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </div>
                <ColorLineComponent
                    iconLabel={"Bar color"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
                    propertyName="barColor"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
                <ColorLineComponent
                    iconLabel={"Bar background"}
                    icon={fillColorIcon}
                    lockObject={this.props.lockObject}
                    label=""
                    target={makeTargetsProxy(scrollViewers, this.props.onPropertyChangedObservable)}
                    propertyName="barBackground"
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </div>
        );
    }
}
