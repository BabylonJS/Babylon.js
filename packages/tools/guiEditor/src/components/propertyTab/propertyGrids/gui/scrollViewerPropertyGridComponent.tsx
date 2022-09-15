import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { ScrollViewer } from "gui/2D/controls/scrollViewers/scrollViewer";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ColorLineComponent } from "shared-ui-components/lines/colorLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import colorIcon from "shared-ui-components/imgs/colorIcon.svg";
import fillColorIcon from "shared-ui-components/imgs/fillColorIcon.svg";
import widthIcon from "shared-ui-components/imgs/widthIcon.svg"; // TODO: replace
import cornerRadiusIcon from "shared-ui-components/imgs/conerRadiusIcon.svg";
import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import scrollViewerPrecisionIcon from "shared-ui-components/imgs/scrollViewerPrecisionIcon.svg"; // TODO: replace
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface IScrollViewerPropertyGridComponentProps {
    scrollViewers: ScrollViewer[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class ScrollViewerPropertyGridComponent extends React.Component<IScrollViewerPropertyGridComponentProps> {
    constructor(props: IScrollViewerPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const { scrollViewers, onPropertyChangedObservable, lockObject } = this.props;
        const proxy = makeTargetsProxy(scrollViewers, onPropertyChangedObservable);

        return (
            <div className="pane">
                <CommonControlPropertyGridComponent
                    lockObject={lockObject}
                    controls={scrollViewers}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
                <hr />
                <TextLineComponent label="SCROLLVIEWER" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider">
                    <IconComponent icon={scrollViewerPrecisionIcon} label={"Wheel Precision"} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="wheelPrecision" arrows={true} min={0} digits={2} />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={widthIcon} label={"Bar Size"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        propertyName="barSize"
                        unit={<UnitButton unit="PX" locked />}
                        arrows
                        min={0}
                        digits={2}
                    />
                </div>
                <div className="e-divider">
                    <IconComponent icon={colorIcon} label="Bar Color" />
                    <ColorLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="barColor" />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={fillColorIcon} label="Bar Background Color" />
                    <ColorLineComponent lockObject={this.props.lockObject} label="" target={proxy} propertyName="barBackground" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Stroke Weight"} />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label=""
                        target={proxy}
                        propertyName="thickness"
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        min={0}
                        digits={2}
                    />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={cornerRadiusIcon} label={"Corner Radius"} />
                    <FloatLineComponent
                        lockObject={lockObject}
                        label=""
                        target={makeTargetsProxy(scrollViewers, onPropertyChangedObservable)}
                        propertyName="cornerRadius"
                        unit={<UnitButton unit="PX" locked />}
                        arrows={true}
                        min={0}
                        digits={2}
                    />
                </div>
            </div>
        );
    }
}
