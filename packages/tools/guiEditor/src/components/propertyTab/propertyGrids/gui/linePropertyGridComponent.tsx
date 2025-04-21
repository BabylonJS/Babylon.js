import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "shared-ui-components/propertyChangedEvent";
import { CommonControlPropertyGridComponent } from "../gui/commonControlPropertyGridComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { Line } from "gui/2D/controls/line";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { makeTargetsProxy } from "shared-ui-components/lines/targetsProxy";

import strokeWeightIcon from "shared-ui-components/imgs/strokeWeightIcon.svg";
import linePoint1Icon from "shared-ui-components/imgs/linePoint1Icon.svg";
import linePoint2Icon from "shared-ui-components/imgs/linePoint2Icon.svg";
import lineDashIcon from "shared-ui-components/imgs/lineDashIcon.svg";
import { IconComponent } from "shared-ui-components/lines/iconComponent";
import { UnitButton } from "shared-ui-components/lines/unitButton";
import type { GlobalState } from "../../../../globalState";

interface ILinePropertyGridComponentProps {
    lines: Line[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onFontsParsedObservable?: Observable<void>;
    globalState?: GlobalState;
}

export class LinePropertyGridComponent extends React.Component<ILinePropertyGridComponentProps> {
    constructor(props: ILinePropertyGridComponentProps) {
        super(props);
    }

    onDashChange(value: string) {
        const split = value.split(",");
        for (const line of this.props.lines) {
            line.dash = [];

            for (const v of split) {
                const int = parseInt(v);

                if (isNaN(int)) {
                    return;
                }

                line.dash.push(int);
            }
        }
        this.forceUpdate();
    }

    override render() {
        const { lines, onPropertyChangedObservable, lockObject } = this.props;
        const proxy = makeTargetsProxy(lines, onPropertyChangedObservable);
        let dashes = lines[0].dash;
        for (const line of lines) {
            if (dashes.length === 0) break;
            if (line.dash.length !== dashes.length) {
                dashes = [];
            }
            for (let i = 0; i < dashes.length; i++) {
                const dash = dashes[i];
                if (line.dash[i] !== dash) {
                    dashes = [];
                }
            }
        }
        const dashString = dashes.join(",");

        return (
            <div className="pane">
                <TextLineComponent label="LINE" value=" " color="grey"></TextLineComponent>
                <div className="ge-divider double">
                    <IconComponent icon={linePoint1Icon} label={"Position 1"} />
                    <TextInputLineComponent lockObject={lockObject} label="X" target={proxy} propertyName="x1" />
                    <TextInputLineComponent lockObject={lockObject} label="Y" target={proxy} propertyName="y1" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={linePoint2Icon} label={"Position 2"} />
                    <TextInputLineComponent lockObject={lockObject} label="X" target={proxy} propertyName="x2" />
                    <TextInputLineComponent lockObject={lockObject} label="Y" target={proxy} propertyName="y2" />
                </div>
                <div className="ge-divider double">
                    <IconComponent icon={strokeWeightIcon} label={"Line Width"} />
                    <FloatLineComponent lockObject={lockObject} label="" target={proxy} propertyName="lineWidth" unit={<UnitButton unit="PX" locked />} min={0} arrows={true} />
                </div>
                <div className="ge-divider">
                    <IconComponent icon={lineDashIcon} label={"Dash Pattern"} />
                    <TextInputLineComponent lockObject={lockObject} label="" target={proxy} value={dashString} onChange={(newValue) => this.onDashChange(newValue)} />
                </div>
                <hr />
                <CommonControlPropertyGridComponent
                    hideDimensions
                    lockObject={lockObject}
                    controls={lines}
                    onPropertyChangedObservable={onPropertyChangedObservable}
                    onFontsParsedObservable={this.props.onFontsParsedObservable}
                    globalState={this.props.globalState}
                />
            </div>
        );
    }
}
